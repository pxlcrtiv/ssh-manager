# Testing Guide for SSH Terminal Manager

## Automated Build Verification ✅

The following automated tests have been completed:

### Build Tests
- ✅ `npm run build:electron` - Main process TypeScript compilation
- ✅ `npm run build` - Full application build (Renderer + Main)

Both builds completed successfully without errors.

## Manual Testing Instructions

Since this is an Electron application with real SSH/SFTP functionality, proper testing requires a real SSH server.

### Prerequisites for Manual Testing

1. **SSH Server Access**: You need access to a real SSH server with:
   - Hostname/IP address
   - Port (default: 22)
   - Username
   - Password or SSH private key

### Test Procedure

#### 1. Start the Application

```bash
npm run electron
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch the Electron window with the UI

#### 2. Test SSH Connection

1. **Add a Host**:
   - Click "Add Connection" or navigate to the connections page
   - Fill in your SSH server details:
     - Name: (e.g., "Test Server")
     - Hostname: (your server's IP/domain)
     - Port: 22
     - Username: (your SSH username)
     - Authentication: Password or Private Key

2. **Connect via Terminal**:
   - Select your host from the list
   - Click "Open Terminal"
   - Verify:
     - ✅ Connection status shows "Connected"
     - ✅ You see a terminal prompt
     - ✅ You can type commands (e.g., `ls`, `pwd`, `whoami`)
     - ✅ Commands return output
     - ✅ Interactive commands work (e.g., `top`, `htop`)

#### 3. Test SFTP Browser

1. **Open SFTP Browser**:
   - Select your host from the list
   - Click "Browse Files" or "SFTP"
   - Verify:
     - ✅ You see the remote file system
     - ✅ Directory structure is displayed
     - ✅ File sizes and permissions are shown

2. **Navigate Directories**:
   - Click on folders to enter them
   - Click ".." to go up one level
   - Verify:
     - ✅ Path updates correctly
     - ✅ File list refreshes

3. **Upload Files**:
   - Click "Upload" button
   - Select a file from your local machine
   - Verify:
     - ✅ File appears in the file list after upload
     - ✅ File size matches original
     - ✅ Transfer progress is shown

4. **Download Files** (Note: Requires save dialog implementation):
   - This feature requires additional IPC handlers for file dialogs
   - Current implementation logs download requests

### Known Limitations

1. **Download Dialog**: The download feature requires `dialog.showSaveDialog` IPC integration, which is not yet implemented. The UI shows a notification about this.

2. **SSH Key Format**: Ensure private keys are in OpenSSH format. Convert if needed:
   ```bash
   ssh-keygen -p -m PEM -f ~/.ssh/id_rsa
   ```

3. **Host Key Verification**: First-time connections may fail if strict host key checking is enabled. This can be improved by implementing host key fingerprint verification in the UI.

## Architecture Verification

### IPC Communication Structure ✅

The following IPC channels have been implemented:

**SSH Handlers:**
- `ssh:connect` - Establish SSH connection
- `ssh:disconnect` - Close SSH connection
- `terminal:input` - Send data to SSH shell
- `terminal:data` - Receive data from SSH shell

**SFTP Handlers:**
- `sftp:init` - Initialize SFTP session
- `sftp:list` - List directory contents
- `sftp:upload` - Upload file to server
- `sftp:download` - Download file from server

All handlers are properly exposed through the preload script with context isolation enabled.

## Security Verification ✅

- ✅ `contextIsolation: true` in BrowserWindow
- ✅ `nodeIntegration: false` in BrowserWindow
- ✅ IPC exposed via `contextBridge` in preload script
- ✅ SSH credentials not stored in renderer localStorage (after conversion)
- ✅ Secure communication between main and renderer processes

## Next Steps for Production

1. **Add Host Key Verification Dialog**
2. **Implement Save Dialog for Downloads**
3. **Add Connection Timeout Handling**
4. **Implement Session Reconnection Logic**
5. **Add Comprehensive Error Messages for SSH Failures**
6. **Package Application** with `npm run electron:build`
