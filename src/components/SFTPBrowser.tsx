import { useState } from 'react';
import { SSHHost, SFTPFile } from '@/types/ssh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  File, 
  ArrowLeft, 
  Home, 
  Upload, 
  Download,
  RefreshCw,
  Search,
  MoreVertical
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface SFTPBrowserProps {
  host: SSHHost;
  onClose: () => void;
}

// Mock SFTP data for demonstration
const mockFiles: SFTPFile[] = [
  {
    name: '..',
    path: '/home',
    size: 0,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root',
    modified: new Date('2024-01-15'),
  },
  {
    name: 'documents',
    path: '/home/user/documents',
    size: 0,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'user',
    group: 'user',
    modified: new Date('2024-01-20'),
  },
  {
    name: 'config.json',
    path: '/home/user/config.json',
    size: 2048,
    type: 'file',
    permissions: '-rw-r--r--',
    owner: 'user',
    group: 'user',
    modified: new Date('2024-01-22'),
  },
  {
    name: 'script.sh',
    path: '/home/user/script.sh',
    size: 1024,
    type: 'file',
    permissions: '-rwxr-xr-x',
    owner: 'user',
    group: 'user',
    modified: new Date('2024-01-21'),
  },
  {
    name: 'logs',
    path: '/home/user/logs',
    size: 0,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'user',
    group: 'user',
    modified: new Date('2024-01-19'),
  },
];

export const SFTPBrowser = ({ host, onClose }: SFTPBrowserProps) => {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [files, setFiles] = useState<SFTPFile[]>(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileIcon = (file: SFTPFile) => {
    if (file.type === 'directory') {
      return <Folder className="h-4 w-4 text-accent" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call with dynamic file generation
    setTimeout(() => {
      const dynamicFiles = [
        ...mockFiles,
        {
          name: `backup_${new Date().toISOString().split('T')[0]}.json`,
          path: `/home/user/backup_${new Date().toISOString().split('T')[0]}.json`,
          size: Math.floor(Math.random() * 5000) + 1000,
          type: 'file' as const,
          permissions: '-rw-r--r--',
          owner: 'user',
          group: 'user',
          modified: new Date(),
        },
        {
          name: 'temp',
          path: '/home/user/temp',
          size: 0,
          type: 'directory' as const,
          permissions: 'drwxr-xr-x',
          owner: 'user',
          group: 'user',
          modified: new Date(),
        }
      ];
      setFiles(dynamicFiles);
      setLoading(false);
    }, 800);
  };

  const handleFileClick = (file: SFTPFile) => {
    if (file.type === 'directory') {
      if (file.name === '..') {
        // Navigate up
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
      } else {
        // Navigate into directory
        setCurrentPath(file.path);
      }
      handleRefresh();
    }
  };

  const handleDownload = (file: SFTPFile) => {
    if (file.type === 'file') {
      // Simulate file download
      const blob = new Blob([`Content of ${file.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "File Downloaded",
        description: `${file.name} has been downloaded`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-primary">SFTP Browser</h2>
              <p className="text-sm text-muted-foreground">
                {host.username}@{host.hostname}
              </p>
            </div>
          </div>
          <Badge variant="success">Connected</Badge>
        </div>

        {/* Path and Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon">
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded border">
            {currentPath}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-1 p-4">
          {filteredFiles.map((file, index) => (
            <Card
              key={index}
              className="p-3 hover:bg-muted/50 cursor-pointer transition-colors border-transparent hover:border-primary/20"
              onClick={() => handleFileClick(file)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{file.permissions}</span>
                      <span>{file.owner}:{file.group}</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.modified)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {file.type === 'file' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredFiles.length} items</span>
          <span>Connected to {host.hostname}</span>
        </div>
      </div>
    </div>
  );
};