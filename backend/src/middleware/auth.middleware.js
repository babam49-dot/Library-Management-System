const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    req.user = {
      ...user,
      userID: user.userID || user.UserID,
      UserID: user.UserID || user.userID,
      roleID: user.roleID || user.RoleID,
      RoleID: user.RoleID || user.roleID,
      roleName: user.roleName || user.RoleName,
      RoleName: user.RoleName || user.roleName,
      memberID: user.memberID || user.MemberID,
      MemberID: user.MemberID || user.memberID,
      staffID: user.staffID || user.StaffID,
      StaffID: user.StaffID || user.staffID
    };
    next();
  });
};

module.exports = { authenticateToken };
