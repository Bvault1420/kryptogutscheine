/**
 * Zuverlässiger Dev-Start für Windows/macOS/Linux:
 * - bindet an 127.0.0.1 (kein IPv6-localhost-Problem unter Windows)
 * - befreit Ports 3002 + 5320 von Zombie-Prozessen
 * - startet Backend mit Auto-Restart (--watch)
 * - startet Frontend neu bei Absturz
 * - wartet bis die Seite erreichbar ist und öffnet den Browser
 * - überwacht Health und startet bei Ausfall neu
 */
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const BACKEND_PORT = 3002;
const FRONTEND_PORT = 5320;
const FRONTEND_URL = `http://${HOST}:${FRONTEND_PORT}/`;
const URL_FILE = path.join(ROOT, '.redeemx-url');

const children = [];
let shuttingDown = false;
const restartCounts = new Map();
const MAX_RESTARTS = 8;
const RESTART_WINDOW_MS = 120_000;

function log(msg) {
  console.log(`[redeemx-dev] ${msg}`);
}

function canRestart(name) {
  const now = Date.now();
  const entry = restartCounts.get(name) || { count: 0, since: now };
  if (now - entry.since > RESTART_WINDOW_MS) {
    restartCounts.set(name, { count: 0, since: now });
    return true;
  }
  return entry.count < MAX_RESTARTS;
}

function recordRestart(name) {
  const now = Date.now();
  const entry = restartCounts.get(name) || { count: 0, since: now };
  if (now - entry.since > RESTART_WINDOW_MS) {
    restartCounts.set(name, { count: 1, since: now });
  } else {
    entry.count += 1;
    restartCounts.set(name, entry);
  }
}

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr ":${port} "`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          const tasklist = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          const lower = tasklist.toLowerCase();
          if (!lower.includes('node.exe') && !lower.includes('vite')) continue;
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          log(`Port ${port}: Prozess ${pid} beendet`);
        } catch {
          /* ignore */
        }
      }
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore', shell: true });
    }
  } catch {
    /* Port war frei */
  }
}

function httpOk(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode != null && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitReady(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const [be, fe] = await Promise.all([
      httpOk(`http://${HOST}:${BACKEND_PORT}/api/config`),
      httpOk(FRONTEND_URL),
    ]);
    if (be && fe) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    log(`Browser konnte nicht automatisch geöffnet werden – öffne manuell: ${url}`);
  }
}

function writeUrlFile() {
  try {
    fs.writeFileSync(URL_FILE, `${FRONTEND_URL}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function run(name, command, args, cwd, envExtra = {}, { restart = true } = {}) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...envExtra },
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    const idx = children.indexOf(child);
    if (idx >= 0) children.splice(idx, 1);

    if (shuttingDown) return;
    if (code === 0 && !signal) return;

    if (restart) {
      if (!canRestart(name)) {
        log(
          `${name} zu oft abgestürzt (${MAX_RESTARTS}× in ${RESTART_WINDOW_MS / 1000}s). Kein Auto-Neustart – bitte Fehler prüfen.`
        );
        return;
      }
      recordRestart(name);
      log(`${name} beendet (code=${code ?? signal}). Neustart in 2s…`);
      setTimeout(() => run(name, command, args, cwd, envExtra, { restart }), 2000);
    }
  });

  return child;
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log('Beende Dev-Server…');
  try {
    fs.unlinkSync(URL_FILE);
  } catch {
    /* ignore */
  }
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(0), 800);
}

async function healthMonitor() {
  while (!shuttingDown) {
    await new Promise((r) => setTimeout(r, 30_000));
    if (shuttingDown) break;

    const [be, fe] = await Promise.all([
      httpOk(`http://${HOST}:${BACKEND_PORT}/api/config`, 5000),
      httpOk(FRONTEND_URL, 5000),
    ]);

    if (!be) log('⚠ Backend antwortet nicht – prüfe Terminal.');
    if (!fe) log('⚠ Frontend antwortet nicht – prüfe Terminal.');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason?.message || reason}`);
});

log('RedeemX Localhost wird vorbereitet…');
log(`Hinweis: Port 5173 ist oft belegt (z. B. andere Projekte). RedeemX läuft auf Port ${FRONTEND_PORT}.`);
log('');

killPort(BACKEND_PORT);
killPort(FRONTEND_PORT);

log(`Starte Backend (${HOST}:${BACKEND_PORT}, Auto-Restart)…`);
const nodeOpts = [process.env.NODE_OPTIONS, '--use-system-ca'].filter(Boolean).join(' ');
run(
  'backend',
  'node',
  ['--use-system-ca', '--watch', 'server.js'],
  path.join(ROOT, 'backend'),
  {
    HOST,
    FRONTEND_URL: `http://${HOST}:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}`,
    NODE_OPTIONS: nodeOpts,
  }
);

setTimeout(() => {
  log(`Starte Frontend (${HOST}:${FRONTEND_PORT})…`);
  run(
    'frontend',
    'npx',
    ['vite', '--host', HOST, '--port', String(FRONTEND_PORT), '--strictPort'],
    path.join(ROOT, 'frontend')
  );

  waitReady().then((ok) => {
    writeUrlFile();
    if (ok) {
      log('');
      log('✓ RedeemX Localhost läuft!');
      log(`  → ${FRONTEND_URL}`);
      log(`  → Backend: http://${HOST}:${BACKEND_PORT}/api/config`);
      log('');
      log('Browser wird geöffnet…');
      log('Tipp: Fenster offen lassen. Bei Absturz startet automatisch neu.');
      log('Beenden: Strg+C');
      log('');
      openBrowser(FRONTEND_URL);
      healthMonitor();
    } else {
      log('⚠ Server antwortet noch nicht – prüfe Terminal auf Fehler.');
      log(`  Versuche trotzdem: ${FRONTEND_URL}`);
    }
  });
}, 1200);
