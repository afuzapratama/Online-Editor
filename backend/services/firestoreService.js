// backend/services/firestoreService.js
const { db, auth } = require('../config/firebase');
const path = require('path');

const getUserFilesCollection = (userId) => db.collection('users').doc(userId).collection('files');

const buildTree = (docs) => {
    const map = {};
    const roots = [];
    docs.forEach(doc => {
        map[doc.path] = { ...doc, children: [] };
    });
    Object.values(map).forEach(node => {
        if (node.parentPath && map[node.parentPath]) {
            map[node.parentPath].children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

exports.getFiles = async (userId) => {
    const filesSnapshot = await getUserFilesCollection(userId).get();
    const fileDocs = filesSnapshot.docs.map(doc => doc.data());
    return buildTree(fileDocs);
};

exports.getFileContent = async (userId, relativePath) => {
    const docRef = getUserFilesCollection(userId).doc(relativePath.replace(/\//g, '_'));
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('File not found');
    return doc.data().content || '';
};

exports.createFile = (userId, relativePath) => {
    const docId = relativePath.replace(/\//g, '_');
    const docRef = getUserFilesCollection(userId).doc(docId);
    return docRef.create({ path: relativePath, name: path.basename(relativePath), parentPath: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath), type: 'file', content: '' });
};

exports.createFolder = (userId, relativePath) => {
    const docId = relativePath.replace(/\//g, '_');
    const docRef = getUserFilesCollection(userId).doc(docId);
    return docRef.create({ path: relativePath, name: path.basename(relativePath), parentPath: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath), type: 'folder' });
};

exports.saveFile = (userId, relativePath, content) => {
    const docId = relativePath.replace(/\//g, '_');
    const docRef = getUserFilesCollection(userId).doc(docId);
    return docRef.update({ content });
};

exports.deleteFile = (userId, relativePath) => {
    const docId = relativePath.replace(/\//g, '_');
    return getUserFilesCollection(userId).doc(docId).delete();
};

exports.deleteFolder = async (userId, relativePath) => {
    const userFiles = getUserFilesCollection(userId);
    const batch = db.batch();
    const folderDocRef = userFiles.doc(relativePath.replace(/\//g, '_'));
    batch.delete(folderDocRef);
    const query = userFiles.where('path', '>=', relativePath + '/').where('path', '<', relativePath + '0');
    const snapshot = await query.get();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
};

exports.renameItem = async (userId, oldPath, newName) => {
    const newPath = path.join(path.dirname(oldPath), newName);
    const userFiles = getUserFilesCollection(userId);
    const oldDocRef = userFiles.doc(oldPath.replace(/\//g, '_'));
    const newDocRef = userFiles.doc(newPath.replace(/\//g, '_'));
    const oldDoc = await oldDocRef.get();
    if (!oldDoc.exists) throw new Error('Item not found');
    const batch = db.batch();
    const oldData = oldDoc.data();
    batch.create(newDocRef, { ...oldData, path: newPath, name: newName });
    batch.delete(oldDocRef);
    if (oldData.type === 'folder') {
        const childrenQuery = userFiles.where('parentPath', '==', oldPath);
        const childrenSnapshot = await childrenQuery.get();
        childrenSnapshot.forEach(childDoc => {
            const childData = childDoc.data();
            const newChildPath = path.join(newPath, childData.name);
            batch.update(childDoc.ref, { parentPath: newPath, path: newChildPath });
        });
    }
    return batch.commit();
};

exports.updateUserProfile = (userId, profileData) => {
    const userDocRef = db.collection('users').doc(userId);
    return userDocRef.set(profileData, { merge: true });
};

exports.getAllUsers = async () => {
    const listUsersResult = await auth.listUsers(1000);
    const usersFromAuth = listUsersResult.users;
    const usersWithFirestoreData = await Promise.all(
        usersFromAuth.map(async (userRecord) => {
            const userDocRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userDocRef.get();
            const firestoreData = userDoc.exists ? userDoc.data() : {};
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                disabled: userRecord.disabled,
                classId: firestoreData.classId || null,
            };
        })
    );
    return usersWithFirestoreData;
};


// --- FUNGSI BARU ---
exports.getUserProfile = async (userId) => {
    const userDocRef = db.collection('users').doc(userId);
    const doc = await userDocRef.get();
    if (!doc.exists) {
        return null; // Kembalikan null jika profil belum ada
    }
    return doc.data();
};
