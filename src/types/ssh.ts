export interface SSHHost {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  publicKey?: string;
  fingerprint?: string;
  lastConnected?: Date;
  tags: string[];
  description?: string;
}

export interface SSHConnection {
  id: string;
  hostId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  connectedAt?: Date;
  lastActivity?: Date;
}

export interface SFTPFile {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory' | 'symlink';
  permissions: string;
  owner: string;
  group: string;
  modified: Date;
}

export interface DatabaseExport {
  version: string;
  exportedAt: Date;
  hosts: SSHHost[];
  settings: {
    theme: string;
    defaultPort: number;
    keepAliveInterval: number;
  };
}