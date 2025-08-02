#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size comparison script
class BundleSizeMonitor {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.baselinePath = path.join(__dirname, '..', 'baseline-sizes.json');
  }

  // Get current bundle sizes
  getCurrentSizes() {
    if (!fs.existsSync(this.distPath)) {
      throw new Error('Build directory does not exist. Run build first.');
    }

    const files = fs.readdirSync(this.distPath);
    const sizes = {};
    let totalSize = 0;

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const filePath = path.join(this.distPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
        
        // Use generic names for comparison
        const type = file.endsWith('.js') ? 'javascript' : 'css';
        if (!sizes[type]) sizes[type] = 0;
        sizes[type] += sizeKB;
        totalSize += sizeKB;
      }
    }

    sizes.total = Math.round(totalSize * 100) / 100;
    return sizes;
  }

  // Save baseline sizes
  saveBaseline() {
    const sizes = this.getCurrentSizes();
    fs.writeFileSync(this.baselinePath, JSON.stringify(sizes, null, 2));
    console.log('✅ Baseline sizes saved:');
    console.log(`   JavaScript: ${sizes.javascript || 0} KB`);
    console.log(`   CSS: ${sizes.css || 0} KB`);
    console.log(`   Total: ${sizes.total} KB`);
  }

  // Compare with baseline
  compareWithBaseline() {
    const currentSizes = this.getCurrentSizes();
    
    if (!fs.existsSync(this.baselinePath)) {
      console.log('⚠️  No baseline found. Creating baseline...');
      this.saveBaseline();
      return;
    }

    const baseline = JSON.parse(fs.readFileSync(this.baselinePath, 'utf8'));
    
    console.log('📊 Bundle Size Comparison:');
    console.log('');
    
    const types = ['javascript', 'css', 'total'];
    let hasIncreaseAboveThreshold = false;
    
    for (const type of types) {
      const current = currentSizes[type] || 0;
      const base = baseline[type] || 0;
      const diff = current - base;
      const percentChange = base > 0 ? (diff / base * 100) : 0;
      
      const sign = diff > 0 ? '+' : '';
      const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      
      console.log(`${emoji} ${type.toUpperCase()}:`);
      console.log(`   Current: ${current} KB`);
      console.log(`   Baseline: ${base} KB`);
      console.log(`   Change: ${sign}${diff.toFixed(2)} KB (${sign}${percentChange.toFixed(1)}%)`);
      console.log('');
      
      // Check if increase is above 10% threshold
      if (type === 'total' && percentChange > 10) {
        hasIncreaseAboveThreshold = true;
      }
    }
    
    if (hasIncreaseAboveThreshold) {
      console.log('❌ Bundle size increased by more than 10%! This may impact performance.');
      console.log('   Consider optimizing obfuscation settings or reviewing added code.');
      process.exit(1);
    } else if (currentSizes.total > (baseline.total || 0)) {
      console.log('⚠️  Bundle size increased, but within acceptable limits (<10%).');
    } else {
      console.log('✅ Bundle size is within acceptable limits.');
    }
  }

  // Performance timing test
  async performanceTest() {
    console.log('🚀 Running performance timing test...');
    
    const htmlFile = path.join(this.distPath, 'index.html');
    if (!fs.existsSync(htmlFile)) {
      console.log('❌ No index.html found in build');
      return;
    }

    // This is a simplified test - in real scenarios you'd use tools like Lighthouse
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const jsFiles = htmlContent.match(/src="[^"]*\.js"/g) || [];
    const cssFiles = htmlContent.match(/href="[^"]*\.css"/g) || [];
    
    console.log(`📄 Found ${jsFiles.length} JS files and ${cssFiles.length} CSS files to load`);
    
    // Estimate load time based on file sizes (rough calculation)
    const currentSizes = this.getCurrentSizes();
    const estimatedLoadTime = Math.round((currentSizes.total / 100) * 100); // Rough estimate: 100ms per 100KB
    
    console.log(`⏱️  Estimated load time: ~${estimatedLoadTime}ms`);
    
    if (estimatedLoadTime > 500) {
      console.log('⚠️  Estimated load time exceeds 500ms target');
    } else {
      console.log('✅ Estimated load time is within 500ms target');
    }
  }
}

// CLI interface
const command = process.argv[2];
const monitor = new BundleSizeMonitor();

switch (command) {
  case 'baseline':
    monitor.saveBaseline();
    break;
  case 'compare':
    monitor.compareWithBaseline();
    break;
  case 'performance':
    monitor.performanceTest();
    break;
  default:
    console.log('Bundle Size Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/bundle-monitor.js baseline   - Save current sizes as baseline');
    console.log('  node scripts/bundle-monitor.js compare    - Compare current sizes with baseline');
    console.log('  node scripts/bundle-monitor.js performance - Run performance timing test');
}
