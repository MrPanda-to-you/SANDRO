/**
 * IntegrityVerifier - Runtime code integrity verification system
 * Part of Phase 2: Advanced Code Obfuscation
 * 
 * This class implements runtime integrity checks to detect code tampering
 * and provides mechanisms for hash generation and verification.
 */

import CryptoJS from 'crypto-js';

export interface IntegrityCheck {
  hash: string;
  timestamp: number;
  verified: boolean;
  failureCount: number;
}

export interface IntegrityConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  maxFailures: number;
  onTamperDetected: (event: TamperEvent) => void;
  hashAlgorithm: 'SHA256' | 'SHA512' | 'MD5';
  checksumSalt: string;
}

export interface TamperEvent {
  type: 'integrity_failure' | 'checksum_mismatch' | 'code_modification';
  timestamp: number;
  expectedHash: string;
  actualHash: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class IntegrityVerifier {
  private config: IntegrityConfig;
  private checks: Map<string, IntegrityCheck> = new Map();
  private intervalId: number | null = null;
  private isVerifying: boolean = false;
  private buildTimeHashes: Map<string, string> = new Map();
  
  // Build-time generated hashes for file integrity verification
  private readonly expectedHashes: Map<string, string> = new Map([
    ['D7rJCoYj.js', '3aac58d521adc259426ce132c72dc9e758e32f70e062118dcb5d17b695fbd8b0'],
    ['NYVV4Oc8.css', '2b3eb957804110931e020a7f0c44eeb30aaf35198da5d69426ae540d1af8933d']
  ]);

  // Build metadata for verification
  private readonly buildMetadata = {
        "files": {
            "D7rJCoYj.js": {
                "hash": "3aac58d521adc259426ce132c72dc9e758e32f70e062118dcb5d17b695fbd8b0",
                "size": 16903,
                "type": "javascript"
            },
            "NYVV4Oc8.css": {
                "hash": "2b3eb957804110931e020a7f0c44eeb30aaf35198da5d69426ae540d1af8933d",
                "size": 1744,
                "type": "css"
            }
        },
        "buildTimestamp": "2025-08-02T03:18:29.545Z",
        "totalFiles": 2,
        "phase": "Phase2-Advanced"
    };

  constructor(config: Partial<IntegrityConfig> = {}) {
    this.config = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      maxFailures: 3,
      onTamperDetected: this.defaultTamperHandler.bind(this),
      hashAlgorithm: 'SHA256',
      checksumSalt: this.generateSalt(),
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize the integrity verification system
   */
  private initialize(): void {
    try {
      this.loadBuildTimeHashes();
      this.startPeriodicVerification();
      
      // Initial verification
      this.performIntegrityCheck();
      
      console.log('🔒 IntegrityVerifier initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize IntegrityVerifier:', error);
    }
  }

  /**
   * Load build-time generated hashes for verification
   */
  private loadBuildTimeHashes(): void {
    // In a real implementation, these would be loaded from a secure source
    // For now, we'll generate them dynamically
    const codeElements = this.getCodeElements();
    
    codeElements.forEach(element => {
      const hash = this.generateHash(element.content, element.id);
      this.buildTimeHashes.set(element.id, hash);
    });
  }

  /**
   * Get code elements that should be verified
   */
  private getCodeElements(): Array<{id: string, content: string}> {
    const elements: Array<{id: string, content: string}> = [];
    
    // Get script tags
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script, index) => {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('node_modules') && !src.includes('cdn')) {
        elements.push({
          id: `script_${index}_${src.split('/').pop()}`,
          content: src
        });
      }
    });

