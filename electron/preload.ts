import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    connectSSH: (config: any) => ipcRenderer.invoke('ssh:connect', config),
    disconnectSSH: (connectionId: string) => ipcRenderer.invoke('ssh:disconnect', connectionId),
    onTerminalData: (callback: ({ connectionId, data }: { connectionId: string; data: string }) => void) => {
        const subscription = (_event: any, terminalData: { connectionId: string; data: string }) => callback(terminalData);
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
