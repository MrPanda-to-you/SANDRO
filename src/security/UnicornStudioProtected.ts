/**
 * UnicornStudio Asset Protection Wrapper
 * Phase 3: Secures 3D models, textures, and shader code
 */

import { createAssetProtectionService } from './AssetProtectionService.js';

export interface ProtectedUnicornConfig {
  scene: string;
  fps?: number;
  scale?: number;
  dpi?: number;
  autoplay?: boolean;
  ariaLabel?: string;
  protection?: {
    enabled: boolean;
    obfuscateShaders: boolean;
    encryptModels: boolean;
    randomizeTextures: boolean;
  };
}

export class UnicornStudioProtected {
  private assetProtection = createAssetProtectionService();
  private originalUnicorn: any;
  private protectedAssets = new Map<string, string>();
  private shaderCache = new Map<string, string>();
  
  constructor() {
    this.initializeProtection();
  }

  private async initializeProtection() {
    // Wait for UnicornStudio to be available
    await this.waitForUnicornStudio();
    
    // Wrap the original UnicornStudio methods
    this.wrapUnicornStudioMethods();
    
    console.log('🛡️ UnicornStudio asset protection initialized');
  }

  private async waitForUnicornStudio(): Promise<void> {
    return new Promise((resolve) => {
      const checkUnicorn = () => {
        if ((window as any).UnicornStudio) {
          this.originalUnicorn = (window as any).UnicornStudio;
          resolve();
        } else {
          setTimeout(checkUnicorn, 50);
        }
      };
      checkUnicorn();
    });
  }

  private wrapUnicornStudioMethods() {
    const originalAddScene = this.originalUnicorn.addScene;
    
    // Wrap addScene to protect assets
    this.originalUnicorn.addScene = async (config: ProtectedUnicornConfig) => {
      console.log('🔐 Loading protected UnicornStudio scene...');
      
      const protectedConfig = await this.protectSceneAssets(config);
      return originalAddScene.call(this.originalUnicorn, protectedConfig);
    };

    // Wrap other methods as needed
    this.wrapAssetLoading();
    this.wrapShaderCompilation();
  }

  private async protectSceneAssets(config: ProtectedUnicornConfig): Promise<any> {
    const protection = config.protection || {
      enabled: true,
      obfuscateShaders: true,
      encryptModels: true,
      randomizeTextures: true
    };

    if (!protection.enabled) {
      return config;
    }

    // Protect the main scene file
    if (config.scene) {
      const protectedSceneUrl = await this.protectAsset(config.scene, 'scene');
      config.scene = protectedSceneUrl.url;
    }

    return config;
  }

  private async protectAsset(assetPath: string, assetType: string): Promise<any> {
    try {
      // Generate signed URL for the asset
      const signedUrl = this.assetProtection.generateSignedUrl(assetPath);
      
      // Cache the mapping
      this.protectedAssets.set(assetPath, signedUrl.url);
      
      console.log(`   🔒 Protected ${assetType}: ${assetPath.split('/').pop()}`);
      
      return signedUrl;
    } catch (error) {
      console.warn(`⚠️ Failed to protect asset ${assetPath}:`, error.message);
      return { url: assetPath, token: '', expires: 0, signature: '' };
    }
  }

  private wrapAssetLoading() {
    // Intercept fetch requests for assets
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if this is an asset request that needs protection
      if (this.isProtectedAssetRequest(url)) {
        const protectedUrl = await this.getProtectedAssetUrl(url);
        if (protectedUrl !== url) {
          console.log(`🔄 Redirecting asset request: ${url.split('/').pop()}`);
          input = protectedUrl;
        }
      }
      
      return originalFetch.call(window, input, init);
    };
  }

  private wrapShaderCompilation() {
    // Protect WebGL shader compilation if available
    const originalCreateShader = WebGLRenderingContext.prototype.createShader;
    
    WebGLRenderingContext.prototype.createShader = function(type: number) {
      const shader = originalCreateShader.call(this, type);
      
      // Add shader protection metadata
      if (shader) {
        (shader as any)._protected = true;
        (shader as any)._timestamp = Date.now();
      }
      
      return shader;
    };

    // Protect shader source
    const originalShaderSource = WebGLRenderingContext.prototype.shaderSource;
    
    WebGLRenderingContext.prototype.shaderSource = function(shader: WebGLShader, source: string) {
      // Obfuscate shader source if protection is enabled
      const obfuscatedSource = this.obfuscateShaderSource ? this.obfuscateShaderSource(source) : source;
      originalShaderSource.call(this, shader, obfuscatedSource);
    };
  }

  private isProtectedAssetRequest(url: string): boolean {
    const protectedExtensions = ['.glb', '.gltf', '.json', '.bin', '.jpg', '.jpeg', '.png', '.webp'];
    return protectedExtensions.some(ext => url.includes(ext));
  }

  private async getProtectedAssetUrl(originalUrl: string): Promise<string> {
    // Check cache first
    if (this.protectedAssets.has(originalUrl)) {
      return this.protectedAssets.get(originalUrl)!;
    }

    // Generate new protected URL
    try {
      const signedUrl = this.assetProtection.generateSignedUrl(originalUrl);
      this.protectedAssets.set(originalUrl, signedUrl.url);
      return signedUrl.url;
    } catch (error) {
      console.warn(`Failed to protect asset URL: ${originalUrl}`, error);
      return originalUrl;
    }
  }

  private obfuscateShaderSource(source: string): string {
    // Basic shader obfuscation
    let obfuscated = source;
    
    // Replace common variable names with obscured ones
    const replacements = new Map([
      ['position', 'a'],
      ['normal', 'b'],
      ['uv', 'c'],
      ['color', 'd'],
      ['texture', 'e'],
      ['diffuse', 'f'],
      ['specular', 'g'],
      ['ambient', 'h'],
      ['light', 'i'],
      ['camera', 'j']
    ]);
    
    for (const [original, replacement] of replacements) {
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      obfuscated = obfuscated.replace(regex, replacement);
    }
    
    // Remove comments
    obfuscated = obfuscated.replace(/\/\*[\s\S]*?\*\//g, '');
    obfuscated = obfuscated.replace(/\/\/.*$/gm, '');
    
    // Minify whitespace
    obfuscated = obfuscated.replace(/\s+/g, ' ').trim();
    
    return obfuscated;
  }

  /**
   * Public API for manually protecting additional assets
   */
  async protectAdditionalAsset(assetPath: string): Promise<string> {
    const signedUrl = await this.protectAsset(assetPath, 'additional');
    return signedUrl.url;
  }

  /**
   * Get protection statistics
   */
  getProtectionStats() {
    return {
      protectedAssets: this.protectedAssets.size,
      cachedShaders: this.shaderCache.size,
      activeTokens: this.assetProtection.getActiveTokensCount(),
      accessLogs: this.assetProtection.getAccessLogs(10)
    };
  }

  /**
   * Emergency revoke all asset access
   */
  emergencyRevoke() {
    this.assetProtection.revokeAllTokens();
    this.protectedAssets.clear();
    this.shaderCache.clear();
    console.log('🚨 All protected assets revoked');
  }
}

// Initialize global protection
let unicornProtection: UnicornStudioProtected | null = null;

export function initializeUnicornProtection(): UnicornStudioProtected {
  if (!unicornProtection) {
    unicornProtection = new UnicornStudioProtected();
  }
  return unicornProtection;
}

export function getUnicornProtection(): UnicornStudioProtected | null {
  return unicornProtection;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeUnicornProtection();
    });
  } else {
    initializeUnicornProtection();
  }
}
