import {

  PAYMENT_FAMILIES,

  getPaymentMethod,

  getFamilyForMethod,

} from '../src/paymentMethods.js';

import { escapeHtml } from '../src/utils.js';

import { t } from '../src/i18n.js';



function renderSelectedSummary(method) {

  const family = getFamilyForMethod(method.id);

  return `

    <div id="payment-selected-summary" class="rounded-2xl border-2 border-brand-500/40 bg-brand-50/50 p-4 dark:bg-brand-950/20">

      <div class="flex items-start gap-3">

        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-md"

              style="background:${escapeHtml(family.color)}">${escapeHtml(family.icon)}</span>

        <div class="min-w-0 flex-1">

          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Ausgewählt</p>

          <p class="font-display text-lg font-bold text-content">${escapeHtml(method.checkoutLabel || method.label)}</p>

          <p class="mt-0.5 text-sm text-content-muted">${escapeHtml(method.description)} · ${escapeHtml(method.speed || '')}</p>

        </div>

        ${method.tag ? `<span class="shrink-0 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">${escapeHtml(method.tag)}</span>` : ''}

      </div>

      <p id="payment-method-hint" class="mt-3 rounded-lg bg-surface/80 px-3 py-2 text-xs leading-relaxed text-content-muted">${escapeHtml(method.hint)}</p>

    </div>`;

}



function renderNetworkPanel(family, selectedId) {

  if (family.options.length <= 1) return '';



  return `

    <div class="payment-network-panel mt-3 rounded-xl border border-theme bg-surface-elevated/80 p-3"

         data-family-panel="${escapeHtml(family.id)}"

         ${getFamilyForMethod(selectedId).id === family.id ? '' : 'hidden'}>

      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">

        ${escapeHtml(family.label)} – Netzwerk wählen

      </p>

      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="${escapeHtml(family.label)} Netzwerk">

        ${family.options

          .map((opt) => {

            const active = opt.id === selectedId;

            const meta = getPaymentMethod(opt.id);

            return `

            <button type="button"

                    data-payment-method="${escapeHtml(opt.id)}"

                    role="radio"

                    aria-checked="${active}"

                    class="payment-network-chip inline-flex flex-col items-start rounded-xl border px-3 py-2 text-left transition ${

                      active

                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/25 dark:bg-brand-950/40'

                        : 'border-theme bg-surface hover:border-brand-400'

                    }">

              <span class="text-sm font-semibold text-content">${escapeHtml(opt.network)}</span>

              <span class="text-[10px] text-content-muted">${escapeHtml(opt.speed)}${opt.tag ? ` · ${escapeHtml(opt.tag)}` : ''}</span>

            </button>`;

          })

          .join('')}

      </div>

    </div>`;

}



export function renderPaymentMethodPicker(selectedId) {

  const method = getPaymentMethod(selectedId);

  const activeFamilyId = getFamilyForMethod(selectedId).id;



  return `

    <div class="payment-picker space-y-4" aria-label="${t('checkout.selectCrypto')}">

      <input type="hidden" id="payment-method" value="${escapeHtml(selectedId)}" />



      ${renderSelectedSummary(method)}



      <div>

        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">Kryptowährung</p>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup" aria-label="Kryptowährung wählen">

          ${PAYMENT_FAMILIES.map((family) => {

            const isActive = family.id === activeFamilyId;

            const single = family.options.length === 1;

            const singleId = single ? family.options[0].id : '';

            return `

            <button type="button"

                    ${single ? `data-payment-method="${escapeHtml(singleId)}"` : `data-payment-family="${escapeHtml(family.id)}"`}

                    role="radio"

                    aria-checked="${isActive}"

                    class="payment-family-card flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${

                      isActive

                        ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/25 dark:bg-brand-950/30'

                        : 'border-theme bg-surface hover:border-brand-400 hover:bg-surface-elevated'

                    }">

              <span class="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"

                    style="background:${escapeHtml(family.color)}">${escapeHtml(family.icon)}</span>

              <span class="text-sm font-semibold leading-tight text-content">${escapeHtml(family.label)}</span>

              <span class="text-[10px] leading-snug text-content-muted">${escapeHtml(family.summary)}</span>

              ${!single ? `<span class="text-[10px] font-medium text-brand-600 dark:text-brand-400">${family.options.length} Netzwerke</span>` : ''}

            </button>`;

          }).join('')}

        </div>

      </div>



      ${PAYMENT_FAMILIES.map((f) => renderNetworkPanel(f, selectedId)).join('')}

    </div>`;

}



function applySelection(id) {

  const hidden = document.getElementById('payment-method');

  if (hidden) hidden.value = id;



  const method = getPaymentMethod(id);

  const family = getFamilyForMethod(id);



  document.querySelectorAll('[data-payment-family]').forEach((btn) => {

    const active = btn.dataset.paymentFamily === family.id;

    btn.setAttribute('aria-checked', active ? 'true' : 'false');

    btn.classList.toggle('border-brand-500', active);

    btn.classList.toggle('bg-brand-50/80', active);

    btn.classList.toggle('ring-2', active);

    btn.classList.toggle('ring-brand-500/25', active);

    btn.classList.toggle('border-theme', !active);

    btn.classList.toggle('bg-surface', !active);

  });



  document.querySelectorAll('[data-payment-method]').forEach((btn) => {

    const active = btn.dataset.paymentMethod === id;

    btn.setAttribute('aria-checked', active ? 'true' : 'false');

    btn.classList.toggle('border-brand-500', active);

    btn.classList.toggle('bg-brand-50', active);

    btn.classList.toggle('ring-2', active);

    btn.classList.toggle('ring-brand-500/25', active);

    btn.classList.toggle('border-theme', !active);

    btn.classList.toggle('bg-surface', !active);

  });



  document.querySelectorAll('[data-family-panel]').forEach((panel) => {

    panel.hidden = panel.dataset.familyPanel !== family.id || family.options.length <= 1;

  });



  const summary = document.getElementById('payment-selected-summary');

  if (summary) {

    summary.outerHTML = renderSelectedSummary(method);

  } else {

    const hint = document.getElementById('payment-method-hint');

    if (hint) hint.textContent = method.hint;

  }

}



export function bindPaymentMethodPicker(onChange) {

  const picker = document.querySelector('.payment-picker');

  if (!picker) return;



  picker.addEventListener('click', (e) => {

    const methodBtn = e.target.closest('[data-payment-method]');

    if (methodBtn) {

      const id = methodBtn.dataset.paymentMethod;

      applySelection(id);

      onChange?.(id);

      return;

    }



    const familyBtn = e.target.closest('[data-payment-family]');

    if (familyBtn) {

      const familyId = familyBtn.dataset.paymentFamily;

      const family = PAYMENT_FAMILIES.find((f) => f.id === familyId);

      if (!family || family.options.length <= 1) return;



      document.querySelectorAll('[data-family-panel]').forEach((panel) => {

        panel.hidden = panel.dataset.familyPanel !== familyId;

      });



      familyBtn.setAttribute('aria-checked', 'true');

      document.querySelectorAll('[data-payment-family]').forEach((b) => {

        if (b !== familyBtn) b.setAttribute('aria-checked', 'false');

      });



      const current = document.getElementById('payment-method')?.value;

      const inFamily = family.options.some((o) => o.id === current);

      if (!inFamily) {

        const first = family.options[0].id;

        applySelection(first);

        onChange?.(first);

      } else {

        applySelection(current);

      }

    }

  });

}


