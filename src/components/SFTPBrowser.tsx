import React, { useState, useEffect, useRef } from 'react';
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
  MoreVertical,
  Share2,
  FileText,
  Trash2,
  Copy,
  Move,
  Info,
  Grid,
  List,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useSSHConnections } from '@/hooks/useSSHConnections';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SFTPBrowserProps {
  host: SSHHost;
  onClose: () => void;
}

interface TransferProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'failed';
  direction: 'upload' | 'download' | 'transfer';
  error?: string;
}

const FileItem: React.FC<{
  file: SFTPFile;
  onFileClick: (file: SFTPFile) => void;
  onDownload: (file: SFTPFile) => void;
  isSelected: boolean;
  onToggleSelect: (name: string) => void;
}> = ({ file, onFileClick, onDownload, isSelected, onToggleSelect }) => {
  return (
    <Card
      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors border-transparent hover:border-primary/20 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onFileClick(file)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(file.name);
            }}
            className="h-5 w-5 rounded border text-muted-foreground hover:text-primary"
          >
            {isSelected && <CheckCircle2 className="h-4 w-4" />}
          </button>
          {file.type === 'directory' ? (
            <Folder className="h-4 w-4 text-accent" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm truncate">{file.name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{file.permissions}</span>
              <span>{file.owner}:{file.group}</span>
              <span>{file.type === 'file' ? `${(file.size / 1024).toFixed(1)} KB` : '-'}</span>
              <span>{new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(file.modified))}</span>
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
                onDownload(file);
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const SFTPBrowser = ({ host, onClose }: SFTPBrowserProps) => {
  const [currentPath, setCurrentPath] = useState('/home'); // Default start path
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addConnection, disconnectHost } = useSSHConnections();

  useEffect(() => {
    const connect = async () => {
      try {
        setLoading(true);
        const connId = await addConnection(host) as unknown as string;
        if (connId) {
          setConnectionId(connId);
          // Initialize SFTP
          const result = await window.electronAPI.initSFTP(connId);
          if (result.success) {
            await refreshFiles(connId, currentPath);
          } else {
            toast({
              title: "SFTP Error",
              description: result.error || "Failed to initialize SFTP",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to SFTP server",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    connect();

    return () => {
      if (connectionId) {
        disconnectHost(host.id);
      }
    };
  }, [host]);

  const refreshFiles = async (connId: string, path: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listDirectory(connId, path);
      if (result.success && result.files) {
        // Add '..' entry if not root
        const fileList = result.files;
        if (path !== '/') {
          fileList.unshift({
            name: '..',
            path: path.split('/').slice(0, -1).join('/') || '/',
            size: 0,
            type: 'directory',
            permissions: '',
            owner: '',
            group: '',
            modified: new Date(),
          });
        }
        setFiles(fileList);
      } else {
        toast({
          title: "Error Listing Files",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (connectionId) {
      refreshFiles(connectionId, currentPath);
    }
  };

  const handleFileClick = (file: SFTPFile) => {
    if (file.type === 'directory') {
      let newPath = file.path;
      if (file.name === '..') {
        newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      }
      setCurrentPath(newPath);
      if (connectionId) {
        refreshFiles(connectionId, newPath);
      }
    }
  };

  const handleDownload = async (file: SFTPFile) => {
    if (!connectionId || file.type !== 'file') return;

    try {
      // Show save dialog
      const result = await window.electronAPI.showSaveDialog({
        title: 'Save File',
        defaultPath: file.name,
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.success && !result.canceled && result.filePath) {
        // Start download
        const transferId = `download-${Date.now()}-${file.name}`;
        setTransfers(prev => [...prev, {
          id: transferId,
          fileName: file.name,
          progress: 0,
          status: 'in-progress',
          direction: 'download'
        }]);
        setShowTransferPanel(true);

        const downloadResult = await window.electronAPI.downloadFile(connectionId, file.path, result.filePath);

        setTransfers(prev => prev.map(t =>
          t.id === transferId
            ? { ...t, status: downloadResult.success ? 'completed' : 'failed', progress: 100, error: downloadResult.error }
            : t
        ));

        if (downloadResult.success) {
          toast({
            title: "Download Complete",
            description: `${file.name} has been downloaded.`
          });
        } else {
          toast({
            title: "Download Failed",
            description: downloadResult.error,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && connectionId) {
      Array.from(files).forEach(async file => {
        const localPath = (file as any).path; // Electron exposes path
        if (!localPath) return;

        const remotePath = `${currentPath === '/' ? '' : currentPath}/${file.name}`;

        const transferId = `upload-${Date.now()}-${file.name}`;
        setTransfers(prev => [...prev, {
          id: transferId,
          fileName: file.name,
          progress: 0,
          status: 'in-progress',
          direction: 'upload'
        }]);
        setShowTransferPanel(true);

        const result = await window.electronAPI.uploadFile(connectionId, localPath, remotePath);

        setTransfers(prev => prev.map(t =>
          t.id === transferId
            ? { ...t, status: result.success ? 'completed' : 'failed', progress: 100, error: result.error }
            : t
        ));

        if (result.success) {
          toast({ title: "Upload Complete", description: `${file.name} uploaded.` });
          handleRefresh();
        } else {
          toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
        }
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTransferPanel(!showTransferPanel)}
              className={transfers.length > 0 ? "ring-2 ring-primary" : ""}
            >
              Transfers {transfers.length > 0 && `(${transfers.length})`}
            </Button>
            <Badge variant="success">Connected</Badge>
          </div>
        </div>

        {/* Path and Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => {
            setCurrentPath('/home');
            if (connectionId) refreshFiles(connectionId, '/home');
          }}>
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
          <Button variant="outline" size="sm" onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-1">
            {filteredFiles.map((file, index) => (
              <FileItem
                key={index}
                file={file}
                onFileClick={handleFileClick}
                onDownload={handleDownload}
                isSelected={selectedFiles.includes(file.name)}
                onToggleSelect={(name) => {
                  if (selectedFiles.includes(name)) setSelectedFiles(prev => prev.filter(n => n !== name));
                  else setSelectedFiles(prev => [...prev, name]);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transfer Panel */}
      {showTransferPanel && transfers.length > 0 && (
        <div className="fixed bottom-0 right-0 w-80 bg-background border border-foreground/10 shadow-lg z-50 rounded-t-lg">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">File Transfers</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowTransferPanel(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-60">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="p-3 border-b last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate max-w-[150px]">{transfer.fileName}</span>
                  <Badge variant={transfer.status === 'completed' ? 'outline' : 'secondary'}>
                    {transfer.status}
                  </Badge>
                </div>
                <Progress value={transfer.progress} className="h-1.5" />
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};