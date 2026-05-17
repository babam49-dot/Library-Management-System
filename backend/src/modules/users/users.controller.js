const userService = require('./users.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user.UserID);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  // In stateless JWT, logout is usually handled client-side by clearing the token.
  // We'll return success as per requirement.
  res.json({ success: true, message: "Logged out successfully" });
};

const createUser = async (req, res) => {
  try {
    const creatorRole = req.user.RoleName;
    const result = await userService.createUser(req.body, creatorRole);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const registerPublic = async (req, res) => {
  try {
    // Public registration does not require a creatorRole and sets status to 'Pending'
    const result = await userService.registerPublicUser(req.body);
    res.status(201).json({ success: true, message: "Account created and pending admin approval", data: result });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Registration failed"
    });
  }
};

const updateUser = async (req, res) => {
  try {
    await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await userService.updateStatus(req.params.id, status);
    res.json({ success: true, message: "User status updated" });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // Security check: ensure user is updating their own password or is admin
    if (req.user.UserID != req.params.id && req.user.RoleName !== 'Admin') {
       return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    await userService.updatePassword(req.params.id, currentPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getMemberProfile = async (req, res) => {
  try {
    const profile = await userService.getMemberProfile(req.params.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const updateMaxBooks = async (req, res) => {
  try {
    await userService.updateMaxBooks(req.params.id, req.body.maxBooks);
    res.json({ success: true, message: "Max books updated" });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getStaffProfile = async (req, res) => {
  try {
    const profile = await userService.getStaffProfile(req.params.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await userService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  logout,
  registerPublic,
  createUser,
  updateUser,
  updateStatus,
  updatePassword,
  getAllUsers,
  getUserById,
  getMe,
  getMemberProfile,
  updateMaxBooks,
  getStaffProfile,
  getAllRoles
};
