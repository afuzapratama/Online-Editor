// backend/services/classService.js
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid'); // Kita akan menggunakan UUID untuk ID kelas yang unik

const classesCollection = db.collection('classes');

exports.getAllClasses = async () => {
    const snapshot = await classesCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.createClass = async (name, teacherId) => {
    const classId = uuidv4();
    const classRef = classesCollection.doc(classId);
    await classRef.set({
        name,
        teacherId,
        createdAt: new Date()
    });
    return { id: classId, name, teacherId };
};

exports.updateClass = (classId, newName) => {
    const classRef = classesCollection.doc(classId);
    return classRef.update({ name: newName });
};

exports.deleteClass = async (classId) => {
    // Opsional: Hapus classId dari semua murid di kelas ini
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('classId', '==', classId).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { classId: null });
    });
    await batch.commit();

    // Hapus kelas itu sendiri
    return classesCollection.doc(classId).delete();
};
