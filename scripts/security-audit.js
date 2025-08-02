#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security audit script for SANDRO build verification
class SecurityAudit {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  pass(message) {
    this.passed.push(message);
    this.log(message, 'pass');
  }

  // Check if dist directory exists
  checkDistExists() {
    if (!fs.existsSync(this.distPath)) {
      this.error('Build directory (dist) does not exist');
      return false;
    }
    this.pass('Build directory exists');
    return true;
  }

  // Check for randomized bundle names
  checkBundleNames() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      this.error('No JavaScript files found in build');
      return false;
    }

    // Check if any files contain obvious library names
    const hasObviousNames = jsFiles.some(file => 
      file.includes('main') || 
      file.includes('index') || 
      file.includes('app') ||
      file.includes('unicorn') ||
      file.includes('sandro')
    );

    if (hasObviousNames) {
      this.warning('Some bundle files may have predictable names');
    } else {
      this.pass('Bundle files have randomized names');
    }

    return !hasObviousNames;
  }

  // Check for source maps
  checkSourceMaps() {
    const files = fs.readdirSync(this.distPath);
    const mapFiles = files.filter(file => file.endsWith('.map'));
    
    if (mapFiles.length > 0) {
      this.error(`Found ${mapFiles.length} source map files in production build`);
      return false;
    }
    
    this.pass('No source maps found in production build');
    return true;
  }

  // Check for console statements in bundle
  checkConsoleStatements() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    let hasConsole = false;
    
    for (const file of jsFiles) {
      const filePath = path.join(this.distPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for various console methods
      const consolePatterns = [
        /console\.log/g,
        /console\.warn/g,
        /console\.error/g,
        /console\.info/g,
        /console\.debug/g
      ];
      
      for (const pattern of consolePatterns) {
        if (pattern.test(content)) {
          hasConsole = true;
          break;
        }
      }
      
      if (hasConsole) break;
    }
    
    if (hasConsole) {
      this.warning('Console statements found in build (may be intentional for error logging)');
      return false;
    }
    
    this.pass('No console statements found in build');
    return true;
  }

  // Check for obvious library names in bundle content
  checkLibraryNames() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    const libraryPatterns = [
      /unicornStudio/gi,
      /three\.js/gi,
      /babylon\.js/gi,
      /react/gi,
      /vue/gi,
      /angular/gi
    ];
    
    let foundLibraries = [];
    
    for (const file of jsFiles) {
      const filePath = path.join(this.distPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of libraryPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          foundLibraries = foundLibraries.concat(matches);
        }
      }
    }
    
    if (foundLibraries.length > 0) {
      this.warning(`Found potential library names: ${[...new Set(foundLibraries)].join(', ')}`);
      return false;
    }
    
    this.pass('No obvious library names found in bundle');
    return true;
  }

  // Check bundle size increase
  checkBundleSize() {
    // This is a simplified check - in a real scenario, you'd compare with a baseline
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    let totalSize = 0;
    for (const file of jsFiles) {
      const filePath = path.join(this.distPath, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
    
    const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
    this.log(`Total bundle size: ${sizeInMB} MB`, 'info');
    
    // Arbitrary check - should be replaced with actual baseline comparison
    if (totalSize > 10 * 1024 * 1024) { // 10MB
      this.warning('Bundle size is quite large - verify obfuscation impact');
    } else {
      this.pass('Bundle size is reasonable');
    }
    
    return true;
  }

  // Run all security checks
  async runAudit() {
    console.log('\n🔒 Starting SANDRO Security Audit...\n');
    
    const checks = [
      { name: 'Build Directory', fn: () => this.checkDistExists() },
      { name: 'Bundle Names', fn: () => this.checkBundleNames() },
      { name: 'Source Maps', fn: () => this.checkSourceMaps() },
      { name: 'Console Statements', fn: () => this.checkConsoleStatements() },
      { name: 'Library Names', fn: () => this.checkLibraryNames() },
      { name: 'Bundle Size', fn: () => this.checkBundleSize() }
    ];
    
    for (const check of checks) {
      try {
        check.fn();
      } catch (error) {
        this.error(`${check.name}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📊 Security Audit Summary:');
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Security audit failed! Please fix the following issues:');
      this.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  Security audit passed with warnings. Consider addressing:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    } else {
      console.log('\n✅ Security audit passed! Build is properly hardened.');
    }
  }
}

// Run the audit
const audit = new SecurityAudit();
audit.runAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});
