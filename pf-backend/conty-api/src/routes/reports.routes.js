const express = require('express');
const { requireAuth, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/reports.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Reportes analíticos avanzados
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener datos para la pantalla de reportes
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
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
 *         name: branchId
 *         schema: { type: integer }
 *         description: Filtrar por sucursal
 *
 *       - in: query
 *         name: sellerId
 *         schema: { type: integer }
 *         description: Filtrar por vendedor
 *
 *       - in: query
 *         name: channel
 *         schema: { type: string }
 *         description: "Canal de venta (ej: ONLINE, LOCAL, WHATSAPP)"
 *
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.getReportData);

module.exports = router;
