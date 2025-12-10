import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';
import { randomUUID } from 'crypto';
import { setupDialogHandlers } from './dialogs.js';

// ES module polyfills for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Note: electron-squirrel-startup is only needed for Windows NSIS installers
// Commented out for ES module compatibility - re-enable with dynamic import if needed
// if ((await import('electron-squirrel-startup')).default) {
//   app.quit();
// }

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset', // Mac style
    backgroundColor: '#000000',
  });

  // In production, load the index.html
  // In development, load the Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createWindow();
  setupDialogHandlers();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- SSH Implementation ---

interface SSHSession {
  client: Client;
  stream?: any; // ClientChannel
  sftp?: any; // SFTPWrapper
}

const sshSessions = new Map<string, SSHSession>();

ipcMain.handle('ssh:connect', async (event, config) => {
  const connectionId = randomUUID();

  return new Promise((resolve, reject) => {
    try {
      const conn = new Client();
      
      // Log connection attempt
      console.log(`Attempting SSH connection to ${config.hostname}:${config.port} with ID: ${connectionId}`);
      
      conn
        .on('ready', () => {
          console.log(`SSH connection established with ID: ${connectionId}`);
          
          conn.shell((err, stream) => {
            if (err) {
              console.error(`Error creating shell for connection ${connectionId}:`, err);
              reject({ success: false, error: err.message });
              return;
            }

            // Store the session with connectionId
            sshSessions.set(connectionId, { client: conn, stream });

            // Handle data from stream - real SSH output
            stream.on('data', (data: Buffer) => {
              if (!mainWindow?.isDestroyed() && connectionId) {
                // Send raw SSH output to renderer
                event.sender.send('terminal:data', { connectionId, data: data.toString() });
              }
            });

            stream.on('close', () => {
              console.log(`SSH connection closed for ID: ${connectionId}`);
              conn.end();
              sshSessions.delete(connectionId);
              if (!mainWindow?.isDestroyed() && connectionId) {
                event.sender.send('terminal:data', { connectionId, data: '\r\nConnection closed.\r\n' });
              }
            });

            resolve({ success: true, connectionId });
          });
        })
        .on('error', (err: Error) => {
          console.error(`SSH connection error for ID ${connectionId}:`, err);
          reject({ success: false, error: err.message });
        })
        .connect({
          host: config.hostname,
          port: config.port,
          username: config.username,
          password: config.password,
          privateKey: config.privateKey,
          keepaliveInterval: 30000,
          readyTimeout: 20000
        });
    } catch (error) {
      console.error(`Unexpected error in SSH connection for ID ${connectionId}:`, error);
      reject({ success: false, error: (error as Error).message });
    }
  });
});

ipcMain.handle('ssh:disconnect', async (event, connectionId) => {
  const session = sshSessions.get(connectionId);
  if (session) {
    session.client.end();
    sshSessions.delete(connectionId);
    return { success: true };
  }
  return { success: false, error: 'Connection not found' };
});

ipcMain.on('terminal:input', (event, connectionId, data) => {
  const session = sshSessions.get(connectionId);
  if (session && session.stream) {
    session.stream.write(data);
  }
});

// --- SFTP Implementation ---

ipcMain.handle('sftp:init', async (event, connectionId) => {
  const session = sshSessions.get(connectionId);
  if (!session) return { success: false, error: 'Session not found' };

  return new Promise((resolve) => {
    session.client.sftp((err: Error | undefined, sftp: any) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      session.sftp = sftp;
      resolve({ success: true });
    });
  });
});

ipcMain.handle('sftp:list', async (event, connectionId, remotePath) => {
  const session = sshSessions.get(connectionId);
  if (!session || !session.sftp) return { success: false, error: 'SFTP session not ready' };

  return new Promise((resolve) => {
    session.sftp.readdir(remotePath, (err: Error | undefined, list: any[]) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      // Transform to SFTPFile format
      const files = list.map(item => ({
        name: item.filename,
        path: path.posix.join(remotePath, item.filename),
        size: item.attrs.size,
        type: item.attrs.isDirectory() ? 'directory' : 'file',
        permissions: item.attrs.mode, // Simplified
        owner: item.attrs.uid,
        group: item.attrs.gid,
        modified: new Date(item.attrs.mtime * 1000),
      }));
      resolve({ success: true, files });
    });
  });
});

ipcMain.handle('sftp:upload', async (event, connectionId, localPath, remotePath) => {
  const session = sshSessions.get(connectionId);
  if (!session || !session.sftp) return { success: false, error: 'SFTP session not ready' };

  return new Promise((resolve) => {
    session.sftp.fastPut(localPath, remotePath, (err: Error | undefined) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('sftp:download', async (event, connectionId, remotePath, localPath) => {
  const session = sshSessions.get(connectionId);
  if (!session || !session.sftp) return { success: false, error: 'SFTP session not ready' };

  return new Promise((resolve) => {
    session.sftp.fastGet(remotePath, localPath, (err: Error | undefined) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});
