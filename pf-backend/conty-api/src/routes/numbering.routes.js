const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/numbering.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Numbering
 *     description: Reglas de numeración y preview
 */

/**
 * @swagger
 * /api/numbering/rules:
 *   get:
 *     summary: Listar reglas de numeración del tenant
 *     tags: [Numbering]
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
 *                   items: { $ref: '#/components/schemas/NumberingRule' }
 */
router.get('/rules', requireAuth, requireOrgMembership, ctrl.listRules);

/**
 * @swagger
 * /api/numbering/preview:
 *   get:
 *     summary: Previsualiza el próximo número sin reservarlo
 *     tags: [Numbering]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: docType
 *         required: true
 *         schema: { type: string, example: INVOICE_A }
 *       - in: query
 *         name: posCode
 *         required: true
 *         schema: { type: string, example: '0001' }
 *     responses:
 *       200:
 *         description: Preview
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NumberingPreview'
 *       404: { description: Rule not found }
 */
router.get('/preview', requireAuth, requireOrgMembership, ctrl.preview);

/**
 * @swagger
 * /api/numbering/rules:
 *   post:
 *     summary: Crear/Actualizar regla de numeración (OWNER)
 *     tags: [Numbering]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NumberingRuleUpsert'
 *     responses:
 *       200: { description: OK }
 */
router.post('/rules', requireAuth, authorizeRoles(2), ctrl.upsert);

/**
 * @swagger
 * /api/numbering/rules/{docType}:
 *   delete:
 *     summary: Eliminar (soft) una regla
 *     tags: [Numbering]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: docType
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/rules/:docType', requireAuth, authorizeRoles(2), ctrl.remove);

/**
 * @swagger
 * components:
 *   schemas:
 *     NumberingRule:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         orgId: { type: integer }
 *         docType: { type: string, example: INVOICE_A }
 *         format: { type: string, example: "FA-{PV}-{NUM}" }
 *         nextNumber: { type: integer, example: 1 }
 *         padding: { type: integer, example: 8 }
 *         resetPolicy:
 *           type: string
 *           enum: [NEVER, YEARLY, MONTHLY]
 *           example: NEVER
 *     NumberingRuleUpsert:
 *       type: object
 *       required: [docType, format, padding]
 *       properties:
 *         docType: { type: string, example: INVOICE_A }
 *         format: { type: string, example: "FA-{PV}-{NUM}" }
 *         nextNumber: { type: integer, example: 1 }
 *         padding: { type: integer, example: 8 }
 *         resetPolicy:
 *           type: string
 *           enum: [NEVER, YEARLY, MONTHLY]
 *           example: NEVER
 *     NumberingPreview:
 *       type: object
 *       properties:
 *         rule: { $ref: '#/components/schemas/NumberingRule' }
 *         formatted: { type: string, example: "FA-0001-00000001" }
 *         number: { type: string, example: "00000001" }
 */

module.exports = router;
