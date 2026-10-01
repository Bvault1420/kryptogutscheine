import { z } from 'zod';
import { ALLOWED_PAYMENT_METHODS } from './paymentMethods.js';
import { MAX_VOUCHER_AMOUNT, isAmountWithinLimit } from './voucherLimits.js';

const productIdRegex = /^[a-zA-Z0-9_\-<>]+$/;

export { productIdRegex };

export const productIdsQuerySchema = z.object({
  ids: z
    .string()
    .max(4096)
    .transform((raw) =>
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 120)
    )
    .pipe(z.array(z.string().min(1).max(128).regex(productIdRegex)).max(120)),
});

export const productListSchema = z.object({
  start: z.coerce.number().int().min(0).max(10000).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  country: z
    .string()
    .regex(/^[A-Z]{2}(,[A-Z]{2})*$/)
    .optional(),
  category: z.string().max(200).optional(),
  search: z.string().min(1).max(100).optional(),
});

export const productIdSchema = z.object({
  id: z.string().min(1).max(128).regex(productIdRegex, 'Ungültige Produkt-ID'),
});

const paymentMethodSchema = z
  .enum(ALLOWED_PAYMENT_METHODS)
  .optional()
  .default('lightning');

const invoiceItemSchema = z
  .object({
    productId: z.string().min(1).max(128).regex(productIdRegex),
    quantity: z.number().int().min(1).max(5).optional().default(1),
    value: z.number().positive().max(MAX_VOUCHER_AMOUNT).optional(),
    packageId: z.string().max(256).optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,20}$/, 'Ungültige Telefonnummer')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.value !== undefined && !isAmountWithinLimit(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Betrag darf maximal ${MAX_VOUCHER_AMOUNT} sein.`,
        path: ['value'],
      });
    }
    if (data.value === undefined && data.packageId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entweder value oder packageId ist erforderlich.',
        path: ['value'],
      });
    }
  });

export const createInvoiceSchema = z
  .object({
    productId: z.string().min(1).max(128).regex(productIdRegex).optional(),
    quantity: z.number().int().min(1).max(5).optional().default(1),
    value: z.number().positive().max(MAX_VOUCHER_AMOUNT).optional(),
    packageId: z.string().max(256).optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,20}$/, 'Ungültige Telefonnummer')
      .optional(),
    items: z.array(invoiceItemSchema).min(1).max(10).optional(),
    paymentMethod: paymentMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (data.items && data.items.length) return;
    if (!data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'productId oder items ist erforderlich.',
        path: ['productId'],
      });
      return;
    }
    if (data.value === undefined && data.packageId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entweder value oder packageId ist erforderlich.',
        path: ['value'],
      });
    }
    if (data.value !== undefined && !isAmountWithinLimit(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Betrag darf maximal ${MAX_VOUCHER_AMOUNT} sein.`,
        path: ['value'],
      });
    }
  });

export const invoiceIdSchema = z.object({
  id: z.string().uuid({ message: 'Ungültige Rechnungs-ID' }),
});

export const orderIdSchema = z.object({
  id: z.string().min(8).max(128),
});

export function sanitizeString(input, maxLen = 256) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>"'&]/g, '').slice(0, maxLen);
}
