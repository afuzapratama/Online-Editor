// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/files/USER_ID
router.get('/files/:userId', adminController.getUserFiles);

// --- RUTE BARU ---
// GET /api/admin/file-content/USER_ID?path=...
router.get('/file-content/:userId', adminController.getUserFileContent);

module.exports = router;
