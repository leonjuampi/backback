// src/routes/payment_methods.routes.js
const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/payment_methods.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payment Methods
 *     description: Gestión de medios de pago (Owner/Manager)
 */

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: Lista los medios de pago de la organización
 *     tags: [Payment Methods]
 *     security: [{ bearerAuth: [] }]
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
 *                   items: { $ref: '#/components/schemas/PaymentMethod' }
 *       403: { description: Forbidden }
 */
router.get('/', requireAuth, requireOrgMembership, authorizeRoles(2,3), ctrl.list);

/**
 * @swagger
 * /api/payment-methods:
 *   post:
 *     summary: Crea un nuevo medio de pago (Solo Owner)
 *     tags: [Payment Methods]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethodCreate'
 *     responses:
 *       201:
 *         description: Creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 123 }
 *       400: { description: Datos inválidos }
 *       403: { description: Forbidden }
 */
router.post('/', requireAuth, authorizeRoles(2), ctrl.create);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   put:
 *     summary: Actualiza un medio de pago (Solo Owner)
 *     tags: [Payment Methods]
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
 *             $ref: '#/components/schemas/PaymentMethodUpdate'
 *     responses:
 *       200: { description: Actualizado }
 *       404: { description: No encontrado }
 *       403: { description: Forbidden }
 */
router.put('/:id', requireAuth, authorizeRoles(2), ctrl.update);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   delete:
 *     summary: Desactiva (soft delete) un medio de pago (Solo Owner)
 *     tags: [Payment Methods]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Desactivado }
 *       404: { description: No encontrado }
 *       403: { description: Forbidden }
 */
router.delete('/:id', requireAuth, authorizeRoles(2), ctrl.remove);

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         orgId: { type: integer }
 *         name: { type: string, example: "Tarjeta Naranja (1 pago)" }
 *         kind: { type: string, enum: [CASH, DEBIT, CREDIT, TRANSFER, MIXED], example: CREDIT }
 *         max_installments: { type: integer, example: 1 }
 *         surcharge_pct: { type: number, format: float, example: 0 }
 *         discount_pct: { type: number, format: float, example: 0 }
 *         ticket_note: { type: string, nullable: true, example: "Presentar DNI" }
 *         active: { type: boolean, example: true }
 *
 *     PaymentMethodCreate:
 *       type: object
 *       required: [name, kind]
 *       properties:
 *         name: { type: string, example: "Tarjeta Naranja (1 pago)" }
 *         kind: { type: string, enum: [CASH, DEBIT, CREDIT, TRANSFER, MIXED], example: CREDIT }
 *         max_installments: { type: integer, default: 1, example: 1 }
 *         surcharge_pct: { type: number, format: float, default: 0, example: 0 }
 *         discount_pct: { type: number, format: float, default: 0, example: 0 }
 *         ticket_note: { type: string, nullable: true, example: null }
 *         active: { type: boolean, default: true, example: true }
 *
 *     PaymentMethodUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Tarjeta Naranja (3 pagos)" }
 *         kind: { type: string, enum: [CASH, DEBIT, CREDIT, TRANSFER, MIXED], example: CREDIT }
 *         max_installments: { type: integer, example: 3 }
 *         surcharge_pct: { type: number, format: float, example: 5 }
 *         discount_pct: { type: number, format: float, example: 0 }
 *         ticket_note: { type: string, nullable: true, example: "Solo mayores de 18" }
 *         active: { type: boolean, example: true }
 */

module.exports = router;
