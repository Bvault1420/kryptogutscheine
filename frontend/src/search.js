const RECENT_KEY = 'Kryptogutscheine_recent_searches';
const MAX = 8;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(q) {
  const term = q.trim();
  if (!term) return;
  const list = getRecentSearches().filter((s) => s.toLowerCase() !== term.toLowerCase());
  list.unshift(term);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}
