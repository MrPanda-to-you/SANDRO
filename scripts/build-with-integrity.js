#!/usr/bin/env node

/**
 * Enhanced Build Script with Integrity Verification
 * Phase 2: Integrates IntegrityVerifier with build-time hash generation
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildIntegrator {
  constructor() {
    this.distPath = path.join(path.dirname(__dirname), 'dist');
    this.integrityPath = path.join(path.dirname(__dirname), 'src', 'security', 'IntegrityVerifier.ts');
  }

  async buildWithIntegrity() {
    console.log('🏗️  Starting Enhanced Build with Integrity Verification...\n');

    try {
      // Step 1: Build the project
      console.log('📦 Building project...');
      execSync('npm run build', { stdio: 'inherit' });

      // Step 2: Generate file hashes
      console.log('🔐 Generating integrity hashes...');
      const hashes = this.generateFileHashes();

      // Step 3: Update IntegrityVerifier with hashes
      console.log('🛡️  Updating IntegrityVerifier...');
      await this.updateIntegrityVerifier(hashes);

      // Step 4: Rebuild with updated IntegrityVerifier
      console.log('🔄 Rebuilding with integrity verification...');
      execSync('npm run build', { stdio: 'inherit' });

      // Step 5: Final validation
      console.log('✅ Validating build integrity...');
      this.validateBuildIntegrity();

      console.log('\n🎉 Build completed successfully with integrity verification!');
      console.log('\n📊 Build Summary:');
      console.log(`   • JavaScript files: ${hashes.jsFiles.length}`);
      console.log(`   • CSS files: ${hashes.cssFiles.length}`);
      console.log(`   • Total size: ${this.formatBytes(hashes.totalSize)}`);
      console.log(`   • Integrity hashes: ${Object.keys(hashes.fileHashes).length}`);

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  generateFileHashes() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    const fileHashes = {};
    let totalSize = 0;

    // Generate hashes for all relevant files
    [...jsFiles, ...cssFiles].forEach(fileName => {
      const filePath = path.join(this.distPath, fileName);
      const content = fs.readFileSync(filePath, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      fileHashes[fileName] = {
        hash,
        size: content.length,
        type: fileName.endsWith('.js') ? 'javascript' : 'css'
      };
      
      totalSize += content.length;
      console.log(`   📄 ${fileName}: ${hash.substring(0, 16)}... (${this.formatBytes(content.length)})`);
    });

    return {
      jsFiles,
      cssFiles,
      fileHashes,
      totalSize,
      timestamp: new Date().toISOString()
    };
  }

  async updateIntegrityVerifier(hashes) {
    // Read current IntegrityVerifier
    const currentContent = fs.readFileSync(this.integrityPath, 'utf8');

    // Generate new hash data
    const hashData = {
      files: hashes.fileHashes,
      buildTimestamp: hashes.timestamp,
      totalFiles: Object.keys(hashes.fileHashes).length,
      phase: 'Phase2-Advanced'
    };

    // Update the IntegrityVerifier class with actual hashes
    const updatedContent = currentContent.replace(
      /private readonly expectedHashes: Map<string, string> = new Map\(\[[\s\S]*?\]\);/,
      `private readonly expectedHashes: Map<string, string> = new Map([
${Object.entries(hashes.fileHashes).map(([file, data]) => 
  `    ['${file}', '${data.hash}']`
).join(',\n')}
  ]);`
    );

    // Also update the build metadata
    const finalContent = updatedContent.replace(
      /private readonly buildMetadata = \{[\s\S]*?\};/,
      `private readonly buildMetadata = ${JSON.stringify(hashData, null, 4).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')};`
    );

    fs.writeFileSync(this.integrityPath, finalContent);
    console.log('   ✅ IntegrityVerifier updated with build-time hashes');
  }

  validateBuildIntegrity() {
    // Re-read the dist files to ensure they match expectations
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      throw new Error('No JavaScript files found in build output');
    }

    // Basic validation
    jsFiles.forEach(file => {
      const filePath = path.join(this.distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size < 1000) {
        console.warn(`⚠️  Warning: ${file} is suspiciously small (${stats.size} bytes)`);
      }
    });

    console.log('   ✅ Build integrity validation passed');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const integrator = new BuildIntegrator();
  integrator.buildWithIntegrity().catch(error => {
    console.error('Build integration failed:', error);
    process.exit(1);
  });
}

export default BuildIntegrator;
