// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profile', userController.getProfile);

router.post('/profile', userController.updateProfile);
router.post('/select-class', userController.selectClass);

module.exports = router;
