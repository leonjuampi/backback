const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/branch.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Branches
 *     description: Branches (Points of Sale) management
 */

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: List branches (OWNER ve las de su org)
 *     tags: [Branches]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [LOCAL, ONLINE] }
 *       - in: query
 *         name: orgId
 *         schema: { type: integer }
 *         description: Solo para ADMIN
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
 *                   items: { $ref: '#/components/schemas/Branch' }
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.listBranches);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get branch
 *     tags: [Branches]
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
 *             schema: { $ref: '#/components/schemas/Branch' }
 *       404: { description: Not found }
 */
router.get('/:id', requireAuth, requireOrgMembership, ctrl.getBranch);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Create branch (OWNER)
 *     tags: [Branches]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BranchCreate'
 *     responses:
 *       201: { description: Created }
 */
router.post('/', requireAuth, authorizeRoles(2), ctrl.createBranch);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update branch (OWNER de esa org)
 *     tags: [Branches]
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
 *             $ref: '#/components/schemas/BranchUpdate'
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', requireAuth, authorizeRoles(2), ctrl.updateBranch);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Soft delete branch (OWNER de esa org)
 *     tags: [Branches]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/:id', requireAuth, authorizeRoles(2), ctrl.deleteBranch);

/**
 * @swagger
 * components:
 *   schemas:
 *     Branch:
 *       type: object
 *       properties:
 *         id:          { type: integer }
 *         orgId:       { type: integer }
 *         name:        { type: string, example: "Sucursal Centro" }
 *         address:     { type: string, example: "Av. Corrientes 1234, CABA" }
 *         phone:       { type: string, example: "11-4444-5555" }
 *         channel:     { type: string, enum: [LOCAL, ONLINE], example: "LOCAL" }
 *         printerName: { type: string, nullable: true, example: "Ticket POS-001" }
 *         printerCode: { type: string, nullable: true, example: "POS-001" }
 *         status:      { type: string, enum: [ACTIVE, INACTIVE], example: "ACTIVE" }
 *         createdAt:   { type: string, format: date-time }
 *     BranchCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         orgId:       { type: integer, description: "Por defecto, la org del token" }
 *         name:        { type: string }
 *         address:     { type: string }
 *         phone:       { type: string }
 *         channel:     { type: string, enum: [LOCAL, ONLINE] }
 *         printerName: { type: string }
 *         printerCode: { type: string }
 *         status:      { type: string, enum: [ACTIVE, INACTIVE] }
 *     BranchUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/BranchCreate'
 */
module.exports = router;
