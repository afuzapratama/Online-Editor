const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/user/profile
router.post('/profile', userController.updateProfile);

module.exports = router;
