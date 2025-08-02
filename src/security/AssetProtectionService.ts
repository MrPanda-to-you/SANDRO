/**
 * Asset Protection Service
 * Phase 3: Implements time-limited signed URLs and asset obfuscation
 */

import crypto from 'crypto-js';

export interface AssetProtectionConfig {
  enabled: boolean;
  urlExpiration: number; // minutes
  maxFileSize: number; // bytes
  allowedExtensions: string[];
  signatureKey: string;
  proxyEndpoint: string;
}

export interface SignedAssetUrl {
  url: string;
  token: string;
  expires: number;
  signature: string;
}

export interface AssetAccessLog {
  token: string;
  timestamp: number;
  userAgent: string;
  ip?: string;
  success: boolean;
  reason?: string;
}

export class AssetProtectionService {
  private config: AssetProtectionConfig;
  private accessLogs: AssetAccessLog[] = [];
  private tokenCache: Map<string, { originalPath: string; expires: number }> = new Map();

  constructor(config: Partial<AssetProtectionConfig> = {}) {
    this.config = {
      enabled: true,
      urlExpiration: 15, // 15 minutes default
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.glb', '.gltf', '.json', '.bin'],
      signatureKey: this.generateSecretKey(),
      proxyEndpoint: '/secure-assets',
      ...config
    };

    if (this.config.enabled) {
      this.startCleanupInterval();
    }
  }

  /**
   * Generate a signed URL for an asset
   */
  generateSignedUrl(assetPath: string): SignedAssetUrl {
    if (!this.config.enabled) {
      return {
        url: assetPath,
        token: '',
        expires: 0,
        signature: ''
      };
    }

    // Validate asset extension
    const extension = this.getFileExtension(assetPath);
    if (!this.config.allowedExtensions.includes(extension)) {
      throw new Error(`Asset type not allowed: ${extension}`);
    }

    // Generate secure token
    const token = this.generateSecureToken();
    const expires = Date.now() + (this.config.urlExpiration * 60 * 1000);
    
    // Create signature
    const signature = this.generateSignature(token, expires, assetPath);
    
    // Store token mapping
    this.tokenCache.set(token, {
      originalPath: assetPath,
      expires
    });

    // Generate protected URL
    const url = `${this.config.proxyEndpoint}/${token}?exp=${expires}&sig=${signature}`;

    console.log(`🔐 Generated signed URL for ${assetPath}: ${token.substring(0, 8)}... (expires in ${this.config.urlExpiration}m)`);

    return {
      url,
      token,
      expires,
      signature
    };
  }

  /**
   * Validate a signed URL and return the original asset path
   */
  validateSignedUrl(token: string, providedSignature: string, expires: number): string | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check if token exists
    const tokenData = this.tokenCache.get(token);
    if (!tokenData) {
      this.logAccess(token, false, 'Token not found');
      return null;
    }

    // Check expiration
    if (Date.now() > expires || Date.now() > tokenData.expires) {
      this.tokenCache.delete(token);
      this.logAccess(token, false, 'Token expired');
      return null;
    }

    // Validate signature
    const expectedSignature = this.generateSignature(token, expires, tokenData.originalPath);
    if (providedSignature !== expectedSignature) {
      this.logAccess(token, false, 'Invalid signature');
      return null;
    }

    this.logAccess(token, true);
    return tokenData.originalPath;
  }

  /**
   * Generate obfuscated asset mapping for build process
   */
  generateAssetMapping(assetPaths: string[]): Map<string, string> {
    const mapping = new Map<string, string>();

    assetPaths.forEach(originalPath => {
      const extension = this.getFileExtension(originalPath);
      const obfuscatedName = this.generateObfuscatedName(extension);
      mapping.set(originalPath, obfuscatedName);
    });

    console.log(`🗂️  Generated obfuscated mapping for ${assetPaths.length} assets`);
    return mapping;
  }

  /**
   * Create asset proxy middleware for serving protected assets
   */
  createProxyMiddleware() {
    return (req: any, res: any, next: any) => {
      const { token } = req.params;
      const { exp, sig } = req.query;

      if (!token || !exp || !sig) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const originalPath = this.validateSignedUrl(token, sig, parseInt(exp));
      if (!originalPath) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Set security headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Serve the actual asset
      req.url = originalPath;
      next();
    };
  }

  /**
   * Get access logs for monitoring
   */
  getAccessLogs(limit: number = 100): AssetAccessLog[] {
    return this.accessLogs.slice(-limit);
  }

  /**
   * Get active tokens count
   */
  getActiveTokensCount(): number {
    return this.tokenCache.size;
  }

  /**
   * Force expire all tokens (emergency revocation)
   */
  revokeAllTokens(): void {
    this.tokenCache.clear();
    console.log('🚨 All asset tokens revoked');
  }

  // Private methods

  private generateSecureToken(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.lib.WordArray.random(16).toString();
    return `${timestamp}${random}`.substring(0, 32);
  }

  private generateSignature(token: string, expires: number, assetPath: string): string {
    const data = `${token}:${expires}:${assetPath}`;
    return crypto.HmacSHA256(data, this.config.signatureKey).toString();
  }

  private generateObfuscatedName(extension: string): string {
    const hash = crypto.lib.WordArray.random(8).toString();
    return `${hash}${extension}`;
  }

  private generateSecretKey(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  private getFileExtension(filePath: string): string {
    return filePath.substring(filePath.lastIndexOf('.'));
  }

  private logAccess(token: string, success: boolean, reason?: string): void {
    const log: AssetAccessLog = {
      token: token.substring(0, 8) + '...', // Truncate for privacy
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      success,
      reason
    };

    this.accessLogs.push(log);

    // Limit log size
    if (this.accessLogs.length > 1000) {
      this.accessLogs.shift();
    }

    if (!success) {
      console.warn(`🚫 Asset access denied: ${reason} (token: ${log.token})`);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired tokens every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [token, data] of this.tokenCache.entries()) {
        if (now > data.expires) {
          this.tokenCache.delete(token);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired asset tokens`);
      }
    }, 5 * 60 * 1000);
  }
}

// Default configuration for different environments
export const assetProtectionConfig = {
  development: {
    enabled: false,
    urlExpiration: 60, // 1 hour for development
  },
  staging: {
    enabled: true,
    urlExpiration: 30, // 30 minutes for staging
  },
  production: {
    enabled: true,
    urlExpiration: 15, // 15 minutes for production
    maxFileSize: 20 * 1024 * 1024, // 20MB for production
  }
};

// Environment-specific factory
export function createAssetProtectionService(): AssetProtectionService {
  const env = (import.meta as any).env?.MODE || process.env.NODE_ENV || 'development';
  const config = assetProtectionConfig[env as keyof typeof assetProtectionConfig] || assetProtectionConfig.development;
  
  return new AssetProtectionService(config);
}
