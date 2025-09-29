/**
 * Security utilities for the Quantum SSH Manager
 * Provides implementations for critical security features
 */

/**
 * Sets up security headers for web applications
 * Implements modern XSS protection and content security policies
 */
export function setupSecurityHeaders(): void {
  // These headers would typically be set on the server
  // For a client-side application, we can implement equivalent protections
  
  // Content Security Policy (CSP)
  // This helps prevent XSS attacks by restricting sources of content
  const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';";
  
  // HTTP Strict Transport Security (HSTS)
  // Enforces HTTPS connections
  const hstsHeader = "max-age=31536000; includeSubDomains; preload";
  
  // X-Content-Type-Options
  // Prevents MIME type sniffing
  const contentTypeOptions = "nosniff";
  
  // X-Frame-Options
  // Prevents clickjacking attacks
  const frameOptions = "DENY";
  
  // X-XSS-Protection
  // Enables browser XSS filters
  const xssProtection = "1; mode=block";
  
  // X-Permitted-Cross-Domain-Policies
  // Controls cross-domain policy access
  const crossDomainPolicies = "none";
  
  // Referrer-Policy
  // Controls referrer information sent with requests
  const referrerPolicy = "same-origin";
  
  // Set headers if running in a browser environment
  if (typeof window !== 'undefined' && window.document) {
    // Add meta tags for security headers when they can't be set by the server
    const head = window.document.head;
    
    // Function to add or update meta tags
    const setMetaTag = (httpEquiv: string, content: string) => {
      let metaTag = document.querySelector(`meta[http-equiv="${httpEquiv}"]`) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('http-equiv', httpEquiv);
        head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };
    
    // Set security-related meta tags
    setMetaTag('Content-Security-Policy', cspHeader);
    setMetaTag('X-Content-Type-Options', contentTypeOptions);
    setMetaTag('X-Frame-Options', frameOptions);
    setMetaTag('X-XSS-Protection', xssProtection);
    setMetaTag('Referrer-Policy', referrerPolicy);
  }
  
  // Log security headers setup for debugging
  console.log('Security headers have been configured');
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Create a temporary element to leverage browser's native HTML escaping
  const tempElement = document.createElement('div');
  tempElement.textContent = input;
  
  // Get the escaped HTML content
  const sanitized = tempElement.innerHTML;
  
  return sanitized;
}

/**
 * Validates and sanitizes URLs to prevent XSS and other injection attacks
 * @param url The URL to validate and sanitize
 * @returns The validated and sanitized URL, or null if invalid
 */
export function validateAndSanitizeUrl(url: string): string | null {
  try {
    // Parse the URL to validate it
    const parsedUrl = new URL(url);
    
    // Only allow specific protocols for security
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return null;
    }
    
    // Return the sanitized URL string
    return parsedUrl.toString();
  } catch (e) {
    // If URL parsing fails, return null
    return null;
  }
}

/**
 * Checks if the application is running in a secure context
 * @returns Boolean indicating if the context is secure
 */
export function isSecureContext(): boolean {
  if (typeof window !== 'undefined') {
    return window.isSecureContext || false;
  }
  return false;
}

/**
 * Validates if a string is a valid SSH key format
 * @param key The SSH key string to validate
 * @returns Boolean indicating if the key format is valid
 */
export function isValidSshKeyFormat(key: string): boolean {
  // Basic format validation for common SSH key types
  const sshKeyRegex = /^(ssh-rsa AAAAB3NzaC1yc2E|ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTY|ecdsa-sha2-nistp384 AAAAE2VjZHNhLXNoYTItbmlzdHAzODQ|ecdsa-sha2-nistp521 AAAAE2VjZHNhLXNoYTItbmlzdHA1MjE|ssh-ed25519 AAAAC3NzaC1lZDI1NTE5)[A-Za-z0-9+/]+[=]{0,3}( .*)?$/;
  
  return sshKeyRegex.test(key);
}