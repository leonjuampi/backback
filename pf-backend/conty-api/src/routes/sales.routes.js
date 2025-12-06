const express = require('express');
const { requireAuth, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/sales.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sales
 *     description: Ventas
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Listar ventas
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, CONFIRMED, CANCELLED] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
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
 *                   items: { $ref: '#/components/schemas/Sale' }
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.list);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Obtener venta por id (con items y pagos)
 *     tags: [Sales]
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
 *               $ref: '#/components/schemas/SaleDetail'
 *       404: { description: Not found }
 */
router.get('/:id', requireAuth, requireOrgMembership, ctrl.getOne);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Crear venta (reserva numeración, descuenta stock y registra CxC)
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSaleRequest'
 *     responses:
 *       201:
 *         description: Creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSaleResponse'
 *       400: { description: Datos inválidos o regla de numeración faltante }
 */
router.post('/', requireAuth, requireOrgMembership, ctrl.create);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   post:
 *     summary: Cancelar venta (reponer stock y nota de crédito en CxC)
 *     tags: [Sales]
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
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *       409: { description: Already cancelled }
 */
router.post('/:id/cancel', requireAuth, requireOrgMembership, ctrl.cancel);

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         docType: { type: string, example: INVOICE_A }
 *         docText: { type: string, example: "FA-0001-00000042" }
 *         docNumber: { type: string, example: "00000042" }
 *         branchId: { type: integer }
 *         branchName: { type: string }
 *         customerId: { type: integer, nullable: true }
 *         customerName: { type: string, nullable: true }
 *         total: { type: number, format: double }
 *         status: { type: string, enum: [DRAFT, CONFIRMED, CANCELLED] }
 *         createdAt: { type: string, format: date-time }
 *
 *     SaleItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         variantId: { type: integer }
 *         qty: { type: number }
 *         unitPrice: { type: number }
 *         vatPercent: { type: number, example: 21 }
 *         discountPercent: { type: number, example: 0 }
 *         subtotal: { type: number }
 *         total: { type: number }
 *
 *     SalePayment:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         method: { type: string, example: CASH }
 *         amount: { type: number }
 *         note: { type: string, nullable: true }
 *
 *     SaleDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Sale'
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items: { $ref: '#/components/schemas/SaleItem' }
 *             payments:
 *               type: array
 *               items: { $ref: '#/components/schemas/SalePayment' }
 *             subtotal: { type: number }
 *             vat_total: { type: number }
 *
 *     CreateSaleRequest:
 *       type: object
 *       required: [branchId, posCode, docType, items]
 *       properties:
 *         branchId: { type: integer, example: 1 }
 *         posCode: { type: string, example: "0001" }
 *         docType: { type: string, example: INVOICE_A }
 *         customerId: { type: integer, nullable: true }
 *         sellerId: { type: integer, nullable: true }
 *         note: { type: string, nullable: true }
 *         refCode: { type: string, nullable: true }
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [variantId, qty, unitPrice]
 *             properties:
 *               variantId: { type: integer }
 *               qty: { type: number, example: 1 }
 *               unitPrice: { type: number, example: 1000 }
 *               vatPercent: { type: number, example: 21 }
 *               discountPercent: { type: number, example: 0 }
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *             required: [method, amount]
 *             properties:
 *               method: { type: string, example: CASH }
 *               amount: { type: number, example: 1000 }
 *               note: { type: string, nullable: true }
 *
 *     CreateSaleResponse:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         docText: { type: string, example: "FA-0001-00000042" }
 *         docNumber: { type: string, example: "00000042" }
 *         total: { type: number }
 */

/**
 * @swagger
 * /api/sales/{id}/payments:
 *   post:
 *     summary: Registra uno o más pagos para una venta existente
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la venta a la que se asocia el pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payments]
 *             properties:
 *               payments:
 *                 type: array
 *                 description: Lista de pagos a registrar
 *                 items:
 *                   type: object
 *                   required: [method, amount]
 *                   properties:
 *                     method:
 *                       type: string
 *                       example: CASH
 *                       description: Nombre del método de pago configurado
 *                     amount:
 *                       type: number
 *                       example: 65340
 *                     note:
 *                       type: string
 *                       nullable: true
 *                       example: "Pago total"
 *     responses:
 *       201:
 *         description: Pagos registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Cantidad de pagos registrados
 *       400: { description: Datos inválidos (método no existe, monto incorrecto) }
 *       404: { description: Venta no encontrada o no pertenece a la organización }
 *       409: { description: Conflicto (la venta ya está cancelada) }
 */
router.post('/:id/payments', requireAuth, requireOrgMembership, ctrl.addPayments);


module.exports = router;
