const fs = require('fs');
const path = require('path');
const firestoreService = require('./firestoreService');

const previewsBaseDir = path.join(__dirname, '..', 'previews');

if (!fs.existsSync(previewsBaseDir)) {
    fs.mkdirSync(previewsBaseDir, { recursive: true });
}

exports.preparePreview = async (userId) => {
    const userPreviewPath = path.join(previewsBaseDir, userId);

    fs.rmSync(userPreviewPath, { recursive: true, force: true });
    fs.mkdirSync(userPreviewPath, { recursive: true });

    const allFiles = await firestoreService.getFiles(userId);

    const writeFilesRecursively = (files, currentPath) => {
        files.forEach(file => {
            const fullPath = path.join(currentPath, file.name);
            if (file.type === 'folder') {
                if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
                if (file.children && file.children.length > 0) {
                    writeFilesRecursively(file.children, fullPath);
                }
            } else {
                fs.writeFileSync(fullPath, file.content || '');
            }
        });
    };

    writeFilesRecursively(allFiles, userPreviewPath);

    // Kembalikan path URL yang spesifik, menunjuk langsung ke index.html
    return `/previews/${userId}/index.html`;
};

// Fungsi ini menyinkronkan perubahan ke folder pratinjau agar live reload (manual) berfungsi
exports.syncToLocalWorkspace = (userId, action, data) => {
    const userPreviewPath = path.join(previewsBaseDir, userId);
    if (!fs.existsSync(userPreviewPath)) return;
    
    const { relativePath, content, newName, oldPath } = data;
    try {
        switch (action) {
            case 'save':
            case 'create_file': {
                const filePath = path.join(userPreviewPath, relativePath);
                const dirName = path.dirname(filePath);
                if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
                fs.writeFileSync(filePath, content || '');
                break;
            }
            case 'create_folder': {
                const folderPath = path.join(userPreviewPath, relativePath);
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                break;
            }
            case 'delete_file': {
                const filePath = path.join(userPreviewPath, relativePath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                break;
            }
            case 'delete_folder': {
                const folderPath = path.join(userPreviewPath, relativePath);
                if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });
                break;
            }
            case 'rename': {
                const oldFullPath = path.join(userPreviewPath, oldPath);
                const newFullPath = path.join(path.dirname(oldFullPath), newName);
                if (fs.existsSync(oldFullPath)) fs.renameSync(oldFullPath, newFullPath);
                break;
            }
        }
    } catch (e) {
        console.error(`[Live Sync] Failed to sync action ${action}:`, e);
    }
};