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

// Mock target server list for cross-server transfers
const mockTargetServers = [
  { id: 'server1', name: 'Production Server' },
  { id: 'server2', name: 'Staging Environment' },
  { id: 'server3', name: 'Development Machine' },
];

interface SFTPBrowserProps {
  host: SSHHost;
  onClose: () => void;
}

// File transfer progress interface
interface TransferProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'failed';
  direction: 'upload' | 'download' | 'transfer';
  error?: string;
}

// File Item Component
const FileItem: React.FC<{
  file: SFTPFile;
  onFileClick: (file: SFTPFile) => void;
  onDownload: (file: SFTPFile) => void;
  isSelected: boolean;
  onToggleSelect: (name: string) => void;
}> = ({ file, onFileClick, onDownload, isSelected, onToggleSelect }) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real implementation, this would show a context menu
  };

  return (
    <Card
      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors border-transparent hover:border-primary/20 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onFileClick(file)}
      onContextMenu={handleContextMenu}
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
            {isSelected && (
              <CheckCircle2 className="h-4 w-4" />
            )}
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
              }).format(file.modified)}</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {file.type === 'file' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onDownload(file);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'File Operation',
                  description: `Feature to copy ${file.name} would be implemented here`,
                  variant: 'default'
                });
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'File Operation',
                  description: `Feature to move ${file.name} would be implemented here`,
                  variant: 'default'
                });
              }}>
                <Move className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'File Operation',
                  description: `Feature to rename ${file.name} would be implemented here`,
                  variant: 'default'
                });
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'File Operation',
                  description: `Feature to delete ${file.name} would be implemented here`,
                  variant: 'default'
                });
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'File Details',
                  description: `${file.name}: ${file.permissions}, ${file.type === 'file' ? `${(file.size / 1024).toFixed(1)} KB` : 'Folder'}`,
                  variant: 'default'
                });
              }}>
                <Info className="h-4 w-4 mr-2" />
                Details
              </DropdownMenuItem>
              {file.type === 'file' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const targetServer = mockTargetServers[Math.floor(Math.random() * mockTargetServers.length)];
                  toast({
                    title: 'Cross-Server Transfer',
                    description: `Initiated transfer of ${file.name} to ${targetServer.name}`,
                    variant: 'default'
                  });
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Transfer to Another Server
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export const SFTPBrowser = ({ host, onClose }: SFTPBrowserProps) => {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [files, setFiles] = useState<SFTPFile[]>(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [currentDirectoryFiles, setCurrentDirectoryFiles] = useState<Record<string, SFTPFile[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addConnection, disconnectHost } = useSSHConnections();

  // Simulate connecting to SSH server on mount
  useEffect(() => {
    const connect = async () => {
      try {
        addConnection(host.id);
      } catch (error) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to SFTP server",
          variant: "destructive"
        });
      }
    };

    connect();

    // Cleanup connection on unmount
    return () => {
      disconnectHost(host.id);
    };
  }, [host.id, addConnection, disconnectHost]);

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

  const handleDownload = async (file: SFTPFile) => {
    if (file.type === 'file') {
      // Create a transfer progress entry
      const transferId = `download-${Date.now()}-${file.name}`;
      const newTransfer: TransferProgress = {
        id: transferId,
        fileName: file.name,
        progress: 0,
        status: 'in-progress',
        direction: 'download'
      };
      
      setTransfers(prev => [...prev, newTransfer]);
      setShowTransferPanel(true);
      
      // Simulate download progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update transfer status
          setTransfers(prev => prev.map(t => 
            t.id === transferId ? { ...t, progress: 100, status: 'completed' } : t
          ));
          
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
          
          // Auto-remove completed transfer after 5 seconds
          setTimeout(() => {
            setTransfers(prev => prev.filter(t => t.id !== transferId));
          }, 5000);
        }
        
        setTransfers(prev => prev.map(t => 
          t.id === transferId ? { ...t, progress } : t
        ));
      }, 300);
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        // Create a transfer progress entry for each file
        const transferId = `upload-${Date.now()}-${file.name}`;
        const newTransfer: TransferProgress = {
          id: transferId,
          fileName: file.name,
          progress: 0,
          status: 'in-progress',
          direction: 'upload'
        };
        
        setTransfers(prev => [...prev, newTransfer]);
        setShowTransferPanel(true);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Update transfer status
            setTransfers(prev => prev.map(t => 
              t.id === transferId ? { ...t, progress: 100, status: 'completed' } : t
            ));
            
            toast({
              title: "File Uploaded",
              description: `${file.name} has been uploaded`,
            });
            
            // Refresh file list to show uploaded file
            handleRefresh();
            
            // Auto-remove completed transfer after 5 seconds
            setTimeout(() => {
              setTransfers(prev => prev.filter(t => t.id !== transferId));
            }, 5000);
          }
          
          setTransfers(prev => prev.map(t => 
            t.id === transferId ? { ...t, progress } : t
          ));
        }, 300);
      });
    }
    
    // Reset the input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleSelect = (fileName: string) => {
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(selectedFiles.filter(name => name !== fileName));
    } else {
      setSelectedFiles([...selectedFiles, fileName]);
    }
  };

  // Hidden file input for uploads
  const renderFileInput = () => (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      onChange={handleFileUpload}
      className="hidden"
    />
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
          <Button variant="ghost" size="icon">
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded border">
            {currentPath}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading files...</p>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No files found</p>
          </div>
        ) : (
          <div className="p-4">
            {viewMode === 'list' ? (
              <div className="grid gap-1">
                {filteredFiles.map((file, index) => (
                  <FileItem
                    key={index}
                    file={file}
                    onFileClick={handleFileClick}
                    onDownload={handleDownload}
                    isSelected={selectedFiles.includes(file.name)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredFiles.map((file, index) => (
                  <Card 
                    key={index} 
                    className={`p-3 hover:bg-muted/50 transition-colors ${selectedFiles.includes(file.name) ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex flex-col items-center text-center">
                      {file.type === 'directory' ? (
                        <Folder className="h-10 w-10 text-accent mb-2" />
                      ) : (
                        <File className="h-10 w-10 text-muted-foreground mb-2" />
                      )}
                      <h4 className="font-medium mb-1 truncate w-full">{file.name}</h4>
                      <p className="text-xs text-muted-foreground">{file.type === 'file' ? `${(file.size / 1024).toFixed(1)} KB` : 'Folder'}</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(file.name);
                          }} 
                          className="h-7 w-7"
                        >
                          {selectedFiles.includes(file.name) ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <div className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {file.type === 'file' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }} 
                            className="h-7 w-7"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredFiles.length} items</span>
          <span>Connected to {host.hostname}</span>
        </div>
      </div>

      {/* Transfer Panel */}
      {showTransferPanel && transfers.length > 0 && (
        <div className="fixed bottom-0 right-0 w-80 bg-background border border-foreground/10 shadow-lg z-50 rounded-t-lg">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">File Transfers</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowTransferPanel(false)} 
              className="h-7 w-7"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-60">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="p-3 border-b last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {transfer.direction === 'upload' ? (
                      <ArrowUpCircle className="h-4 w-4 text-primary" />
                    ) : transfer.direction === 'download' ? (
                      <ArrowDownCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Share2 className="h-4 w-4 text-info" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[150px]">{transfer.fileName}</span>
                  </div>
                  <Badge 
                    variant={transfer.status === 'completed' ? 'outline' : 'secondary'} 
                    className={transfer.status === 'failed' ? 'text-destructive border-destructive' : ''}
                  >
                    {transfer.status === 'in-progress' ? 'Transferring' : 
                     transfer.status === 'completed' ? 'Completed' : 'Failed'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Progress value={transfer.progress} className="flex-1 h-1.5" />
                  <span>{Math.round(transfer.progress)}%</span>
                </div>
                {transfer.status === 'failed' && transfer.error && (
                  <p className="mt-1 text-xs text-destructive">{transfer.error}</p>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Hidden file input */}
      {renderFileInput()}
    </div>
  );
};