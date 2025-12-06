const express = require('express');
const { requireAuth, requireOrgMembership, authorizeRoles } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/stock.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Stock
 *     description: Gestión de stock, movimientos, transferencias e inventarios
 */

/**
 * @swagger
 * /api/stock/overview:
 *   get:
 *     summary: Métricas rápidas de stock
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema: { type: integer, nullable: true }
 *       - in: query
 *         name: noMovementDays
 *         schema: { type: integer, default: 90 }
 *     responses:
 *       200: { description: OK }
 */
router.get('/overview', requireAuth, requireOrgMembership, ctrl.getOverview);

/**
 * @swagger
 * /api/stock/movements:
 *   get:
 *     summary: Listado de movimientos
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ENTRY,SALE,ADJUSTMENT,TRANSFER_OUT,TRANSFER_IN,INVENTORY] }
 *       - in: query
 *         name: branchId
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string, description: "Buscar por nombre producto / SKU" }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: OK }
 */
router.get('/movements', requireAuth, requireOrgMembership, ctrl.listMovements);

/**
 * @swagger
 * /api/stock/movements:
 *   post:
 *     summary: Crear movimiento simple (Entrada/Venta/Ajuste)
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, variantId, quantity, branchId]
 *             properties:
 *               type: { type: string, enum: [ENTRY,SALE,ADJUSTMENT] }
 *               variantId: { type: integer }
 *               quantity: { type: integer }
 *               branchId: { type: integer }
 *               refCode: { type: string }
 *               note: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/movements', requireAuth, authorizeRoles(2, 3), ctrl.createMovement);

/**
 * @swagger
 * /api/stock/transfers:
 *   get:
 *     summary: Listar transferencias (por transfer_ref)
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema: { type: integer, nullable: true }
 *     responses:
 *       200: { description: OK }
 */
router.get('/transfers', requireAuth, requireOrgMembership, ctrl.listTransfers);

/**
 * @swagger
 * /api/stock/transfers:
 *   post:
 *     summary: Crear transferencia (solo genera la SALIDA; luego se "recibe")
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originBranchId, destBranchId, items]
 *             properties:
 *               originBranchId: { type: integer }
 *               destBranchId: { type: integer }
 *               transferRef: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variant_id, quantity]
 *                   properties:
 *                     variant_id: { type: integer }
 *                     quantity: { type: integer }
 *               note: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/transfers', requireAuth, authorizeRoles(2, 3), ctrl.createTransfer);

/**
 * @swagger
 * /api/stock/transfers/{ref}/receive:
 *   post:
 *     summary: Recibir transferencia pendiente (genera la ENTRADA)
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchId: { type: integer, description: "Destino. Por defecto: del OUT" }
 *     responses:
 *       201: { description: Received }
 *       409: { description: Already received }
 */
router.post('/transfers/:ref/receive', requireAuth, requireOrgMembership, ctrl.receiveTransfer);

/**
 * @swagger
 * /api/stock/inventory/sessions:
 *   get:
 *     summary: Listar sesiones de inventario
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema: { type: integer, nullable: true }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN,APPROVED,CANCELLED] }
 *     responses:
 *       200: { description: OK }
 */
router.get('/inventory/sessions', requireAuth, requireOrgMembership, ctrl.listInventorySessions);

/**
 * @swagger
 * /api/stock/inventory/sessions:
 *   post:
 *     summary: Crear sesión de inventario (prefill con stock esperado)
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId]
 *             properties:
 *               branchId: { type: integer }
 *               onlyDifferences: { type: boolean, default: false }
 *     responses:
 *       201: { description: Created }
 */
router.post('/inventory/sessions', requireAuth, authorizeRoles(2, 3), ctrl.createInventorySession);

/**
 * @swagger
 * /api/stock/inventory/sessions/{id}:
 *   get:
 *     summary: Obtener sesión con ítems
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/inventory/sessions/:id', requireAuth, requireOrgMembership, ctrl.getInventorySession);

/**
 * @swagger
 * /api/stock/inventory/sessions/{id}/count:
 *   post:
 *     summary: Cargar conteo para una variante
 *     tags: [Stock]
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
 *             type: object
 *             required: [variantId, countedQty]
 *             properties:
 *               variantId: { type: integer }
 *               countedQty: { type: integer }
 *     responses:
 *       200: { description: Updated }
 */
router.post('/inventory/sessions/:id/count', requireAuth, requireOrgMembership, ctrl.countInventoryItem);

/**
 * @swagger
 * /api/stock/inventory/sessions/{id}/approve:
 *   post:
 *     summary: Aprobar inventario (aplica diferencias)
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Approved }
 */
router.post('/inventory/sessions/:id/approve', requireAuth, authorizeRoles(2), ctrl.approveInventorySession);

/**
 * @swagger
 * /api/stock/inventory/sessions/{id}/cancel:
 *   post:
 *     summary: Cancelar inventario
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Cancelled }
 */
router.post('/inventory/sessions/:id/cancel', requireAuth, authorizeRoles(2, 3), ctrl.cancelInventorySession);

/**
 * @swagger
 * /api/stock/products:
 *   get:
 *     summary: Buscar productos/variantes con stock por sucursal
 *     tags: [Stock]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: branchId
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get('/products', requireAuth, requireOrgMembership, ctrl.searchProductsForStock);

module.exports = router;
