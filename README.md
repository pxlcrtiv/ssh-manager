# SSH Terminal Manager

A modern, feature-rich SSH host management application built with React, TypeScript, and modern web technologies. Manage your SSH connections with an intuitive interface, SFTP browser, and automated backup capabilities.

## 🚀 Features

### Core Functionality
- **SSH Host Management**: Add, edit, and organize SSH connection profiles
- **Quick Search**: Find hosts by name, hostname, username, or tags
- **Connection Status**: Visual indicators for active connections
- **Host Organization**: Tag-based categorization and filtering

### Advanced Features
- **SFTP Browser**: Built-in file browser for secure file transfers
- **Import/Export**: Backup and restore your host configurations
- **Auto Backup**: Automated backup scheduling for your SSH profiles
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### User Experience
- **Modern UI**: Clean, intuitive interface with dark theme support
- **Keyboard Navigation**: Efficient keyboard shortcuts and navigation
- **Real-time Feedback**: Toast notifications for user actions
- **Persistent Storage**: Local storage for your configuration data

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React hooks and context
- **Icons**: Lucide React icons
- **Build Tool**: Vite
- **Styling**: CSS custom properties with theme support

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Quick Start

```bash
# Clone the repository
git clone <your-repository-url>
cd ssh-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

### Adding SSH Hosts
1. Click the "Add Host" button in the main interface
2. Fill in the connection details (name, hostname, port, username)
3. Add optional description and tags for organization
4. Save the host configuration

### Managing Connections
- **Connect**: Click the connect button on any host card
- **SFTP**: Access the built-in file browser for secure transfers
- **Edit**: Modify host details by clicking the edit button
- **Delete**: Remove hosts with the delete button

### Settings and Backup
1. Click the settings icon in the header
2. Use the Import/Export tab to backup or restore configurations
3. Configure automatic backups in the Auto Backup tab
4. Set backup intervals and retention policies

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_APP_NAME=SSH Terminal Manager
VITE_APP_VERSION=1.0.0
```

### Customization
- Modify theme colors in `tailwind.config.ts`
- Update UI components in `src/components/ui/`
- Extend functionality in `src/hooks/` for custom logic

## 📱 Deployment

### Static Hosting
Build the project and deploy the `dist` folder to your preferred static hosting service:

- **Netlify**: Connect your GitHub repo for automatic deployments
- **Vercel**: Zero-config deployment with Git integration
- **GitHub Pages**: Host directly from your repository
- **AWS S3**: Upload the built files to an S3 bucket

### Docker Deployment
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security

### Best Practices
- All SSH credentials are stored locally in your browser
- No sensitive data is transmitted to external servers
- Use strong passwords and SSH keys for your connections
- Regularly backup your host configurations

### Data Privacy
- Application data is stored locally using browser storage
- No analytics or tracking is implemented
- All file operations happen locally in your browser

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code style
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports and Feature Requests

- **Bug Reports**: Please open an issue with detailed reproduction steps
- **Feature Requests**: Submit an issue with the "enhancement" label
- **Questions**: Use the discussions section for general questions

## 📞 Support

- **Documentation**: Check the wiki for detailed guides
- **Issues**: Report bugs and request features on GitHub
- **Community**: Join our discussion forum for help and tips

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Vite](https://vitejs.dev/)

---

**Made with ❤️ by the SSH Terminal Manager team**
