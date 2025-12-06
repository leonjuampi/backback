const jwt = require('jsonwebtoken');

function signJwt(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    ...options
  });
}

function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signJwt, verifyJwt };
