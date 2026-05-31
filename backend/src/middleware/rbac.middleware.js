const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.RoleName) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No role identified"
      });
    }

    if (!allowedRoles.includes(req.user.RoleName)) {
      // Log every rejected attempt: UserID, attempted route, timestamp
      console.warn(`[ACCESS DENIED] UserID: ${req.user.UserID} | Role: ${req.user.RoleName} | Route: ${req.originalUrl} | Timestamp: ${new Date().toISOString()}`);
      
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to access this resource"
      });
    }

    next();
  };
};

module.exports = { requireRole };
