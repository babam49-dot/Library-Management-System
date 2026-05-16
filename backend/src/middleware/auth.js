const jwt = require('jsonwebtoken');
const pool = require('../db');

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided', data: null });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = {
      ...decoded,
      userID: decoded.userID || decoded.UserID,
      UserID: decoded.UserID || decoded.userID,
      roleID: decoded.roleID || decoded.RoleID,
      RoleID: decoded.RoleID || decoded.roleID,
      roleName: decoded.roleName || decoded.RoleName,
      RoleName: decoded.RoleName || decoded.roleName,
      memberID: decoded.memberID || decoded.MemberID,
      MemberID: decoded.MemberID || decoded.memberID,
      staffID: decoded.staffID || decoded.StaffID,
      StaffID: decoded.StaffID || decoded.staffID,
      extensionId: decoded.extensionId || decoded.MemberID || decoded.memberID || decoded.StaffID || decoded.staffID
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', data: null });
  }
};

const requireRole = (...roleIds) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
  if (!roleIds.includes(req.user.roleID))
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions', data: null });
  return next();
};

module.exports = { authenticate, requireRole };
