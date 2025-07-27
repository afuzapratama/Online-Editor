// backend/middleware/auth.js
const { auth } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return res.status(401).send('Akses ditolak. Token tidak ditemukan.');
    }
    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken; // Tambahkan info pengguna ke objek request
        next();
    } catch (error) {
        res.status(403).send('Token tidak valid.');
    }
};

module.exports = verifyToken;
