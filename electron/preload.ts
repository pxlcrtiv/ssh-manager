import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    connectSSH: (config: any) => ipcRenderer.invoke('ssh:connect', config),
    disconnectSSH: (connectionId: string) => ipcRenderer.invoke('ssh:disconnect', connectionId),
    onTerminalData: (callback: (data: string) => void) => {
        const subscription = (_event: any, data: string) => callback(data);
        ipcRenderer.on('terminal:data', subscription);
        return () => ipcRenderer.removeListener('terminal:data', subscription);
    },
    sendTerminalData: (connectionId: string, data: string) => ipcRenderer.send('terminal:input', connectionId, data),

    // SFTP
    initSFTP: (connectionId: string) => ipcRenderer.invoke('sftp:init', connectionId),
    listDirectory: (connectionId: string, path: string) => ipcRenderer.invoke('sftp:list', connectionId, path),
    uploadFile: (connectionId: string, localPath: string, remotePath: string) => ipcRenderer.invoke('sftp:upload', connectionId, localPath, remotePath),
    downloadFile: (connectionId: string, remotePath: string, localPath: string) => ipcRenderer.invoke('sftp:download', connectionId, remotePath, localPath),

    // Dialogs
    showSaveDialog: (options?: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showOpenDialog: (options?: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
});
