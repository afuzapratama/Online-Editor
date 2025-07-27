// backend/controllers/runController.js
const liveServerService = require('../services/liveServerService');

exports.runProject = async (req, res) => {
    try {
        const url = await liveServerService.runServer(req.user.uid);
        res.json({ url });
    } catch (error) {
        console.error("Error running server:", error);
        res.status(500).json({ message: "Gagal menjalankan server." });
    }
};
