// backend/routes/runRoutes.js
const express = require('express');
const router = express.Router();
const runController = require('../controllers/runController');

router.post('/run', runController.runProject);

module.exports = router;
