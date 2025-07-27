// backend/index.js
const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/auth');
const verifyAdmin = require('./middleware/verifyAdmin'); // <-- IMPORT BARU

const fileRoutes = require('./routes/fileRoutes');
const runRoutes = require('./routes/runRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- IMPORT BARU

const app = express();
const port = 3001;

// Middleware global
app.use(cors());
app.use(express.json());

// Gunakan rute untuk pengguna biasa
app.use('/api', verifyToken, fileRoutes);
app.use('/api', verifyToken, runRoutes);
app.use('/api/user', verifyToken, userRoutes);

// Gunakan rute khusus untuk admin, dilindungi oleh verifyToken DAN verifyAdmin
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes); // <-- GUNAKAN RUTE BARU

app.listen(port, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${port}`);
});
