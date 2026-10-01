import { bitrefillService, isTestCatalogMode } from '../services/bitrefillService.js';
import { createInvoiceSchema, invoiceIdSchema, orderIdSchema } from '../utils/validate.js';
import { isAllowedProduct } from '../utils/productFilter.js';
import { isCuratedProductIdAnyCountry } from '../utils/curatedCatalog.js';
import { BitrefillError, AppError } from '../utils/errors.js';
import { saveOrder, updateOrderStatus, getAllOrders, getOrder, trackEvent } from '../storage/store.js';
import { assertCanCreateInvoice } from '../utils/pendingPayments.js';
import { cacheStats } from '../utils/cache.js';
import { generateAccessToken } from '../utils/crypto.js';
import { getClientIp } from '../utils/clientIp.js';
import { assertValidProductAmount } from '../utils/productAmount.js';
import { assertInvoiceAccess, assertOrderAccess, readOrderToken } from '../middleware/orderAccess.js';

function buildSnapshots(body, invoice) {
  const items = body.items?.length
    ? body.items
    : [{ productId: body.productId, value: body.value, packageId: body.packageId, quantity: body.quantity || 1 }];

  return items.map((it, i) => ({
    productId: it.productId,
    value: it.value,
    packageId: it.packageId,
    quantity: it.quantity || 1,
    name: invoice.orders?.[i]?.product?.name || it.productId,
    currency: invoice.orders?.[i]?.product?.currency,
    image: invoice.orders?.[i]?.product?.image,
  }));
}

/** Öffentliche Order-Ansicht ohne Gutschein-Codes, Tokens oder interne Felder. */
function publicOrderView(order) {
  if (!order) return null;
  return {
    invoiceId: order.invoiceId,
    orderId: order.orderId,
    status: order.status,
    productName: order.productName,
    totalFiat: order.totalFiat,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((it) => ({
      productId: it.productId,
      name: it.name,
      value: it.value,
      currency: it.currency,
      quantity: it.quantity,
      image: it.image,
    })),
  };
}

export async function createInvoice(req, res, next) {
  try {
    const body = createInvoiceSchema.parse(req.body);
    const productIds = body.items?.length
      ? body.items.map((it) => it.productId)
      : [body.productId];

    const products = await Promise.all(productIds.map((id) => bitrefillService.getProductById(id)));
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!isAllowedProduct(product)) {
        throw new BitrefillError('Dieses Produkt ist auf Kryptogutscheine nicht verfügbar.', 400, 'PRODUCT_NOT_ALLOWED');
      }
      if (!isCuratedProductIdAnyCountry(product.id)) {
        throw new BitrefillError('Dieses Produkt ist nicht im freigegebenen Gutschein-Katalog.', 400, 'PRODUCT_NOT_CURATED');
      }
      const item = body.items?.[i] || body;
      assertValidProductAmount(product, { value: item.value, packageId: item.packageId });
    }

    assertCanCreateInvoice(getAllOrders(), getClientIp(req));

    const invoice = await bitrefillService.createInvoice(body);
    const paymentAddress = invoice.payment?.address;
    const snapshots = buildSnapshots(body, invoice);
    const accessToken = generateAccessToken();

    for (const item of snapshots) {
      trackEvent('purchase', item.productId);
    }

    saveOrder({
      invoiceId: invoice.id,
      orderId: invoice.orders?.[0]?.id,
      status: invoice.status,
      items: snapshots,
      paymentMethod: body.paymentMethod || invoice.payment?.method,
      payment: invoice.payment,
      accessToken,
      clientIp: getClientIp(req),
      totalFiat: snapshots.map((s) => `${s.quantity || 1}× ${s.value || ''} ${s.currency || ''}`).join(', '),
      productName: snapshots.map((s) => s.name).join(', '),
    });

    res.status(201).json({
      data: invoice,
      accessToken,
      qrData: paymentAddress || null,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceStatus(req, res, next) {
  try {
    const { id } = invoiceIdSchema.parse(req.params);
    assertInvoiceAccess(id, readOrderToken(req));

    const invoice = await bitrefillService.getInvoiceById(id);

    // Redemption-Codes nur nachladen, wenn Zahlung abgeschlossen ist
    const needsDetail = (invoice.orders || []).filter(
      (o) =>
        o.id &&
        !o.redemption_info &&
        ['complete', 'all_delivered', 'delivered'].includes(o.status)
    );
    if (needsDetail.length) {
      const details = await Promise.all(
        needsDetail.map((o) => bitrefillService.getOrderById(o.id).catch(() => null))
      );
      const detailMap = new Map(needsDetail.map((o, i) => [o.id, details[i]]));
      invoice.orders = (invoice.orders || []).map((o) => {
        const detail = detailMap.get(o.id);
        if (!detail) return o;
        return { ...o, ...detail, product: detail.product || o.product };
      });
    }

    updateOrderStatus(id, invoice.status);
    const stored = getOrder(id);
    res.json({ data: invoice, snapshot: stored?.items || null });
  } catch (err) {
    next(err);
  }
}

/**
 * Order-Details inkl. Codes: nur wenn die Order zu einer bekannten lokalen Invoice gehört.
 * Verhindert Blind-Enumeration fremder Bitrefill-Order-IDs.
 */
export async function getOrderDetails(req, res, next) {
  try {
    const { id } = orderIdSchema.parse(req.params);
    assertOrderAccess(id, readOrderToken(req));

    const order = await bitrefillService.getOrderById(id);
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

/** Admin-only: letzte Bestellungen (ohne Zahlungscode / Payment-Adresse). */
export function listOrders(_req, res) {
  const orders = getAllOrders().slice(0, 50).map(publicOrderView);
  res.json({ data: orders });
}

export async function getCsrfToken(_req, res) {
  const { generateCsrfToken, setCsrfCookie } = await import('../middleware/csrf.js');
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.json({ csrfToken: token });
}

export async function healthCheck(req, res) {
  const deep = req.query.deep === '1';
  const isProd = process.env.NODE_ENV === 'production';

  // Deep-Checks nur in Development – verhindert Info-Leaks in Production
  if (deep && isProd) {
    return res.status(403).json({ error: 'Deep-Health nur in Development.', code: 'HEALTH_FORBIDDEN' });
  }

  let bitrefillStatus = 'skipped';
  let bitrefillLatency = null;

  if (deep) {
    const start = Date.now();
    try {
      await bitrefillService.ping();
      bitrefillStatus = 'connected';
      bitrefillLatency = Date.now() - start;
    } catch {
      bitrefillStatus = 'unavailable';
    }
  }

  // Öffentlicher Health: keine Cache-/Newsletter-Internals leaken
  const payload = {
    status: 'ok',
    service: 'RedeemX',
    timestamp: new Date().toISOString(),
  };

  if (deep) {
    payload.bitrefill = bitrefillStatus;
    payload.bitrefillLatencyMs = bitrefillLatency;
    payload.testMode = isTestCatalogMode();
    payload.cache = cacheStats();
  }

  res.status(200).json(payload);
}

export function getPublicConfig(_req, res) {
  res.json({
    testMode: isTestCatalogMode(),
    service: 'RedeemX',
  });
}
