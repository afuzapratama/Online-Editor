// backend/services/previewService.js
const fs = require('fs');
const path = require('path');
const firestoreService = require('./firestoreService');

const previewsBaseDir = path.join(__dirname, '..', 'previews');

if (!fs.existsSync(previewsBaseDir)) {
    fs.mkdirSync(previewsBaseDir, { recursive: true });
}

// --- SCRIPT KONSOL BARU YANG LEBIH CANGGIH DAN ANDAL ---
const consoleInterceptorScript = `
<script>
    (function() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // Fungsi ini lebih pintar dalam mengubah berbagai jenis data menjadi teks
        const formatArg = (arg) => {
            if (arg instanceof Error) {
                return arg.stack || arg.message;
            }
            if (typeof arg === 'object' && arg !== null) {
                try {
                    // Gunakan replacer untuk menangani objek yang berulang (circular)
                    const cache = new Set();
                    return JSON.stringify(arg, (key, value) => {
                        if (typeof value === 'object' && value !== null) {
                            if (cache.has(value)) {
                                return '[Circular Reference]';
                            }
                            cache.add(value);
                        }
                        return value;
                    }, 2);
                } catch (e) {
                    return 'Unserializable Object';
                }
            }
            return String(arg);
        };

        const sendMessage = (type, args) => {
            // Ubah semua argumen menjadi teks dan gabungkan
            const message = Array.from(args).map(formatArg).join(' ');
            window.parent.postMessage({
                source: 'preview-console',
                type: type,
                message: message
            }, '*');
        };

        console.log = function(...args) {
            originalLog.apply(console, args);
            sendMessage('log', args);
        };
        console.error = function(...args) {
            originalError.apply(console, args);
            sendMessage('error', args);
        };
        console.warn = function(...args) {
            originalWarn.apply(console, args);
            sendMessage('warn', args);
        };
    })();
<\/script>
`;

const injectScript = (htmlContent) => {
    const headEndTag = /<\/head>/i;
    if (headEndTag.test(htmlContent)) {
        return htmlContent.replace(headEndTag, `${consoleInterceptorScript}</head>`);
    }
    const bodyEndTag = /<\/body>/i;
    if (bodyEndTag.test(htmlContent)) {
        return htmlContent.replace(bodyEndTag, `${consoleInterceptorScript}</body>`);
    }
    return htmlContent + consoleInterceptorScript;
};

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
                let content = file.content || '';
                // Injeksi script hanya ke file index.html utama
                if (file.path === 'index.html') {
                    content = injectScript(content);
                }
                fs.writeFileSync(fullPath, content);
            }
        });
    };
    writeFilesRecursively(allFiles, userPreviewPath);
    return `https://preview-${userId}.htmlin.my.id`;
};

exports.syncToLocalWorkspace = (userId, action, data) => {
    const userPreviewPath = path.join(previewsBaseDir, userId);
    if (!fs.existsSync(userPreviewPath)) return;
    
    const { relativePath, content, newName, oldPath } = data;
    try {
        switch (action) {
            case 'save':
            case 'create_file': {
                let fileContent = content || '';
                if (relativePath === 'index.html') {
                    fileContent = injectScript(fileContent);
                }
                const filePath = path.join(userPreviewPath, relativePath);
                const dirName = path.dirname(filePath);
                if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
                fs.writeFileSync(filePath, fileContent);
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
