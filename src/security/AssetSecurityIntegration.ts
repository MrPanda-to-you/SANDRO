/**
 * Phase 3: Asset Security Integration
 * Orchestrates all asset protection components and integrates with the main application
 */

import { AssetProtectionService } from '../src/security/AssetProtectionService.js';
import { UnicornStudioProtected } from '../src/security/UnicornStudioProtected.js';

class AssetSecurityIntegration {
  constructor() {
    this.assetProtection = null;
    this.unicornWrapper = null;
    this.isInitialized = false;
    this.config = {
      enableAssetProtection: true,
      enableModelProtection: true,
      enableObfuscation: true,
      tokenExpiration: 15 * 60 * 1000, // 15 minutes
      secretKey: this.getSecretKey(),
      debug: false
    };
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('Asset security already initialized');
      return;
    }

    try {
      console.log('🔐 Initializing Phase 3: Asset Security...');

      // Initialize asset protection service
      if (this.config.enableAssetProtection) {
        this.assetProtection = new AssetProtectionService({
          secretKey: this.config.secretKey,
          tokenExpiration: this.config.tokenExpiration,
          debug: this.config.debug
        });
        
        await this.assetProtection.initialize();
        console.log('✅ Asset protection service initialized');
      }

      // Initialize UnicornStudio protection
      if (this.config.enableModelProtection) {
        this.unicornWrapper = new UnicornStudioProtected({
          assetProtection: this.assetProtection,
          debug: this.config.debug
        });
        
        this.unicornWrapper.initialize();
        console.log('✅ UnicornStudio protection initialized');
      }

      // Setup asset middleware
      this.setupAssetMiddleware();

      // Setup global error handlers
      this.setupErrorHandlers();

      this.isInitialized = true;
      console.log('🚀 Phase 3: Asset Security - Fully Integrated!');

    } catch (error) {
      console.error('❌ Asset security initialization failed:', error);
      throw error;
    }
  }

  setupAssetMiddleware() {
    // Create proxy middleware for asset protection
    const middleware = this.assetProtection?.createProxyMiddleware();
    
    if (middleware && typeof window !== 'undefined') {
      // Browser environment - intercept fetch requests
      this.interceptFetchRequests();
    } else if (middleware && typeof process !== 'undefined') {
      // Node.js environment - setup Express middleware
      this.setupExpressMiddleware(middleware);
    }
  }

  interceptFetchRequests() {
    const originalFetch = window.fetch;
    const assetProtection = this.assetProtection;

    window.fetch = async function(resource, options = {}) {
      try {
        // Check if this is an asset request
        const url = typeof resource === 'string' ? resource : resource.url;
        
        if (assetProtection.isAssetRequest(url)) {
          // Generate signed URL for asset
          const signedUrl = await assetProtection.generateSignedUrl(url);
          
          // Update the resource with signed URL
          if (typeof resource === 'string') {
            resource = signedUrl;
          } else {
            resource = new Request(signedUrl, resource);
          }
        }

        // Proceed with original fetch
        return await originalFetch.call(this, resource, options);
        
      } catch (error) {
        console.error('Asset fetch failed:', error);
        throw error;
      }
    };
  }

  setupExpressMiddleware(middleware) {
    // This would be called during server setup
    global.assetMiddleware = middleware;
  }

  setupErrorHandlers() {
    // Asset loading error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.target && (event.target.tagName === 'IMG' || 
                            event.target.tagName === 'VIDEO' ||
                            event.target.tagName === 'AUDIO')) {
          this.handleAssetLoadError(event);
        }
      }, true);

      // Unhandled promise rejections for async asset loading
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && 
            event.reason.message.includes('asset')) {
          this.handleAssetLoadError(event);
        }
      });
    }
  }

  handleAssetLoadError(event) {
    console.error('Asset loading error detected:', event);
    
    // Attempt recovery if possible
    if (this.assetProtection && event.target) {
      const assetUrl = event.target.src || event.target.href;
      if (assetUrl) {
        this.attemptAssetRecovery(assetUrl, event.target);
      }
    }
  }

  async attemptAssetRecovery(assetUrl, element) {
    try {
      console.log('Attempting asset recovery for:', assetUrl);
      
      // Generate new signed URL
      const newSignedUrl = await this.assetProtection.generateSignedUrl(assetUrl);
      
      // Update element source
      if (element.src) {
        element.src = newSignedUrl;
      } else if (element.href) {
        element.href = newSignedUrl;
      }
      
      console.log('Asset recovery successful');
      
    } catch (error) {
      console.error('Asset recovery failed:', error);
    }
  }

  // Public API methods

  async protectAsset(assetPath) {
    if (!this.assetProtection) {
      throw new Error('Asset protection not initialized');
    }
    
    return await this.assetProtection.generateSignedUrl(assetPath);
  }

  async loadProtectedModel(modelPath, options = {}) {
    if (!this.unicornWrapper) {
      throw new Error('UnicornStudio protection not initialized');
    }
    
    return await this.unicornWrapper.loadProtectedModel(modelPath, options);
  }

  async validateAssetAccess(token) {
    if (!this.assetProtection) {
      throw new Error('Asset protection not initialized');
    }
    
    return await this.assetProtection.validateSignedUrl(token);
  }

  getAssetManifest() {
    if (!this.assetProtection) {
      return null;
    }
    
    return this.assetProtection.getAssetManifest();
  }

  getProtectionStats() {
    const stats = {
      initialized: this.isInitialized,
      protectedAssets: 0,
      activeTokens: 0,
      accessAttempts: 0,
      successfulAccesses: 0
    };

    if (this.assetProtection) {
      const assetStats = this.assetProtection.getStats();
      stats.protectedAssets = assetStats.protectedAssets || 0;
      stats.activeTokens = assetStats.activeTokens || 0;
      stats.accessAttempts = assetStats.accessAttempts || 0;
      stats.successfulAccesses = assetStats.successfulAccesses || 0;
    }

    return stats;
  }

  // Configuration methods

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.assetProtection) {
      this.assetProtection.updateConfig(newConfig);
    }
    
    if (this.unicornWrapper) {
      this.unicornWrapper.updateConfig(newConfig);
    }
  }

  enableDebugMode(enabled = true) {
    this.config.debug = enabled;
    this.updateConfig({ debug: enabled });
  }

  // Emergency methods

  async emergencyRevokeAllTokens() {
    if (!this.assetProtection) {
      throw new Error('Asset protection not initialized');
    }
    
    console.warn('🚨 Emergency: Revoking all asset tokens');
    return await this.assetProtection.emergencyRevoke();
  }

  async emergencyDisableProtection() {
    console.warn('🚨 Emergency: Disabling asset protection');
    
    this.config.enableAssetProtection = false;
    this.config.enableModelProtection = false;
    
    // Restore original fetch if modified
    if (typeof window !== 'undefined' && window.fetch._original) {
      window.fetch = window.fetch._original;
    }
    
    return true;
  }

  // Utility methods

  getSecretKey() {
    // In production, this should come from environment variables
    return (typeof process !== 'undefined' && process.env.ASSET_SECRET_KEY) ||
           (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ASSET_SECRET_KEY) ||
           'default-secret-key-change-in-production';
  }

  isAssetProtected(assetPath) {
    return this.assetProtection?.isAssetRequest(assetPath) || false;
  }

  getAssetInfo(assetPath) {
    if (!this.assetProtection) {
      return null;
    }
    
    return this.assetProtection.getAssetInfo(assetPath);
  }

  // Cleanup

  async destroy() {
    console.log('🧹 Cleaning up asset security...');
    
    if (this.assetProtection) {
      await this.assetProtection.cleanup();
      this.assetProtection = null;
    }
    
    if (this.unicornWrapper) {
      this.unicornWrapper.cleanup();
      this.unicornWrapper = null;
    }
    
    // Restore original fetch
    if (typeof window !== 'undefined' && window.fetch._original) {
      window.fetch = window.fetch._original;
    }
    
    this.isInitialized = false;
    console.log('✅ Asset security cleanup complete');
  }
}

// Global instance
let assetSecurity = null;

// Factory function
export function createAssetSecurity(config = {}) {
  if (assetSecurity) {
    console.warn('Asset security already exists, returning existing instance');
    return assetSecurity;
  }
  
  assetSecurity = new AssetSecurityIntegration();
  if (Object.keys(config).length > 0) {
    assetSecurity.updateConfig(config);
  }
  
  return assetSecurity;
}

// Singleton access
export function getAssetSecurity() {
  if (!assetSecurity) {
    assetSecurity = new AssetSecurityIntegration();
  }
  return assetSecurity;
}

// Auto-initialization (if in browser and not disabled)
if (typeof window !== 'undefined' && !window.DISABLE_AUTO_ASSET_SECURITY) {
  const autoInit = async () => {
    try {
      const security = getAssetSecurity();
      await security.initialize();
    } catch (error) {
      console.error('Auto-initialization of asset security failed:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export { AssetSecurityIntegration };
export default AssetSecurityIntegration;
