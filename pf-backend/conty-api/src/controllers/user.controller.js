// src/controllers/user.controller.js
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const {
  createUser,
  findByUsername,
  inviteUser,
  setUserBranches,
  getUserById,
  getUserBranches: getUserBranchesSvc,
} = require('../services/user.service');
const { sendSetPasswordEmail } = require('../mailer');

async function registerUser(req, res) {
  try {
    const { name, email, username, password, roleId, orgId, branchId, branches } = req.body;
    const creatingUserRole = req.user.roleId; // Rol de quien hace la petición
    const creatingUserOrgId = req.user.orgId; // Org de quien hace la petición (null si es Admin)
    const creatingUserId = req.user.uid;     // ID de quien hace la petición

    let finalOrgId = null;
    // Obtener el roleId del NUEVO usuario que se está creando/invitando (del body). Default a Vendedor (3).
    const newUserRoleId = roleId ? Number(roleId) : 3;

    if (creatingUserRole === 1) { // Acción realizada POR UN ADMIN (Rol 1)

        if (newUserRoleId === 2) { // SI EL ADMIN ESTÁ CREANDO UN OWNER (Rol 2)
            if (orgId !== null && orgId !== undefined) {
                 console.warn("Admin está creando un Owner (Rol 2) pero se proveyó un orgId en el body. Se ignorará y se asignará NULL.");
            }
            finalOrgId = null; // CORRECTO: El Owner empieza sin orgId.

        } else { // SI EL ADMIN ESTÁ CREANDO CUALQUIER OTRO ROL (Ej: Vendedor Rol 3)
            if (!orgId) {
                return res.status(400).json({ message: 'Admin role requires orgId in the request body when creating non-Owner users.' });
            }
            finalOrgId = Number(orgId);
            const [orgExists] = await pool.query('SELECT 1 FROM organizations WHERE id = ? AND is_deleted = 0', [finalOrgId]);
            if (!orgExists.length) {
                return res.status(400).json({ message: `Organization ID ${finalOrgId} not found or is deleted.` });
            }
        }

    } else if (creatingUserRole === 2) { // Acción realizada POR UN OWNER (Rol 2)

        if (!creatingUserOrgId) {
            return res.status(403).json({ message: 'Forbidden: Owner must belong to an organization before adding users.' });
        }
        finalOrgId = creatingUserOrgId;

        if (newUserRoleId === 1 || newUserRoleId === 2) {
             return res.status(403).json({ message: 'Forbidden: Owners can only create users with roles other than Admin or Owner.'});
        }

    } else {
         return res.status(403).json({ message: 'Forbidden: Insufficient role.' });
    }

    const exists = await findByUsername(username);
    if (exists) return res.status(400).json({ message: 'Username already in use' });

     if (!password || String(password).length < 8) {
         return res.status(400).json({ message: 'Password is required and must be at least 8 characters long' });
     }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userId = await createUser({
      name,
      email,
      username,
      passwordHash,
      roleId: roleId ?? 3,
      orgId: finalOrgId,
      createdBy: creatingUserId || null
    });

    const branchIdsToAssign = Array.isArray(branches) ? branches.map(Number).filter(Boolean) : [];
    if (branchIdsToAssign.length && finalOrgId !== null) { // <-- Añadido chequeo finalOrgId
      const placeholders = branchIdsToAssign.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT id FROM branches WHERE id IN (${placeholders}) AND org_id = ? AND is_deleted = 0`,
        [...branchIdsToAssign, finalOrgId]
      );
      if (rows.length !== branchIdsToAssign.length) {
        return res.status(400).json({ message: 'One or more branches do not belong to the target organization' });
      }

      // --- MODIFICACIÓN DE AUDITORÍA ---
      // Pasar el ID del usuario que realiza la acción (auditingUserId) y la org afectada
      await setUserBranches(userId, branchIdsToAssign, null, { auditingUserId: creatingUserId, orgId: finalOrgId });

      await pool.query('UPDATE users SET branch_id = ? WHERE id = ?', [branchIdsToAssign[0], userId]);
    }

    return res.status(201).json({ message: 'User created', id: userId });
  } catch (err) {
    console.error('USER_CREATE_ERROR:', err);
    if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('uq_users_username_active')) {
             return res.status(409).json({ message: 'Username already in use' });
        }
        if (err.message.includes('uq_users_email_active')) {
             return res.status(409).json({ message: 'Email already in use' });
        }
    }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function inviteUserController(req, res) {
  try {
    const { name, email, username, roleId, orgId, branchId, branches } = req.body;
    const creatingUserRole = req.user.roleId;
    const creatingUserOrgId = req.user.orgId;
    const creatingUserId = req.user.uid;

    if (!name || !email || !username) {
      return res.status(400).json({ message: 'name, email y username son requeridos' });
    }

    const exists = await findByUsername(username);
    if (exists) return res.status(400).json({ message: 'Username ya en uso' });

    let finalOrgId = null;
    const newUserRoleId = roleId ? Number(roleId) : 3;

    if (creatingUserRole === 1) {
        if (newUserRoleId === 2) {
            if (orgId !== null && orgId !== undefined) {
                 console.warn("Admin creating Owner (Role 2) but orgId provided in body. Ignoring and setting to NULL.");
            }
            finalOrgId = null;
        } else {
            if (!orgId) {
                return res.status(400).json({ message: 'Admin role requires orgId in the request body when creating non-Owner users.' });
            }
            finalOrgId = Number(orgId);
            const [orgExists] = await pool.query('SELECT 1 FROM organizations WHERE id = ? AND is_deleted = 0', [finalOrgId]);
            if (!orgExists.length) {
                return res.status(400).json({ message: `Organization ID ${finalOrgId} not found or is deleted.` });
            }
        }
    } else if (creatingUserRole === 2) {
        if (!creatingUserOrgId) {
            return res.status(403).json({ message: 'Forbidden: Owner must belong to an organization before adding users.' });
        }
        finalOrgId = creatingUserOrgId;
        if (newUserRoleId === 1 || newUserRoleId === 2) {
             return res.status(403).json({ message: 'Forbidden: Owners can only create users with roles other than Admin or Owner.'});
        }
    } else {
         return res.status(403).json({ message: 'Forbidden: Insufficient role.' });
    }

     const branchIdsToAssign = Array.isArray(branches) ? branches.map(Number).filter(Boolean) : [];
     if (branchIdsToAssign.length && finalOrgId !== null) {
       const placeholders = branchIdsToAssign.map(() => '?').join(',');
       const [rows] = await pool.query(
         `SELECT id FROM branches WHERE id IN (${placeholders}) AND org_id = ? AND is_deleted = 0`,
         [...branchIdsToAssign, finalOrgId]
       );
       if (rows.length !== branchIdsToAssign.length) {
         return res.status(400).json({ message: 'One or more branches do not belong to the target organization' });
       }
     } else if (branchIdsToAssign.length && finalOrgId === null && newUserRoleId !== 2){
          return res.status(400).json({ message: 'Cannot assign branches when creating an Owner or if target organization is not set.' });
     }

    const { id, token, expires } = await inviteUser({
      name,
      email,
      username,
      roleId: newUserRoleId,
      orgId: finalOrgId,
      branches: branchIdsToAssign,
      createdBy: creatingUserId || null
    });

    const frontendUrl = process.env.FRONTEND_URL
    
    const link = `${frontendUrl}/set-password?token=${token}`;
   // const link = `${frontendUrl}/api/auth/set-password?token=${token}`;

    await sendSetPasswordEmail(email, link, name);

    return res.status(201).json({ id, email, status: 'INVITED', password_set_expires: expires });
  } catch (err) {
    console.error('INVITE_ERROR:', err);
     if (err.code === 'ER_DUP_ENTRY') {
         if (err.message.includes('uq_users_username_active')) {
              return res.status(409).json({ message: 'Username already in use' });
         }
         if (err.message.includes('uq_users_email_active')) {
              return res.status(409).json({ message: 'Email already in use' });
         }
     }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getUserBranches(req, res) {
  try {
    const targetId = Number(req.params.id);
    // --- VALIDACIÓN DE SEGURIDAD MEJORADA ---
    const orgId = req.user.orgId;
    const target = await getUserById(targetId);
    if (!target) return res.status(404).json({ message: 'Not found' });

    // Solo Owners (Rol 2) o Admins (Rol 1) pueden ver branches de otros.
    // Owners solo pueden ver usuarios de su propia org.
    if (req.user.roleId === 2 && target.orgId !== orgId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Admins (Rol 1) pueden ver cualquiera (implícito)

    const branches = await getUserBranchesSvc(targetId);
    return res.json({ items: branches });
  } catch (e) {
    console.error('USER_BRANCHES_GET_ERROR:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function replaceUserBranches(req, res) {
  try {
    const targetId = Number(req.params.id);
    const auditingUserId = req.user.uid; // Quién hace el cambio
    const auditingUserRole = req.user.roleId;
    const auditingUserOrgId = req.user.orgId; // Org de quien hace el cambio

    const target = await getUserById(targetId);
    if (!target) return res.status(404).json({ message: 'Not found' });
    const targetOrgId = target.orgId; // Org del usuario a modificar

    const list = Array.isArray(req.body?.branches) ? req.body.branches.map(Number).filter(Boolean) : [];
    if (!Array.isArray(req.body?.branches)) {
      return res.status(400).json({ message: 'branches (array) requerido' });
    }

    // Validación de permisos
    if (auditingUserRole === 2) { // Si es Owner
      if (targetOrgId !== auditingUserOrgId) return res.status(403).json({ message: 'Forbidden: Owner can only modify users in their own org.' });

      // Validar que todas las branches pertenezcan a su org
      if (list.length) {
        const placeholders = list.map(() => '?').join(',');
        const [rows] = await pool.query(
          `SELECT id FROM branches WHERE id IN (${placeholders}) AND org_id = ? AND is_deleted = 0`,
          [...list, auditingUserOrgId]
        );
        if (rows.length !== list.length) {
          return res.status(403).json({ message: 'Una o más sucursales no pertenecen a tu organización' });
        }
      }
    } else if (auditingUserRole === 1) { // Si es Admin
       // Admin puede modificar a cualquiera, pero debe validar branches contra la org del *usuario objetivo*
       if (list.length) {
         const placeholders = list.map(() => '?').join(',');
         const [rows] = await pool.query(
           `SELECT id FROM branches WHERE id IN (${placeholders}) AND org_id = ? AND is_deleted = 0`,
           [...list, targetOrgId] // <-- Validar contra la org del *objetivo*
         );
         if (rows.length !== list.length) {
           return res.status(400).json({ message: 'One or more branches do not belong to the target user\'s organization' });
         }
       }
    } else {
        return res.status(403).json({ message: 'Forbidden' }); // Otros roles no permitidos
    }

    // --- MODIFICACIÓN DE AUDITORÍA ---
    // Pasar el ID del usuario que realiza la acción (auditingUserId) y la org afectada
    await setUserBranches(targetId, list, null, { auditingUserId, orgId: targetOrgId });
    return res.json({ ok: true });
  } catch (e) {
    console.error('USER_BRANCHES_PUT_ERROR:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getUsers(req, res) {
  try {
    const orgId = req.user.orgId; // El Owner solo ve su org
    const { search, page = 1, pageSize = 20 } = req.query;
    
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    const result = await require('../services/user.service').listUsers({ 
      orgId, 
      search, 
      limit, 
      offset 
    });

    res.json({ 
      items: result.items, 
      total: result.total,
      page: Number(page), 
      pageSize: limit 
    });
  } catch (e) {
    console.error('GET_USERS_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerUser,
  inviteUserController,
  getUserBranches,
  replaceUserBranches,
  getUsers,
};
