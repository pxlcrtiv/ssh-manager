export interface ElectronAPI {
    connectSSH: (config: any) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnectSSH: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
    onTerminalData: (callback: ({ connectionId, data }: { connectionId: string; data: string }) => void) => () => void;
    sendTerminalData: (connectionId: string, data: string) => void;
    initSFTP: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
    listDirectory: (connectionId: string, path: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
    uploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<{ success: boolean; error?: string }>;
    downloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<{ success: boolean; error?: string }>;
    showSaveDialog: (options?: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
    showOpenDialog: (options?: any) => Promise<{ success: boolean; canceled?: boolean; filePaths?: string[]; error?: string }>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
