const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/category.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Categories & Subcategories management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List categories (by org)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: includeSub
 *         schema: { type: boolean, example: false }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: OK }
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.listCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create category (ADMIN/OWNER)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', requireAuth, authorizeRoles(2, 3), ctrl.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category (ADMIN/OWNER)
 *     tags: [Categories]
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
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', requireAuth, authorizeRoles(2, 3), ctrl.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (ADMIN/OWNER)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/:id', requireAuth, authorizeRoles(2, 3), ctrl.deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/subcategories:
 *   get:
 *     summary: List subcategories of a category
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id/subcategories', requireAuth, requireOrgMembership, ctrl.listSubcategories);

/**
 * @swagger
 * /api/categories/{id}/subcategories:
 *   post:
 *     summary: Create subcategory (ADMIN/OWNER)
 *     tags: [Categories]
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
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/:id/subcategories', requireAuth, authorizeRoles(2, 3), ctrl.createSubcategory);

/**
 * @swagger
 * /api/subcategories/{subId}:
 *   put:
 *     summary: Update subcategory (ADMIN/OWNER)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: subId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/subcategories/:subId', requireAuth, authorizeRoles(2, 3), ctrl.updateSubcategory);

/**
 * @swagger
 * /api/subcategories/{subId}:
 *   delete:
 *     summary: Delete subcategory (ADMIN/OWNER)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: subId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/subcategories/:subId', requireAuth, authorizeRoles(2, 3), ctrl.deleteSubcategory);

module.exports = router;
