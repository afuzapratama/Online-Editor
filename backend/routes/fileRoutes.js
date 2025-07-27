// backend/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/files', fileController.getFiles);
router.get('/file-content', fileController.getFileContent);
router.post('/create-file', fileController.createFile);
router.post('/create-folder', fileController.createFolder);
router.post('/save-file', fileController.saveFile);
router.post('/rename', fileController.renameItem);
router.delete('/delete-file', fileController.deleteFile);
router.delete('/delete-folder', fileController.deleteFolder);

module.exports = router;
