// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- Pastikan path diimpor
const verifyToken = require('./middleware/auth');
const verifyAdmin = require('./middleware/verifyAdmin');

const fileRoutes = require('./routes/fileRoutes');
const runRoutes = require('./routes/runRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- TAMBAHAN BARU UNTUK MENYAJIKAN FILE PRATINJAU ---
// Ini akan menangani permintaan dari proxy Vite
const previewsDir = path.join(__dirname, 'previews');
app.use('/previews-static', express.static(previewsDir));
// ----------------------------------------------------

app.use('/api', verifyToken, fileRoutes);
app.use('/api', verifyToken, runRoutes);
app.use('/api/user', verifyToken, userRoutes);
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);

app.listen(port, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${port}`);
});
