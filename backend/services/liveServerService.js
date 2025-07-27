// backend/services/liveServerService.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const firestoreService = require('./firestoreService');

let liveServerProcesses = {};
const workspaceBaseDir = path.join(__dirname, '..', 'workspaces');

exports.runServer = async (userId) => {
    if (liveServerProcesses[userId] && !liveServerProcesses[userId].process.killed) {
        return liveServerProcesses[userId].url;
    }

    const userWorkspace = path.join(workspaceBaseDir, userId);
    fs.rmSync(userWorkspace, { recursive: true, force: true });
    fs.mkdirSync(userWorkspace, { recursive: true });

    const allFiles = await firestoreService.getFiles(userId); // Ambil semua file dari user
    
    // Helper function to write files recursively
    const writeFiles = (files, currentPath) => {
        files.forEach(file => {
            const filePath = path.join(currentPath, file.name);
            if (file.type === 'folder') {
                if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
                if (file.children) writeFiles(file.children, filePath);
            } else {
                fs.writeFileSync(filePath, file.content || '');
            }
        });
    };
    writeFiles(allFiles, userWorkspace);

    const { default: getPort } = await import('get-port');
    const port = await getPort({ port: 8000 });
    const url = `http://localhost:${port}`;
    const process = spawn('npx', ['live-server', '.', `--port=${port}`, '--no-browser'], { cwd: userWorkspace });
    
    liveServerProcesses[userId] = { process, url };
    
    process.on('close', () => {
        delete liveServerProcesses[userId];
    });

    return new Promise((resolve, reject) => {
        let responseSent = false;
        process.stdout.on('data', (data) => {
            if (data.toString().includes('Serving') && !responseSent) {
                responseSent = true;
                resolve(url);
            }
        });
        process.stderr.on('data', (data) => {
            console.error(`live-server stderr: ${data}`);
            if (!responseSent) {
                responseSent = true;
                reject(new Error('Live server failed to start.'));
            }
        });
    });
};

exports.syncToLocalWorkspace = (userId, action, data) => {
    const liveServerInfo = liveServerProcesses[userId];
    if (liveServerInfo && !liveServerInfo.process.killed) {
        console.log(`[Live Reload] Syncing action: ${action} for user: ${userId}`);
        const userWorkspace = path.join(workspaceBaseDir, userId);
        const { relativePath, content, newName, oldPath } = data;
        
        try {
            switch (action) {
                case 'save':
                case 'create_file': {
                    const filePath = path.join(userWorkspace, relativePath);
                    const dirName = path.dirname(filePath);
                    if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
                    fs.writeFileSync(filePath, content || '');
                    break;
                }
                case 'create_folder': {
                    const folderPath = path.join(userWorkspace, relativePath);
                    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                    break;
                }
                case 'delete_file': {
                    const filePath = path.join(userWorkspace, relativePath);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    break;
                }
                case 'delete_folder': {
                    const folderPath = path.join(userWorkspace, relativePath);
                    if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });
                    break;
                }
                case 'rename': {
                    const oldFullPath = path.join(userWorkspace, oldPath);
                    const newFullPath = path.join(path.dirname(oldFullPath), newName);
                    if (fs.existsSync(oldFullPath)) fs.renameSync(oldFullPath, newFullPath);
                    break;
                }
            }
        } catch (e) {
            console.error(`[Live Reload] Failed to sync action ${action}:`, e);
        }
    }
};
