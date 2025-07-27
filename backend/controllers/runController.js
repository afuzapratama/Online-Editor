// backend/controllers/runController.js
const previewService = require('../services/previewService');

exports.runProject = async (req, res) => {
    try {
        const urlPath = await previewService.preparePreview(req.user.uid);
        res.json({ url: urlPath });
    } catch (error) {
        console.error("Error preparing preview:", error);
        res.status(500).json({ message: "Gagal menyiapkan pratinjau." });
    }
};
