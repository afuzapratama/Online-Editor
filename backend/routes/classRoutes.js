// backend/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

router.get('/', classController.getAllClasses);
router.post('/', classController.createClass);
router.put('/:classId', classController.updateClass);
router.delete('/:classId', classController.deleteClass);

module.exports = router;
