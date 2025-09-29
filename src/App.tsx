/**
 * Main Application Component
 * Integrates military-grade encryption for SSH Manager
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MasterPasswordSetup } from "@/components/MasterPasswordSetup";
import { useMasterPassword } from "@/hooks/useSecureStorage";
import { setupSecurityHeaders } from "@/lib/securityUtils";

const queryClient = new QueryClient();

const AppContent = () => {
  const { hasMasterPassword, isInitialized } = useMasterPassword();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Initialize security headers first
    setupSecurityHeaders();
    
    // Check if encryption should be enabled by default
    const shouldShowSetup = !hasMasterPassword && isInitialized;
    setShowSetup(shouldShowSetup);
  }, [hasMasterPassword, isInitialized]);

  if (showSetup) {
    return (
      <MasterPasswordSetup
        onComplete={() => setShowSetup(false)}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
