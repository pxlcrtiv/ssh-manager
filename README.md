# SSH Terminal Manager

A modern, feature-rich **Electron desktop application** for managing SSH connections with built-in terminal and SFTP capabilities. Built with React, TypeScript, and real SSH/SFTP functionality powered by `ssh2` and `xterm.js`.

## 🚀 Features

### SSH Terminal
- **Real SSH Connections**: Connect to any SSH server with password or key-based authentication
- **Interactive Terminal**: Full-featured terminal powered by xterm.js
- **Multiple Sessions**: Manage multiple SSH connections simultaneously
- **Session History**: Track and reconnect to previously used servers

### SFTP File Browser
- **Remote File System**: Browse directories and files on remote servers
- **File Operations**: 
  - Upload files from your local machine
  - Download files with native save dialogs
  - Navigate directory structures
  - View file permissions and metadata
- **Transfer Progress**: Real-time upload/download progress tracking

### Connection Management
- **Host Profiles**: Save and organize SSH connection configurations
- **Quick Search**: Find hosts by name, hostname, username, or tags
- **Tag-based Organization**: Categorize hosts with custom tags
- **Visual Status Indicators**: See active connections at a glance

### Security
- **Local Credential Storage**: All SSH credentials stored locally with encryption
- **Context Isolation**: Electron security best practices enforced
- **No External Transmission**: Sensitive data never leaves your machine

## 🛠️ Technology Stack

- **Desktop Framework**: Electron 28
- **Frontend**: React 18 with TypeScript
- **Terminal**: xterm.js with FitAddon
- **SSH/SFTP**: ssh2 (Node.js SSH2 client)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Build Tool**: Vite + electron-builder
- **IPC Communication**: Secure context-isolated preload scripts

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/pxlcrtiv/ssh-manager.git
cd ssh-manager

# Install dependencies
npm install

# Run in development mode
npm run electron
```

### Build for Production

```bash
# Build the application
npm run build

# Package for your platform
npm run electron:build
```

This will create distributable packages in the `release/` directory:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable `.exe`
- **Linux**: `.AppImage` and `.deb` packages

## 🎯 Usage

### Adding SSH Hosts

1. Click **"Add Host"** in the connections page
2. Enter connection details:
   - **Name**: Friendly name for the host
   - **Hostname**: IP address or domain
   - **Port**: SSH port (default: 22)
   - **Username**: SSH username
   - **Authentication**: Password or private key
3. Add optional tags and description
4. Save the profile

### Connecting via Terminal

1. Select a host from your saved connections
2. Click **"Open Terminal"**
3. Enter password/passphrase if prompted
4. Use the terminal like any SSH client:
   - Run commands (`ls`, `cd`, `vim`, etc.)
   - Interactive programs (`top`, `htop`, `nano`)
   - Long-running processes

### Using SFTP Browser

1. Select a host and click **"Browse Files"**
2. Navigate the remote file system
3. **Upload files**: Click "Upload" and select local files
4. **Download files**: Click download icon, choose save location
5. View file details (permissions, size, modified date)

## 🔒 Security Features

### Implemented Security
- ✅ **Context Isolation**: Electron's `contextIsolation: true`
- ✅ **No Node Integration**: `nodeIntegration: false` in renderer
- ✅ **Secure IPC**: All communication through validated channels
- ✅ **Local Encryption**: Sensitive data encrypted locally
- ✅ **No External APIs**: All operations happen locally

### Best Practices
- Use SSH keys instead of passwords when possible
- Keep your SSH keys secure and password-protected
- Regularly update the application for security patches
- Review saved hosts and remove unused connections

## 📦 Distribution

### Automated Builds (CI/CD)

The project includes GitHub Actions workflows for automated builds:

- **On every commit**: Run tests and build verification
- **On tagged release** (e.g., `v1.0.0`): Build installers for:
  - macOS (`.dmg`, `.zip`)
  - Windows (`.exe` installer, portable)
  - Linux (`.AppImage`, `.deb`)

To create a release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

Installers will be automatically built and attached to the GitHub Release.

### Manual Building

```bash
# Build for current platform
npm run electron:build

# Build for specific platform (requires platform tools)
npm run electron:build -- --mac
npm run electron:build -- --win
npm run electron:build -- --linux
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run build` (verify compilation)
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Test SSH/SFTP features with real servers
- Update documentation for new features
- Ensure builds pass on all platforms

## 📝 Testing

See [`TESTING.md`](TESTING.md) for comprehensive testing instructions.

### Quick Test Checklist
- [ ] SSH connection to real server works
- [ ] Terminal commands execute correctly
- [ ] SFTP browser displays remote files
- [ ] File upload completes successfully
- [ ] File download with save dialog works
- [ ] Application builds without errors

## 🐛 Known Issues

1. **Download Progress**: File downloads don't show real-time progress (downloads happen instantly for small files)
2. **Host Key Verification**: First-time SSH connections may require manual host key acceptance

## 📚 Documentation

- **[TESTING.md](TESTING.md)**: Comprehensive testing guide
- **[EVALUATION.md](EVALUATION.md)**: Project evaluation and feature status
- **GitHub Wiki**: Extended documentation and guides

## 🙏 Acknowledgments

- **[Electron](https://www.electronjs.org/)**: Cross-platform desktop framework
- **[ssh2](https://github.com/mscdex/ssh2)**: Pure JavaScript SSH2 client
- **[xterm.js](https://xtermjs.org/)**: Terminal emulator for the web
- **[shadcn/ui](https://ui.shadcn.com/)**: Re-usable component library
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Vite](https://vitejs.dev/)**: Next generation frontend tooling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/pxlcrtiv/ssh-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pxlcrtiv/ssh-manager/discussions)
- **Email**: Support via GitHub only

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the SSH community**
