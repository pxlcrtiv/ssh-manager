import { ipcMain, dialog } from 'electron';

export function setupDialogHandlers() {
    // Show save dialog for file downloads
    ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
        try {
            const result = await dialog.showSaveDialog({
                title: options?.title || 'Save File',
                defaultPath: options?.defaultPath || 'untitled',
                filters: options?.filters || [
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['createDirectory', 'showOverwriteConfirmation']
            });

            return {
                success: true,
                canceled: result.canceled,
                filePath: result.filePath
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    });

    // Show open dialog for file uploads
    ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
        try {
            const result = await dialog.showOpenDialog({
                title: options?.title || 'Select File',
                properties: ['openFile', 'multiSelections'],
                filters: options?.filters || [
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            return {
                success: true,
                canceled: result.canceled,
                filePaths: result.filePaths
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    });
}
