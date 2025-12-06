// src/routes/customer.routes.js
const express = require('express');
const multer = require('multer');
const {
  requireAuth,
  authorizeRoles,
  requireOrgMembership,
} = require('../middlewares/auth.middleware');

const {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  getCustomerStatement,
  getCustomerCsvTemplate,
  importCustomersFromCSV,
} = require('../controllers/customer.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:           { type: integer }
 *         name:         { type: string }
 *         taxId:        { type: string }
 *         email:        { type: string, format: email }
 *         phone:        { type: string }
 *         address:      { type: string }
 *         taxCondition:
 *           type: string
 *           enum: [RI, MT, CF, EX]
 *         priceListId:  { type: integer }
 *         priceListName:{ type: string }
 *         status:
 *           type: string
 *           enum: [ACTIVE, BLOCKED]
 *         notes:        { type: string, nullable: true }
 *         lastPurchaseAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         balance:
 *           type: number
 *           format: double
 *         tags:
 *           type: array
 *           items: { type: string }
 *
 *     CustomerCreate:
 *       type: object
 *       required: [name, taxCondition, priceListId, status]
 *       properties:
 *         name:         { type: string }
 *         taxId:        { type: string, nullable: true }
 *         email:        { type: string, format: email, nullable: true }
 *         phone:        { type: string, nullable: true }
 *         address:      { type: string, nullable: true }
 *         taxCondition:
 *           type: string
 *           enum: [RI, MT, CF, EX]
 *         priceListId:  { type: integer }
 *         status:
 *           type: string
 *           enum: [ACTIVE, BLOCKED]
 *         notes:        { type: string, nullable: true }
 *         tags:
 *           type: array
 *           items: { type: string }
 *           nullable: true
 *
 *     CustomerUpdate:
 *       type: object
 *       properties:
 *         name:         { type: string }
 *         taxId:        { type: string, nullable: true }
 *         email:        { type: string, format: email, nullable: true }
 *         phone:        { type: string, nullable: true }
 *         address:      { type: string, nullable: true }
 *         taxCondition:
 *           type: string
 *           enum: [RI, MT, CF, EX]
 *         priceListId:  { type: integer }
 *         status:
 *           type: string
 *           enum: [ACTIVE, BLOCKED]
 *         notes:        { type: string, nullable: true }
 *         tags:
 *           type: array
 *           items: { type: string }
 *           nullable: true
 *
 *     CustomerList:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Customer'
 *         total:   { type: integer }
 *         page:    { type: integer }
 *         pageSize:{ type: integer }
 *
 *     StatementItem:
 *       type: object
 *       properties:
 *         id:          { type: integer }
 *         date:        { type: string, format: date-time }
 *         type:
 *           type: string
 *           enum: [INVOICE, CREDIT_NOTE, PAYMENT, ADJUSTMENT]
 *         amount:      { type: number, format: double }
 *         description: { type: string, nullable: true }
 *
 *     StatementResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StatementItem'
 *         balance:
 *           type: number
 *           format: double
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List customers (search & filters)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: priceListId
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED]
 *       - in: query
 *         name: withDebt
 *         schema: { type: boolean }
 *       - in: query
 *         name: noPurchasesDays
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerList'
 */
router.get('/', requireAuth, requireOrgMembership, listCustomers);

/**
 * @swagger
 * /api/customers/template.csv:
 *   get:
 *     summary: Descarga la plantilla CSV para importar clientes
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo text/csv con la plantilla
 */
router.get('/template.csv', requireAuth, requireOrgMembership, getCustomerCsvTemplate);

/**
 * @swagger
 * /api/customers/import:
 *   post:
 *     summary: Importa clientes desde un archivo CSV (Owner)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Importación completada (con resumen)
 *       400:
 *         description: Archivo no enviado o formato incorrecto
 *       403:
 *         description: Forbidden (Solo Owner)
 */
router.post(
  '/import',
  requireAuth,
  authorizeRoles(2),
  upload.single('file'),
  importCustomersFromCSV
);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer detail
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
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
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Not found
 */
router.get('/:id', requireAuth, requireOrgMembership, getCustomerById);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create customer (Owner/Vendedor)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerCreate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 */
router.post('/', requireAuth, authorizeRoles(2, 3), createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer (Owner/Vendedor)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/CustomerUpdate'
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', requireAuth, authorizeRoles(2, 3), updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Soft delete customer (Solo Owner)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', requireAuth, authorizeRoles(2), softDeleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/statement:
 *   get:
 *     summary: Customer account statement
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatementResponse'
 */
router.get('/:id/statement', requireAuth, requireOrgMembership, getCustomerStatement);

module.exports = router;
