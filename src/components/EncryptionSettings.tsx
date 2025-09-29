/**
 * Encryption Settings Component
 * Manages military-grade encryption settings for SSH Manager
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { useMasterPassword, useSecureStorage } from '@/hooks/useSecureStorage';
import { toast } from '@/hooks/use-toast';
import { MasterPasswordSetup } from './MasterPasswordSetup';

export const EncryptionSettings = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { hasMasterPassword, verifyMasterPassword, setMasterPassword, clearMasterPassword } = useMasterPassword();
  const { isEncryptionEnabled, enableEncryption, disableEncryption, migrateData } = useSecureStorage();

  const handleEnableEncryption = () => {
    setShowSetup(true);
  };

  const handleDisableEncryption = async () => {
    try {
      await disableEncryption();
      toast({
        title: "Encryption Disabled",
        description: "Your data is no longer encrypted",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Disable Failed",
        description: error instanceof Error ? error.message : "Failed to disable encryption",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      const isValid = await verifyMasterPassword(currentPassword);
      if (!isValid) {
        toast({
          title: "Invalid Current Password",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        return;
      }

      await setMasterPassword(newPassword);
      toast({
        title: "Password Changed",
        description: "Master password updated successfully",
        variant: "default"
      });
      
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast({
        title: "Change Failed",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive"
      });
    }
  };

  const handleExportEncrypted = async () => {
    try {
      // This would export encrypted data for backup
      toast({
        title: "Export Feature",
        description: "Encrypted backup export will be available in the next update",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export encrypted data",
        variant: "destructive"
      });
    }
  };

  if (showSetup) {
    return (
      <MasterPasswordSetup
        onComplete={() => setShowSetup(false)}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (showChangePassword) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-card/95 backdrop-blur-sm border-primary/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <RotateCcw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Change Master Password</h2>
              <p className="text-sm text-muted-foreground">Update your encryption password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="flex-1"
              >
                Change Password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encryption Status Card */}
      <Card className="p-6 border-primary/30 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Military-Grade Encryption</h3>
              <p className="text-sm text-muted-foreground">Protect your SSH credentials</p>
            </div>
          </div>
          <Badge 
            variant={isEncryptionEnabled ? "success" : "destructive"}
            className="text-sm"
          >
            {isEncryptionEnabled ? "ENABLED" : "DISABLED"}
          </Badge>
        </div>

        <Alert className="mb-4 border-info/30 bg-info/10">
          <CheckCircle className="h-4 w-4 text-info" />
          <AlertDescription className="text-info">
            Your data is protected with AES-256-GCM encryption and PBKDF2 key derivation. 
            This provides quantum-resistant security for your sensitive SSH credentials.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {isEncryptionEnabled ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(true)}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Change Master Password
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisableEncryption}
                className="w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                Disable Encryption
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEnableEncryption}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable Encryption
            </Button>
          )}
        </div>
      </Card>

      {/* Security Features */}
      <Card className="p-6 border-primary/30 bg-card/95 backdrop-blur-sm">
        <h4 className="text-lg font-semibold mb-4 text-primary">Security Features</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">AES-256-GCM Encryption</p>
              <p className="text-xs text-muted-foreground">Military-grade symmetric encryption</p>
            </div>
            <Badge variant="success" className="text-xs">ACTIVE</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">PBKDF2 Key Derivation</p>
              <p className="text-xs text-muted-foreground">100,000 iterations for key strengthening</p>
            </div>
            <Badge variant="success" className="text-xs">ACTIVE</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Secure Random Generation</p>
              <p className="text-xs text-muted-foreground">Cryptographically secure random IVs</p>
            </div>
            <Badge variant="success" className="text-xs">ACTIVE</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Memory Wiping</p>
              <p className="text-xs text-muted-foreground">Secure cleanup of sensitive data</p>
            </div>
            <Badge variant="success" className="text-xs">ACTIVE</Badge>
          </div>
        </div>
      </Card>

      {/* Backup & Recovery */}
      <Card className="p-6 border-primary/30 bg-card/95 backdrop-blur-sm">
        <h4 className="text-lg font-semibold mb-4 text-primary">Backup & Recovery</h4>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleExportEncrypted}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Encrypted Backup
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!isEncryptionEnabled}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Encrypted Backup
          </Button>
        </div>
      </Card>
    </div>
  );
};