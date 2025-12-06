// src/routes/price_lists.routes.js
const express = require('express');
const {
  requireAuth,
  authorizeRoles,
  requireOrgMembership,
} = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/price_lists.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Price Lists
 *     description: Gestión de Listas de Precios (CRUD)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceList:
 *       type: object
 *       properties:
 *         id:          { type: integer }
 *         org_id:      { type: integer }
 *         name:        { type: string }
 *         description: { type: string, nullable: true }
 *         is_default:  { type: boolean }
 *
 *     PriceListCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:        { type: string, example: "Mayorista Especial" }
 *         description: { type: string, nullable: true }
 *         is_default:  { type: boolean, default: false }
 *
 *     PriceListUpdate:
 *       type: object
 *       properties:
 *         name:        { type: string }
 *         description: { type: string, nullable: true }
 *         is_default:  { type: boolean }
 */

/**
 * @swagger
 * /api/price-lists:
 *   get:
 *     summary: Lista las listas de precios de la organización (Owner y Vendedores)
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
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
 *                     $ref: '#/components/schemas/PriceList'
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.list);

/**
 * @swagger
 * /api/price-lists:
 *   post:
 *     summary: Crea una nueva lista de precios (Solo Owner)
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceListCreate'
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', requireAuth, authorizeRoles(2), ctrl.create);

/**
 * @swagger
 * /api/price-lists/{id}:
 *   put:
 *     summary: Actualiza una lista de precios (Solo Owner)
 *     tags: [Price Lists]
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
 *             $ref: '#/components/schemas/PriceListUpdate'
 *     responses:
 *       200: { description: Actualizado }
 *       404: { description: No encontrado }
 */
router.put('/:id', requireAuth, authorizeRoles(2), ctrl.update);

/**
 * @swagger
 * /api/price-lists/{id}:
 *   delete:
 *     summary: Desactiva (soft delete) una lista de precios (Solo Owner)
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Desactivado }
 *       404: { description: No encontrado }
 */
router.delete('/:id', requireAuth, authorizeRoles(2), ctrl.remove);

module.exports = router;
