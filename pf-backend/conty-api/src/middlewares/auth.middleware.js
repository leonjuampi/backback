const { verifyJwt } = require('../utils/jwt.util');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed token' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = verifyJwt(token);
    req.user = payload; // { uid, roleId, orgId, branchId, branchIds, ... }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user?.roleId || !allowed.includes(req.user.roleId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

function requireOrgMembership(req, res, next) {
  if (!req.user || req.user.orgId === null || req.user.orgId === undefined) {
    return res.status(403).json({ message: 'Forbidden: Organization membership required' });
  }
  return next();
}

module.exports = { requireAuth, authorizeRoles, requireOrgMembership  };
