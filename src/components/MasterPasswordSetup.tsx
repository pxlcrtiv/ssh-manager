/**
 * Master Password Setup Component
 * Provides military-grade encryption setup for SSH Manager
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Key, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { generateMasterPassword, validatePasswordStrength, trackPasswordAttempt } from '@/lib/crypto';
import { useMasterPassword } from '@/hooks/useSecureStorage';
import { toast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/lib/securityUtils';

interface MasterPasswordSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MasterPasswordSetup = ({ onComplete, onCancel }: MasterPasswordSetupProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { setMasterPassword } = useMasterPassword();

  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = passwordStrength.isValid && passwordsMatch;

  const handleGeneratePassword = () => {
    setGenerating(true);
    const newPassword = generateMasterPassword(32);
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setGenerating(false);
    toast({
      title: "Password Generated",
      description: "A secure military-grade password has been generated"
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      // Sanitize inputs
      const sanitizedPassword = sanitizeInput(password);
      
      await setMasterPassword(sanitizedPassword);
      
      // Record successful password setup
      trackPasswordAttempt(true);
      
      toast({
        title: "Encryption Activated",
        description: "Your data is now protected with military-grade encryption",
        variant: "default"
      });
      onComplete?.();
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to set master password",
        variant: "destructive"
      });
    }
  };

  const getRequirementIcon = (met: boolean) => {
    return met ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-card/95 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Military-Grade Encryption</h2>
            <p className="text-sm text-muted-foreground">Secure your SSH credentials</p>
          </div>
        </div>

        <Alert className="mb-6 border-warning/30 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            This will encrypt all your SSH hosts, passwords, and private keys with quantum-resistant encryption. 
            You must remember this password - it cannot be recovered if lost.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="master-password" className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Master Password
            </Label>
            <div className="relative">
              <Input
                id="master-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter military-grade password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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

          {/* Password Strength Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Password Strength</span>
              <Badge 
                variant={passwordStrength.isValid ? "success" : "destructive"}
                className="text-xs"
              >
                {passwordStrength.score}/7
              </Badge>
            </div>
            <div className="space-y-1">
              {passwordStrength.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {getRequirementIcon(false)}
                  <span className="text-muted-foreground">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-2">
              {getRequirementIcon(passwordsMatch)}
              <span className="text-xs text-muted-foreground">
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleGeneratePassword}
              disabled={generating}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              Generate Secure
            </Button>
            <Button
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            Activate Encryption
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Protected by AES-256-GCM encryption with PBKDF2 key derivation
          </p>
        </div>
      </Card>
    </div>
  );
};