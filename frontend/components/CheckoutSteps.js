const STEPS = ['Warenkorb', 'Zahlung', 'Lieferung'];

export function renderCheckoutSteps(activeStep = 0) {
  return `
    <nav aria-label="Checkout-Fortschritt" class="mb-8">
      <ol class="flex items-center justify-center gap-2 sm:gap-4">
        ${STEPS.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          const dotCls = done
            ? 'bg-brand-600 text-white'
            : active
              ? 'border-2 border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'border border-theme text-content-muted';
          const line = i < STEPS.length - 1
            ? `<div class="hidden h-px w-8 bg-theme sm:block sm:w-12 ${done ? 'bg-brand-600' : ''}"></div>`
            : '';
          return `
            <li class="flex items-center gap-2 sm:gap-4">
              <div class="flex items-center gap-2">
                <span class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${dotCls}">
                  ${done ? '✓' : i + 1}
                </span>
                <span class="hidden text-sm font-medium sm:inline ${active ? 'text-content' : 'text-content-muted'}">${label}</span>
              </div>
              ${line}
            </li>`;
        }).join('')}
      </ol>
    </nav>`;
}
