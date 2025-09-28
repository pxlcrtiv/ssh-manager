import { useState, useEffect, useCallback } from 'react';
import { useSSHHosts } from '@/hooks/useSSHHosts';
import { toast } from '@/hooks/use-toast';

export interface BackupSettings {
  frequency: 'never' | 'daily' | 'weekly' | 'monthly';
  autoDownload: boolean;
  lastBackup?: Date;
}

export const useBackupManager = () => {
  const { exportToSQLite, hosts } = useSSHHosts();
  const [settings, setSettings] = useState<BackupSettings>({
    frequency: 'weekly',
    autoDownload: false,
  });
  const [backupReady, setBackupReady] = useState(false);
  const [lastBackupBlob, setLastBackupBlob] = useState<Blob | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('backup-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.lastBackup) {
          parsed.lastBackup = new Date(parsed.lastBackup);
        }
        setSettings(parsed);
      } catch (error) {
        console.error('Error loading backup settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('backup-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<BackupSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const createBackup = useCallback(async () => {
    if (hosts.length === 0) return null;

    try {
      const blob = await exportToSQLite();
      setLastBackupBlob(blob);
      setBackupReady(true);
      setSettings(prev => ({ ...prev, lastBackup: new Date() }));
      return blob;
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: "Backup Failed",
        description: "Could not create automatic backup",
        variant: "destructive",
      });
      return null;
    }
  }, [exportToSQLite, hosts.length]);

  const downloadBackup = useCallback(() => {
    if (!lastBackupBlob) return;

    const url = URL.createObjectURL(lastBackupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupReady(false);
    setLastBackupBlob(null);
  }, [lastBackupBlob]);

  const dismissBackup = useCallback(() => {
    setBackupReady(false);
    setLastBackupBlob(null);
  }, []);

  // Check if backup is needed based on frequency
  const shouldCreateBackup = useCallback(() => {
    if (settings.frequency === 'never' || !settings.lastBackup) return true;
    
    const now = new Date();
    const lastBackup = settings.lastBackup;
    const diffMs = now.getTime() - lastBackup.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (settings.frequency) {
      case 'daily':
        return diffDays >= 1;
      case 'weekly':
        return diffDays >= 7;
      case 'monthly':
        return diffDays >= 30;
      default:
        return false;
    }
  }, [settings.frequency, settings.lastBackup]);

  // Auto-create backups
  useEffect(() => {
    if (settings.frequency === 'never' || hosts.length === 0) return;

    const checkAndCreateBackup = async () => {
      if (shouldCreateBackup()) {
        await createBackup();
      }
    };

    // Check immediately
    checkAndCreateBackup();

    // Set up interval to check periodically (every hour)
    const interval = setInterval(checkAndCreateBackup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.frequency, hosts.length, shouldCreateBackup, createBackup]);

  return {
    settings,
    updateSettings,
    backupReady,
    createBackup,
    downloadBackup,
    dismissBackup,
  };
};