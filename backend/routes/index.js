import { Router } from 'express';
import productsRouter from './products.js';
import invoicesRouter from './invoices.js';

const router = Router();

router.use('/products', productsRouter);
router.use('/', invoicesRouter);

export default router;
