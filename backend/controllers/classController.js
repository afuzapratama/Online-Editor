// backend/controllers/classController.js
const classService = require('../services/classService');

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil daftar kelas.' });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Nama kelas tidak boleh kosong.' });
        }
        const newClass = await classService.createClass(name, req.user.uid);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat kelas baru.' });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Nama kelas tidak boleh kosong.' });
        }
        await classService.updateClass(classId, name);
        res.json({ message: 'Kelas berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui kelas.' });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { classId } = req.params;
        await classService.deleteClass(classId);
        res.json({ message: 'Kelas berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus kelas.' });
    }
};
