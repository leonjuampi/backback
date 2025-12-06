const express = require('express');
const {
  registerUser,
  inviteUserController,
  getUserBranches,
  replaceUserBranches,
  getUsers,
} = require('../controllers/user.controller');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Users & assignments management
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user (ADMIN u OWNER dentro de su org)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, username, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               username: { type: string }
 *               password: { type: string, format: password }
 *               roleId: { type: integer, example: 3 }
 *               orgId:  { type: integer, nullable: true, description: "ADMIN puede setearla; OWNER ignora y usa la suya" }
 *               branchId: { type: integer, nullable: true, description: "legacy (única sucursal)" }
 *               branches:
 *                 type: array
 *                 description: IDs de sucursales a asignar (múltiple)
 *                 items: { type: integer }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Username already in use }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/', requireAuth, authorizeRoles(1, 2), registerUser);

/**
 * @swagger
 * /api/users/invite:
 *   post:
 *     summary: Invite user (ADMIN u OWNER dentro de su org; envía mail con token)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, username]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               username: { type: string }
 *               roleId: { type: integer, example: 3 }
 *               orgId: { type: integer, nullable: true, description: "ADMIN puede setearla; OWNER usa la suya" }
 *               branchId: { type: integer, nullable: true, description: "legacy" }
 *               branches:
 *                 type: array
 *                 description: IDs de sucursal a asignar (múltiple)
 *                 items: { type: integer }
 *     responses:
 *       201: { description: User invited (status=INVITED) }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/invite', requireAuth, authorizeRoles(1, 2), inviteUserController);

/**
 * @swagger
 * /api/users/{id}/branches:
 *   get:
 *     summary: Lista sucursales asignadas a un usuario
 *     tags: [Users]
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
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       orgId: { type: integer }
 *                       name: { type: string }
 *                       address: { type: string }
 *                       phone: { type: string }
 *   put:
 *     summary: Reemplaza sucursales asignadas (array completo)
 *     tags: [Users]
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
 *             required: [branches]
 *             properties:
 *               branches:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Bad request }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get('/:id/branches', requireAuth, authorizeRoles(2), requireOrgMembership, getUserBranches);
router.put('/:id/branches', requireAuth, authorizeRoles(2), requireOrgMembership, replaceUserBranches);



router.get('/', requireAuth, requireOrgMembership, authorizeRoles(2,3), getUsers); // Solo Owner (Rol 2)


module.exports = router;
