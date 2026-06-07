const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');

// --- AUTH ROUTES ---
router.post('/auth/register', controller.registerPublic);
router.post('/auth/login', controller.login);
router.post('/auth/logout', authenticateToken, controller.logout);
router.get('/auth/me', authenticateToken, controller.getMe);
router.post('/auth/webauthn/login/begin', controller.beginLogin);
router.post('/auth/webauthn/login/complete', controller.completeLogin);
router.post('/auth/webauthn/register/begin', authenticateToken, controller.beginRegistration);
router.post('/auth/webauthn/register/complete', authenticateToken, controller.completeRegistration);
router.get('/auth/webauthn/has-fingerprint', authenticateToken, controller.hasFingerprint);

// --- USERS ROUTES ---
router.post('/users', authenticateToken, requireRole('Admin'), controller.createUser);
router.get('/users', authenticateToken, requireRole('Admin'), controller.getAllUsers);
router.get('/users/:id', authenticateToken, requireRole('Admin'), controller.getUserById);
router.put('/users/:id', authenticateToken, requireRole('Admin'), controller.updateUser);
router.patch('/users/:id/status', authenticateToken, requireRole('Admin'), controller.updateStatus);
router.patch('/users/:id/password', authenticateToken, controller.updatePassword); // Own account checked in controller

// --- MEMBERS ROUTES ---
router.get('/members/:id', authenticateToken, requireRole('Member', 'Staff', 'Admin'), controller.getMemberProfile);
router.patch('/members/:id/maxbooks', authenticateToken, requireRole('Admin'), controller.updateMaxBooks);

// --- STAFF ROUTES ---
router.get('/staff/:id', authenticateToken, requireRole('Staff', 'Admin'), controller.getStaffProfile);

// --- ROLES ROUTES ---
router.get('/roles', authenticateToken, requireRole('Admin'), controller.getAllRoles);

module.exports = router;
