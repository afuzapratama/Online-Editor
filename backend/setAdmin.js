// setAdmin.js
// Cara penggunaan:
// 1. Ganti 'email-admin-anda@gmail.com' dengan email akun Google Anda.
// 2. Jalankan dari terminal di dalam folder backend: node setAdmin.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inisialisasi Firebase Admin SDK (sama seperti di index.js)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ================================================================
// === GANTI DENGAN ALAMAT EMAIL ANDA YANG DIGUNAKAN UNTUK LOGIN ===
const adminEmail = "afuzapratama@gmail.com";
// ================================================================

const setAdminRole = async (email) => {
  try {
    // 1. Cari pengguna berdasarkan email
    const user = await admin.auth().getUserByEmail(email);
    
    // 2. Periksa apakah pengguna sudah memiliki peran admin
    if (user.customClaims && user.customClaims.role === 'admin') {
      console.log(`✅ Pengguna ${email} sudah menjadi admin.`);
      return;
    }

    // 3. Jika belum, tetapkan custom claim { role: 'admin' }
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`🚀 Berhasil! Pengguna ${email} sekarang telah menjadi admin.`);
    console.log('Silakan logout dan login kembali di aplikasi untuk melihat perubahannya.');

  } catch (error) {
    console.error("❌ Gagal menetapkan peran admin:", error.message);
  }
};

setAdminRole(adminEmail).then(() => {
  process.exit(0); // Keluar dari script setelah selesai
});
