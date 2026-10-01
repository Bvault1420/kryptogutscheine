import { api } from '../src/api.js';
import { escapeHtml } from '../src/utils.js';

export async function renderNewsletterConfirm(container, query) {
  const token = query.get('token');

  container.innerHTML = `
    <div class="page-container py-16">
      <div class="card mx-auto max-w-md text-center">
        <h1 class="section-title">Newsletter bestätigen</h1>
        <p id="confirm-status" class="mt-4 text-content-muted">Wird bestätigt…</p>
      </div>
    </div>`;

  const status = document.getElementById('confirm-status');
  if (!token) {
    status.textContent = 'Ungültiger Link – kein Token.';
    status.classList.add('text-red-600');
    return;
  }

  try {
    const result = await api.confirmNewsletter(token);
    status.textContent = result.message || 'Anmeldung bestätigt!';
    status.classList.add('text-emerald-600');
  } catch (err) {
    status.innerHTML = `<span class="text-red-600">${escapeHtml(err.message)}</span>`;
  }
}
