// backend/index.js
const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/auth');
const verifyAdmin = require('./middleware/verifyAdmin');

const fileRoutes = require('./routes/fileRoutes');
const runRoutes = require('./routes/runRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classRoutes = require('./routes/classRoutes'); // <-- IMPORT BARU

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', verifyToken, fileRoutes);
app.use('/api', verifyToken, runRoutes);
app.use('/api/user', verifyToken, userRoutes);
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);
// Rute baru untuk kelas, hanya bisa diakses oleh admin
app.use('/api/admin/classes', verifyToken, verifyAdmin, classRoutes); 

// Rute publik untuk murid mengambil daftar kelas
app.use('/api/classes', verifyToken, classRoutes);


app.listen(port, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${port}`);
});
