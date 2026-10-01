import { escapeHtml, showToast } from '../src/utils.js';
import { api } from '../src/api.js';

export function renderNewsletterSignup() {
  return `
    <section class="card mt-12 bg-gradient-to-br from-brand-600/10 to-brand-900/10 p-6 sm:p-8">
      <div class="mx-auto max-w-lg text-center">
        <h2 class="font-display text-xl font-semibold">Deal-Alerts</h2>
        <p class="mt-2 text-sm text-content-muted">Erfahre als Erster von neuen Cashback-Angeboten und Rabatten.</p>
        <form id="newsletter-form" class="mt-4 space-y-3">
          <div class="flex gap-2">
            <input type="email" id="newsletter-email" placeholder="deine@email.de" class="input-field flex-1" required />
            <button type="submit" class="btn-primary shrink-0">Anmelden</button>
          </div>
          <label class="flex cursor-pointer items-start gap-2 text-left text-xs text-content-muted">
            <input type="checkbox" id="newsletter-consent" class="mt-0.5 shrink-0 rounded border-theme" required />
            <span>
              Ich willige ein, Deal-E-Mails zu erhalten, und habe die
              <a href="#/datenschutz" data-nav="/datenschutz" class="text-brand-600 hover:underline dark:text-brand-400">Datenschutzerklärung</a>
              gelesen. Abmeldung jederzeit möglich.
            </span>
          </label>
        </form>
        <p class="mt-2 text-xs text-content-muted">Kein Spam.</p>
      </div>
    </section>`;
}

export function bindNewsletterSignup() {
  document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email')?.value.trim();
    if (!email) return;
    if (!document.getElementById('newsletter-consent')?.checked) {
      showToast('Bitte Datenschutz-Einwilligung bestätigen.', 'error');
      return;
    }
    try {
      const result = await api.subscribeNewsletter(email);
      if (result.pending) {
        showToast(result.message || 'Bitte E-Mail bestätigen.');
        if (result.confirmUrl) {
          const link = document.createElement('p');
          link.className = 'mt-3 break-all text-xs text-brand-600 dark:text-brand-400';
          link.innerHTML = `Dev: <a href="${escapeHtml(result.confirmUrl)}" class="underline">Bestätigungslink</a>`;
          e.target.appendChild(link);
        }
      } else {
        showToast(result.message || 'Erfolgreich angemeldet!');
      }
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
