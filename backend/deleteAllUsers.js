// backend/deleteAllUsers.js

// PERINGATAN: Script ini akan menghapus SEMUA pengguna dan data mereka
// secara permanen, KECUALI akun admin yang ditentukan.
// Gunakan dengan sangat hati-hati.

// Cara penggunaan:
// 1. Ganti 'email-admin-anda@gmail.com' dengan email akun admin Anda.
// 2. Jalankan dari terminal di dalam folder backend: node deleteAllUsers.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// ================================================================
// === GANTI DENGAN ALAMAT EMAIL ADMIN ANDA YANG TIDAK AKAN DIHAPUS ===
const ADMIN_EMAIL = "afuzapratama@gmail.com";
// ================================================================

const deleteAllUsersExceptAdmin = async () => {
  try {
    console.log("Memulai proses penghapusan pengguna...");

    // 1. Dapatkan UID admin
    const adminUserRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    const adminUid = adminUserRecord.uid;
    console.log(`Admin ditemukan: ${ADMIN_EMAIL} (UID: ${adminUid})`);

    // 2. Ambil semua pengguna
    const listUsersResult = await auth.listUsers(1000);
    const allUsers = listUsersResult.users;

    // 3. Filter untuk mendapatkan hanya pengguna yang BUKAN admin
    const usersToDelete = allUsers.filter(user => user.uid !== adminUid);
    const uidsToDelete = usersToDelete.map(user => user.uid);

    if (uidsToDelete.length === 0) {
      console.log("✅ Tidak ada pengguna lain untuk dihapus.");
      return;
    }

    console.log(`Ditemukan ${uidsToDelete.length} pengguna untuk dihapus...`);

    // 4. Hapus pengguna dari Firebase Authentication (maksimal 1000 per panggilan)
    const deleteUsersResult = await auth.deleteUsers(uidsToDelete);
    console.log(`✅ Berhasil menghapus ${deleteUsersResult.successCount} pengguna dari Authentication.`);
    if (deleteUsersResult.failureCount > 0) {
      console.error(`❌ Gagal menghapus ${deleteUsersResult.failureCount} pengguna dari Authentication.`);
      deleteUsersResult.errors.forEach(err => console.error(err.error.toJSON()));
    }

    // 5. Hapus data pengguna dari Firestore
    console.log("Memulai penghapusan data Firestore...");
    const batch = db.batch();
    uidsToDelete.forEach(uid => {
      const userDocRef = db.collection('users').doc(uid);
      // Catatan: Ini tidak akan menghapus sub-koleksi 'files' secara otomatis.
      // Untuk pembersihan total, diperlukan fungsi rekursif yang lebih kompleks.
      // Namun, untuk tujuan kita, menghapus dokumen user sudah cukup.
      batch.delete(userDocRef);
    });
    await batch.commit();
    console.log(`✅ Berhasil menghapus ${uidsToDelete.length} dokumen pengguna dari Firestore.`);

    console.log("Proses selesai.");

  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
  }
};

deleteAllUsersExceptAdmin().then(() => {
  process.exit(0);
});