    // Get inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    inlineScripts.forEach((script, index) => {
      const content = script.textContent || '';
      if (content.trim().length > 0) {
        elements.push({
          id: `inline_script_${index}`,
          content: content
        });
      }
    });

    return elements;
  }

  /**
   * Generate hash for content
   */
  private generateHash(content: string, identifier: string): string {
    const saltedContent = content + this.config.checksumSalt + identifier;
    
    switch (this.config.hashAlgorithm) {
      case 'SHA256':
        return CryptoJS.SHA256(saltedContent).toString();
      case 'SHA512':
        return CryptoJS.SHA512(saltedContent).toString();
      case 'MD5':
        return CryptoJS.MD5(saltedContent).toString();
      default:
        return CryptoJS.SHA256(saltedContent).toString();
    }
  }

  /**
   * Generate random salt for checksums
   */
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  /**
   * Start periodic integrity verification
   */
  private startPeriodicVerification(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      if (!this.isVerifying) {
        this.performIntegrityCheck();
      }
    }, this.config.checkInterval);
  }

  /**
   * Perform integrity check on all monitored code elements
   */
  public async performIntegrityCheck(): Promise<boolean> {
    if (this.isVerifying) {
      return true; // Already verifying
    }

    this.isVerifying = true;
    const startTime = performance.now();
    
    try {
      const codeElements = this.getCodeElements();
      let allValid = true;

      for (const element of codeElements) {
        const isValid = await this.verifyElement(element);
        if (!isValid) {
          allValid = false;
        }
      }

      const duration = performance.now() - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`🔍 Integrity check completed in ${duration.toFixed(2)}ms`);
      }

      return allValid;
    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      return false;
    } finally {
      this.isVerifying = false;
    }
  }

  /**
   * Verify individual code element
   */
  private async verifyElement(element: {id: string, content: string}): Promise<boolean> {
    const currentHash = this.generateHash(element.content, element.id);
    const expectedHash = this.buildTimeHashes.get(element.id);
    
    if (!expectedHash) {
      // New element detected
      this.buildTimeHashes.set(element.id, currentHash);
      return true;
    }

    const isValid = currentHash === expectedHash;
    
    // Update check record
    const existingCheck = this.checks.get(element.id);
    const check: IntegrityCheck = {
      hash: currentHash,
      timestamp: Date.now(),
      verified: isValid,
      failureCount: isValid ? 0 : (existingCheck?.failureCount || 0) + 1
    };

    this.checks.set(element.id, check);

    if (!isValid) {
      await this.handleIntegrityFailure(element.id, expectedHash, currentHash);
    }

    return isValid;
  }

  /**
   * Handle integrity verification failure
   */
  private async handleIntegrityFailure(
    elementId: string, 
    expectedHash: string, 
    actualHash: string
  ): Promise<void> {
    const check = this.checks.get(elementId);
    const failureCount = check?.failureCount || 1;

    const tamperEvent: TamperEvent = {
      type: 'integrity_failure',
      timestamp: Date.now(),
      expectedHash,
      actualHash,
      location: elementId,
      severity: failureCount >= this.config.maxFailures ? 'critical' : 'medium'
    };

    // Call the configured tamper detection handler
    this.config.onTamperDetected(tamperEvent);

    if (failureCount >= this.config.maxFailures) {
      await this.handleCriticalTamperDetection(tamperEvent);
    }
  }

  /**
   * Handle critical tamper detection
   */
  private async handleCriticalTamperDetection(event: TamperEvent): Promise<void> {
    console.error('🚨 CRITICAL: Code tampering detected!', event);
    
    // In production, you might want to:
    // 1. Disable application functionality
    // 2. Redirect to error page
    // 3. Send alert to monitoring system
    // 4. Clear sensitive data
    
    if (import.meta.env.PROD) {
      // Example production response
      document.body.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: #f5f5f5; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-family: Arial, sans-serif;
          z-index: 10000;
        ">
          <div style="text-align: center; max-width: 400px; padding: 20px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">Security Notice</h2>
            <p style="color: #333; line-height: 1.6;">
              For your security, this application has been temporarily disabled. 
              Please refresh the page to continue.
            </p>
            <button onclick="location.reload()" style="
              background: #3498db; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 4px; 
              cursor: pointer; 
              margin-top: 20px;
            ">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Default tamper detection handler
   */
  private defaultTamperHandler(event: TamperEvent): void {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Tamper detected:', event);
    }
    
    // Log security event (would integrate with SecurityEventLogger in Phase 4)
    const securityEvent = {
      type: 'security_violation',
      subtype: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      details: {
        location: event.location,
        expectedHash: event.expectedHash.substring(0, 8) + '...', // Truncate for logs
        actualHash: event.actualHash.substring(0, 8) + '...'
      }
    };

    // Store in session for potential reporting
    try {
      const existingEvents = JSON.parse(sessionStorage.getItem('security_events') || '[]');
      existingEvents.push(securityEvent);
      sessionStorage.setItem('security_events', JSON.stringify(existingEvents.slice(-10))); // Keep last 10
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get current integrity status
   */
  public getIntegrityStatus(): {
    overallStatus: 'secure' | 'warning' | 'compromised';
    totalChecks: number;
    failedChecks: number;
    lastVerification: number;
  } {
    const checks = Array.from(this.checks.values());
    const failedChecks = checks.filter(check => !check.verified);
    const lastVerification = Math.max(...checks.map(check => check.timestamp), 0);

    let overallStatus: 'secure' | 'warning' | 'compromised' = 'secure';
    
    if (failedChecks.length > 0) {
      const criticalFailures = failedChecks.filter(check => 
        check.failureCount >= this.config.maxFailures
      );
      
      overallStatus = criticalFailures.length > 0 ? 'compromised' : 'warning';
    }

    return {
      overallStatus,
      totalChecks: checks.length,
      failedChecks: failedChecks.length,
      lastVerification
    };
  }

  /**
   * Manually trigger integrity verification
   */
  public async verify(): Promise<boolean> {
    return await this.performIntegrityCheck();
  }

  /**
   * Stop integrity verification
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isVerifying = false;
  }

  /**
   * Restart integrity verification
   */
  public restart(): void {
    this.stop();
    if (this.config.enabled) {
      this.startPeriodicVerification();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<IntegrityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.intervalId) {
      this.startPeriodicVerification();
    } else if (!this.config.enabled && this.intervalId) {
      this.stop();
    }
  }

  /**
   * Get verification statistics
   */
  public getStatistics(): {
    averageVerificationTime: number;
    successRate: number;
    totalVerifications: number;
    systemUptime: number;
  } {
    const checks = Array.from(this.checks.values());
    const successfulChecks = checks.filter(check => check.verified);
    
    return {
      averageVerificationTime: 0, // Would need to track timing
      successRate: checks.length > 0 ? (successfulChecks.length / checks.length) * 100 : 100,
      totalVerifications: checks.length,
      systemUptime: this.intervalId ? Date.now() - (checks[0]?.timestamp || Date.now()) : 0
    };
  }
}

// Export singleton instance for global use
export const integrityVerifier = new IntegrityVerifier({
  enabled: true,
  checkInterval: import.meta.env.PROD ? 30000 : 60000, // More frequent in production
  maxFailures: import.meta.env.PROD ? 2 : 5, // Stricter in production
  hashAlgorithm: 'SHA256'
});

// Auto-start verification if in production
if (import.meta.env.PROD && true) {
  // Small delay to ensure page is loaded
  setTimeout(() => {
    integrityVerifier.verify();
  }, 2000);
}
