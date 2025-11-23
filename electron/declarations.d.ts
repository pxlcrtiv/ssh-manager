declare module 'ssh2' {
    export class Client {
        on(event: string, listener: Function): this;
        connect(config: any): this;
        shell(callback: Function): this;
        sftp(callback: Function): this;
        end(): void;
    }
}

declare module 'electron' {
    export class BrowserWindow {
        constructor(options?: any);
        loadURL(url: string): void;
        loadFile(path: string): void;
        webContents: any;
        isDestroyed(): boolean;
        static getAllWindows(): BrowserWindow[];
    }
    export const app: any;
    export const ipcMain: any;
    export const contextBridge: any;
    export const ipcRenderer: any;
    export const dialog: any;
}
