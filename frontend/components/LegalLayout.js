import { escapeHtml } from '../src/utils.js';

export function renderLegalPage({ title, subtitle, notice, sections, footerNote }) {
  return `
    <div class="page-container max-w-3xl legal-page">
      <h1 class="section-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="mt-4 text-content-muted">${subtitle}</p>` : ''}
      ${notice ? `<div class="legal-notice mt-6">${notice}</div>` : ''}
      <div class="mt-10 space-y-6 legal-sections">
        ${sections
          .map(
            (s) => `
          <section class="card-static">
            ${s.title ? `<h2 class="font-display text-lg font-semibold text-content">${escapeHtml(s.title)}</h2>` : ''}
            <div class="legal-prose mt-3 text-sm leading-relaxed text-content-muted">${s.body}</div>
          </section>`
          )
          .join('')}
      </div>
      ${
        footerNote
          ? `<p class="mt-8 text-xs text-content-muted">${footerNote}</p>`
          : ''
      }
    </div>`;
}
