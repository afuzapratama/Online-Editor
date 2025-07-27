// backend/middleware/verifyAdmin.js
const verifyAdmin = (req, res, next) => {
    // Middleware ini berjalan setelah verifyToken,
    // jadi kita sudah punya req.user
    if (req.user && req.user.role === 'admin') {
        return next(); // Pengguna adalah admin, lanjutkan
    }

    return res.status(403).send('Akses ditolak. Hanya admin yang diizinkan.');
};

module.exports = verifyAdmin;
