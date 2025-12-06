const express = require('express');
const { requireAuth, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/quotes.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Quotes
 *     description: Presupuestos
 */

/**
 * @swagger
 * /api/quotes:
 *   get:
 *     summary: Listar presupuestos
 *     tags: [Quotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, SENT, ACCEPTED, EXPIRED, CONVERTED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, example: 0 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Quote' }
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.list);

/**
 * @swagger
 * /api/quotes/{id}:
 *   get:
 *     summary: Obtener presupuesto (con ítems)
 *     tags: [Quotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteDetail'
 *       404: { description: Not found }
 */
router.get('/:id', requireAuth, requireOrgMembership, ctrl.getOne);

/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Crear presupuesto
 *     tags: [Quotes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuoteRequest'
 *     responses:
 *       201:
 *         description: Creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateQuoteResponse'
 */
router.post('/', requireAuth, requireOrgMembership, ctrl.create);

/**
 * @swagger
 * /api/quotes/{id}:
 *   put:
 *     summary: Actualizar presupuesto (cabecera e items)
 *     tags: [Quotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuoteRequest'
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.put('/:id', requireAuth, requireOrgMembership, ctrl.update);

/**
 * @swagger
 * /api/quotes/{id}/convert:
 *   post:
 *     summary: Convertir presupuesto a venta
 *     tags: [Quotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConvertQuoteRequest'
 *     responses:
 *       200:
 *         description: Venta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSaleResponse'
 *       404: { description: Not found }
 *       409: { description: Already converted }
 */
router.post('/:id/convert', requireAuth, requireOrgMembership, ctrl.convert);

/**
 * @swagger
 * components:
 *   schemas:
 *     Quote:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         docText: { type: string, example: "PRES-2024-000001" }
 *         status: { type: string, enum: [DRAFT, SENT, ACCEPTED, EXPIRED, CONVERTED] }
 *         customerId: { type: integer, nullable: true }
 *         customerName: { type: string, nullable: true }
 *         total: { type: number }
 *         validUntil: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *
 *     QuoteItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         variantId: { type: integer }
 *         qty: { type: number }
 *         unitPrice: { type: number }
 *         discountPercent: { type: number }
 *         subtotal: { type: number }
 *         total: { type: number }
 *
 *     QuoteDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Quote'
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items: { $ref: '#/components/schemas/QuoteItem' }
 *             subtotal: { type: number }
 *
 *     CreateQuoteRequest:
 *       type: object
 *       required: [items]
 *       properties:
 *         customerId: { type: integer, nullable: true }
 *         validUntil: { type: string, format: date-time, nullable: true }
 *         note: { type: string, nullable: true }
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [variantId, qty, unitPrice]
 *             properties:
 *               variantId: { type: integer }
 *               qty: { type: number }
 *               unitPrice: { type: number }
 *               discountPercent: { type: number, example: 0 }
 *
 *     UpdateQuoteRequest:
 *       type: object
 *       properties:
 *         customerId: { type: integer, nullable: true }
 *         status: { type: string, enum: [DRAFT, SENT, ACCEPTED, EXPIRED] }
 *         note: { type: string, nullable: true }
 *         validUntil: { type: string, format: date-time, nullable: true }
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [variantId, qty, unitPrice]
 *             properties:
 *               variantId: { type: integer }
 *               qty: { type: number }
 *               unitPrice: { type: number }
 *               discountPercent: { type: number }
 *
 *     ConvertQuoteRequest:
 *       type: object
 *       required: [branchId, posCode, docType]
 *       properties:
 *         branchId: { type: integer, example: 1 }
 *         posCode: { type: string, example: "0001" }
 *         docType: { type: string, example: INVOICE_A }
 *         sellerId: { type: integer, nullable: true }
 */

module.exports = router;
