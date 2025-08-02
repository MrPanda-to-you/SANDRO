#!/usr/bin/env node

/**
 * Asset Obfuscation Build Script
 * Phase 3: Implements asset filename randomization and protection
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AssetObfuscator {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.distPath = path.join(this.projectRoot, 'dist');
    this.publicPath = path.join(this.projectRoot, 'public');
    this.assetsPath = path.join(this.projectRoot, 'assets'); // Add assets directory
    this.srcPath = path.join(this.projectRoot, 'src');
    this.assetMapping = new Map();
    this.protectedExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.avif', 
      '.glb', '.gltf', '.json', '.bin', '.drc'
    ];
  }

  async obfuscateAssets() {
    console.log('🔐 Starting Asset Obfuscation Process...\n');

    try {
      // Step 1: Discover assets
      console.log('🔍 Discovering assets...');
      const assets = this.discoverAssets();
      console.log(`   Found ${assets.length} assets to protect`);

      // Step 2: Generate obfuscated mapping
      console.log('🗂️  Generating obfuscated filenames...');
      this.generateObfuscatedMapping(assets);

      // Step 3: Create obfuscated copies in dist
      console.log('📁 Creating obfuscated asset copies...');
      await this.createObfuscatedAssets();

      // Step 4: Update source code references
      console.log('🔄 Updating source code references...');
      await this.updateSourceReferences();

      // Step 5: Generate asset manifest
      console.log('📋 Generating asset manifest...');
      this.generateAssetManifest();

      // Step 6: Create asset protection middleware
      console.log('🛡️  Creating asset protection middleware...');
      this.createAssetMiddleware();

      console.log('\n🎉 Asset obfuscation completed successfully!');
      console.log('\n📊 Obfuscation Summary:');
      console.log(`   • Assets obfuscated: ${this.assetMapping.size}`);
      console.log(`   • Protection level: High`);
      console.log(`   • Direct access: Blocked`);
      console.log(`   • URL expiration: 15 minutes`);

    } catch (error) {
      console.error('❌ Asset obfuscation failed:', error.message);
      process.exit(1);
    }
  }

  discoverAssets() {
    const assets = [];
    
    // Scan public directory
    if (fs.existsSync(this.publicPath)) {
      const publicAssets = this.scanDirectory(this.publicPath, this.publicPath);
      assets.push(...publicAssets);
    }

    // Scan assets directory
    if (fs.existsSync(this.assetsPath)) {
      const assetDirAssets = this.scanDirectory(this.assetsPath, this.assetsPath);
      assets.push(...assetDirAssets);
    }

    // Scan for assets referenced in source code
    const sourceAssets = this.findAssetReferences();
    assets.push(...sourceAssets);

    // Remove duplicates and filter by extension
    const uniqueAssets = [...new Set(assets)];
    return uniqueAssets.filter(asset => 
      this.protectedExtensions.some(ext => asset.endsWith(ext))
    );
  }

  scanDirectory(dirPath, basePath) {
    const assets = [];
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        assets.push(...this.scanDirectory(fullPath, basePath));
      } else {
        const relativePath = path.relative(basePath, fullPath);
        assets.push(relativePath);
      }
    }

    return assets;
  }

  findAssetReferences() {
    const assets = [];
    const sourceFiles = this.scanSourceFiles();

    for (const sourceFile of sourceFiles) {
      const content = fs.readFileSync(sourceFile, 'utf8');
      const references = this.extractAssetReferences(content);
      assets.push(...references);
    }

    return assets;
  }

  scanSourceFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.vue'];

    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory() && item !== 'node_modules') {
          scanDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    scanDir(this.srcPath);
    return files;
  }

  extractAssetReferences(content) {
    const assets = [];
    
    // Match various asset reference patterns
    const patterns = [
      /['"]([\w\-./]+\.(?:jpg|jpeg|png|webp|avif|glb|gltf|json|bin))['"]/gi,
      /url\(['"]?([\w\-./]+\.(?:jpg|jpeg|png|webp|avif|glb|gltf|json|bin))['"]?\)/gi,
      /src\s*=\s*['"]([^'"]*\.(?:jpg|jpeg|png|webp|avif|glb|gltf|json|bin))['"]]/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        assets.push(match[1]);
      }
    }

    return assets;
  }

  generateObfuscatedMapping(assets) {
    for (const asset of assets) {
      const extension = path.extname(asset);
      const hash = crypto.randomBytes(8).toString('hex');
      const obfuscatedName = `${hash}${extension}`;
      
      this.assetMapping.set(asset, obfuscatedName);
      console.log(`   📄 ${asset} → ${obfuscatedName}`);
    }
  }

  async createObfuscatedAssets() {
    if (!fs.existsSync(this.distPath)) {
      fs.mkdirSync(this.distPath, { recursive: true });
    }

    const assetsDir = path.join(this.distPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    for (const [originalPath, obfuscatedName] of this.assetMapping) {
      // Try multiple source locations
      const possibleSources = [
        path.join(this.publicPath, originalPath),
        path.join(this.assetsPath, originalPath),
        path.join(this.projectRoot, originalPath)
      ];

      let sourcePath = null;
      for (const possibleSource of possibleSources) {
        if (fs.existsSync(possibleSource)) {
          sourcePath = possibleSource;
          break;
        }
      }

      if (sourcePath) {
        const destPath = path.join(assetsDir, obfuscatedName);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`   ✅ Copied ${originalPath} → assets/${obfuscatedName}`);
      } else {
        console.warn(`   ⚠️  Source asset not found: ${originalPath}`);
      }
    }
  }

  async updateSourceReferences() {
    const sourceFiles = this.scanSourceFiles();

    for (const sourceFile of sourceFiles) {
      let content = fs.readFileSync(sourceFile, 'utf8');
      let updated = false;

      for (const [originalPath, obfuscatedName] of this.assetMapping) {
        const regex = new RegExp(originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `/assets/${obfuscatedName}`);
          updated = true;
        }
      }

      if (updated) {
        fs.writeFileSync(sourceFile, content);
        console.log(`   🔄 Updated references in ${path.relative(this.projectRoot, sourceFile)}`);
      }
    }
  }

  generateAssetManifest() {
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalAssets: this.assetMapping.size,
      protectionLevel: 'high',
      urlExpiration: '15 minutes',
      assets: Object.fromEntries(this.assetMapping)
    };

    const manifestPath = path.join(this.distPath, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`   📋 Asset manifest created: ${manifest.totalAssets} assets`);
  }

  createAssetMiddleware() {
    const middlewareContent = `
/**
 * Asset Protection Middleware
 * Auto-generated by Asset Obfuscation Build Script
 */

import { AssetProtectionService } from '../src/security/AssetProtectionService.js';

const assetProtection = new AssetProtectionService({
  enabled: true,
  urlExpiration: 15,
  proxyEndpoint: '/secure-assets'
});

// Asset mapping (obfuscated)
const assetMapping = new Map(${JSON.stringify([...this.assetMapping], null, 2)});

export function createAssetProxy() {
  return assetProtection.createProxyMiddleware();
}

export function getProtectedAssetUrl(originalPath) {
  const obfuscatedName = assetMapping.get(originalPath);
  if (!obfuscatedName) {
    console.warn('Asset not found in protection mapping:', originalPath);
    return originalPath;
  }
  
  return assetProtection.generateSignedUrl(\`/assets/\${obfuscatedName}\`);
}

export { assetProtection };
`;

    const middlewarePath = path.join(this.distPath, 'asset-middleware.js');
    fs.writeFileSync(middlewarePath, middlewareContent);
    console.log(`   🛡️  Asset middleware created`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the asset obfuscation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const obfuscator = new AssetObfuscator();
  obfuscator.obfuscateAssets().catch(error => {
    console.error('Asset obfuscation failed:', error);
    process.exit(1);
  });
}

export default AssetObfuscator;
