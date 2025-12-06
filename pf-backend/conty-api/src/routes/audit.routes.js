// src/routes/audit.routes.js
const express = require('express');
const { requireAuth, authorizeRoles } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/audit.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Audit
 *     description: Logs de auditoría del sistema (Solo Admin y Owner)
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Listar logs de auditoría
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: orgId
 *         schema: { type: integer }
 *         description: Filtrar por organización (Admin puede ver todas, Owner solo la suya)
 *
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *         description: Filtrar por usuario que realizó la acción
 *
 *       - in: query
 *         name: actionType
 *         schema: { type: string }
 *         description: Tipo de acción (CREATE, UPDATE, DELETE, LOGIN_SUCCESS, etc.)
 *
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *         description: Entidad afectada (SALE, PRODUCT, etc.)
 *
 *       - in: query
 *         name: entityId
 *         schema: { type: integer }
 *         description: ID de la entidad afectada
 *
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Fecha desde (YYYY-MM-DD)
 *
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Fecha hasta (YYYY-MM-DD)
 *
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *
 *       - in: query
 *         name: offset
 *         schema: { type: integer, example: 0 }
 *
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       org_id: { type: integer }
 *                       user_id: { type: integer }
 *                       action_type: { type: string }
 *                       entity_type: { type: string }
 *                       entity_id: { type: integer }
 *                       details_json: { type: object }
 *                       created_at: { type: string, format: date-time }
 *                       performedBy: { type: string }
 *                       orgName: { type: string }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pageSize: { type: integer }
 *
 *       403: { description: Forbidden (Vendedores no tienen acceso) }
 */
router.get('/', requireAuth, authorizeRoles(1, 2), ctrl.listLogs);

module.exports = router;
