const express = require('express');
const { requireAuth, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/dashboard.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Métricas y widgets para el dashboard principal
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener todos los datos del dashboard
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema: { type: integer }
 *         description: Filtrar datos por sucursal
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.getDashboardData);

module.exports = router;
