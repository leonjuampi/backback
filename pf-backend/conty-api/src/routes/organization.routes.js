const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/organization.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Organizations
 *     description: Organizations management
 */

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: List organizations (OWNER ve la suya)
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
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
 *                   items: { $ref: '#/components/schemas/Organization' }
 */
router.get('/', requireAuth, authorizeRoles(2), ctrl.listOrgs);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by id
 *     tags: [Organizations]
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
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       404: { description: Not found }
 */
router.get('/:id', requireAuth, authorizeRoles(2,3), ctrl.getOrg);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create organization (OWNER)
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizationCreate'
 *     responses:
 *       201: { description: Created }
 */
router.post('/', requireAuth, authorizeRoles(2), ctrl.createOrg);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization (OWNER de esa org)
 *     tags: [Organizations]
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
 *           schema: { $ref: '#/components/schemas/OrganizationUpdate' }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', requireAuth, authorizeRoles(2), ctrl.updateOrg);

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     summary: Soft delete organization (OWNER de esa org)
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/:id', requireAuth, authorizeRoles(2), ctrl.deleteOrg);

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:            { type: integer }
 *         legalName:     { type: string, example: "Empresa Demo SRL" }
 *         taxId:         { type: string, example: "20-12345678-9" }
 *         taxCondition:  { type: string, enum: [RI, MT, CF, EX], example: "RI" }
 *         address:       { type: string, example: "Av. Corrientes 1234, CABA" }
 *         timezone:      { type: string, example: "America/Argentina/Buenos_Aires" }
 *         logoUrl:       { type: string, nullable: true, example: "https://..." }
 *         currency:      { type: string, example: "ARS" }
 *         senderEmail:   { type: string, format: email, example: "ventas@empresa.com" }
 *         createdAt:     { type: string, format: date-time }
 *     OrganizationCreate:
 *       type: object
 *       required: [legalName]
 *       properties:
 *         legalName:     { type: string }
 *         taxId:         { type: string }
 *         taxCondition:  { type: string, enum: [RI, MT, CF, EX] }
 *         address:       { type: string }
 *         timezone:      { type: string }
 *         logoUrl:       { type: string, nullable: true }
 *         currency:      { type: string }
 *         senderEmail:   { type: string, format: email }
 *     OrganizationUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/OrganizationCreate'
 */
module.exports = router;
