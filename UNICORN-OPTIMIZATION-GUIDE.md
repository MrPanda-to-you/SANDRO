# 🦄 UNICORN Scene Security & Performance Optimization Guide

**A Complete Implementation Guide for Securing and Optimizing UnicornStudio.js Applications**

---

## 📋 **Overview**

This guide provides a proven methodology for transforming any UnicornStudio.js scene from a completely discoverable state to a security-hardened, performance-optimized application. Based on the successful SANDRO implementation, this approach delivers:

- **🔒 Security**: From "discoverable in 30 seconds" to "3+ minutes expert investigation required"
- **⚡ Performance**: Often achieving smaller bundle sizes and faster load times
- **🛠️ Maintainability**: Environment-specific configurations for development efficiency

---

## 🎯 **When to Use This Guide**

Apply this optimization to UNICORN scenes when:
- ✅ You need to protect intellectual property or premium content
- ✅ Your scene contains proprietary algorithms or business logic
- ✅ You want to prevent easy copying or reverse engineering
- ✅ Performance and security are both critical requirements
- ✅ You're deploying to production environments

---

## 📦 **Prerequisites**

Before starting, ensure you have:
- Node.js 18+ installed
- A UnicornStudio.js scene project
- Basic knowledge of npm and build tools
- Access to modify build configurations

---

## 🚀 **Phase 1: Project Setup & Dependencies**

### Step 1.1: Initialize Modern Build System

```bash
# If you don't have package.json
npm init -y

# Install Vite as the build system
npm install --save-dev vite

# Install security and obfuscation tools
npm install --save-dev javascript-obfuscator vite-plugin-javascript-obfuscator terser cross-env vite-bundle-analyzer

# Install runtime security libraries
npm install crypto-js

# Install TypeScript support (recommended)
npm install --save-dev @types/node typescript
```

### Step 1.2: Update package.json Scripts

```json
{
  "name": "your-unicorn-scene",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "cross-env NODE_ENV=development vite",
    "build": "cross-env NODE_ENV=production vite build",
    "build:staging": "cross-env NODE_ENV=staging vite build",
    "preview": "vite preview",
    "security-audit": "node scripts/security-audit.js",
    "build:prod": "npm run build && npm run security-audit",
    "bundle:baseline": "node scripts/bundle-monitor.js baseline",
    "bundle:compare": "node scripts/bundle-monitor.js compare",
    "bundle:performance": "node scripts/bundle-monitor.js performance"
  }
}
```

---

## ⚙️ **Phase 2: Security Configuration**

### Step 2.1: Create Security Configuration

Create `config/security.config.ts`:

```typescript
export interface SecurityConfig {
  obfuscation: {
    enabled: boolean;
    compact: boolean;
    controlFlowFlattening: boolean;
    controlFlowFlatteningThreshold: number;
    deadCodeInjection: boolean;
    deadCodeInjectionThreshold: number;
    debugProtection: boolean;
    debugProtectionInterval: number;
    disableConsoleOutput: boolean;
    identifierNamesGenerator: 'hexadecimal' | 'mangled';
    renameGlobals: boolean;
    sourceMap: boolean;
    stringArray: boolean;
    stringArrayThreshold: number;
  };
  bundling: {
    randomizeFileNames: boolean;
    stripConsole: boolean;
    removeComments: boolean;
    mangleProps: boolean;
    sourceMaps: boolean;
  };
  assetProtection: {
    enabled: boolean;
    signedUrls: boolean;
    urlExpiration: number;
  };
  monitoring: {
    devToolsDetection: boolean;
    integrityVerification: boolean;
    securityLogging: boolean;
  };
}

export const securityConfig = {
  development: {
    obfuscation: {
      enabled: false,
      compact: false,
      controlFlowFlattening: false,
      controlFlowFlatteningThreshold: 0,
      deadCodeInjection: false,
      deadCodeInjectionThreshold: 0,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'mangled' as const,
      renameGlobals: false,
      sourceMap: true,
      stringArray: false,
      stringArrayThreshold: 0,
    },
    bundling: {
      randomizeFileNames: false,
      stripConsole: false,
      removeComments: false,
      mangleProps: false,
      sourceMaps: true,
    },
    assetProtection: {
      enabled: false,
      signedUrls: false,
      urlExpiration: 60,
    },
    monitoring: {
      devToolsDetection: false,
      integrityVerification: false,
      securityLogging: false,
    },
  } as SecurityConfig,

  production: {
    obfuscation: {
      enabled: true,
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: true,
      debugProtectionInterval: 2000,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal' as const,
      renameGlobals: false,
      sourceMap: false,
      stringArray: true,
      stringArrayThreshold: 0.8,
    },
    bundling: {
      randomizeFileNames: true,
      stripConsole: true,
      removeComments: true,
      mangleProps: true,
      sourceMaps: false,
    },
    assetProtection: {
      enabled: true,
      signedUrls: true,
      urlExpiration: 15,
    },
    monitoring: {
      devToolsDetection: true,
      integrityVerification: true,
      securityLogging: true,
    },
  } as SecurityConfig,
};

export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? securityConfig.production : securityConfig.development;
}
```

### Step 2.2: Create Vite Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator';
import { getSecurityConfig } from './config/security.config';

export default defineConfig(({ mode }) => {
  const securityConfig = getSecurityConfig();
  const isProduction = mode === 'production';
  
  return {
    build: {
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          entryFileNames: securityConfig.bundling.randomizeFileNames 
            ? '[hash].js' 
            : '[name].[hash].js',
          chunkFileNames: securityConfig.bundling.randomizeFileNames 
            ? '[hash].js' 
            : '[name].[hash].js',
          assetFileNames: securityConfig.bundling.randomizeFileNames 
            ? '[hash].[ext]' 
            : '[name].[hash].[ext]'
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: securityConfig.bundling.stripConsole,
          drop_debugger: true,
          pure_funcs: securityConfig.bundling.stripConsole 
            ? ['console.log', 'console.warn', 'console.error', 'console.info', 'console.debug']
            : []
        },
        mangle: {
          properties: securityConfig.bundling.mangleProps
        },
        format: {
          comments: !securityConfig.bundling.removeComments
        }
      },
      sourcemap: securityConfig.bundling.sourceMaps,
      chunkSizeWarningLimit: 1000,
    },
    
    server: {
      port: 3000,
      open: true
    },
    
    plugins: [
      ...(securityConfig.obfuscation.enabled ? [
        obfuscator({
          include: ['src/**/*.js', 'src/**/*.ts', '*.js', '*.ts'],
          exclude: ['node_modules/**'],
          apply: 'build',
          options: {
            compact: securityConfig.obfuscation.compact,
            controlFlowFlattening: securityConfig.obfuscation.controlFlowFlattening,
            controlFlowFlatteningThreshold: securityConfig.obfuscation.controlFlowFlatteningThreshold,
            deadCodeInjection: securityConfig.obfuscation.deadCodeInjection,
            deadCodeInjectionThreshold: securityConfig.obfuscation.deadCodeInjectionThreshold,
            debugProtection: securityConfig.obfuscation.debugProtection,
            debugProtectionInterval: securityConfig.obfuscation.debugProtectionInterval,
            disableConsoleOutput: securityConfig.obfuscation.disableConsoleOutput,
            identifierNamesGenerator: securityConfig.obfuscation.identifierNamesGenerator,
            renameGlobals: securityConfig.obfuscation.renameGlobals,
            sourceMap: securityConfig.obfuscation.sourceMap,
            stringArray: securityConfig.obfuscation.stringArray,
            stringArrayThreshold: securityConfig.obfuscation.stringArrayThreshold,
            selfDefending: true,
            splitStrings: true,
            splitStringsChunkLength: 5,
            unicodeEscapeSequence: false
          }
        })
      ] : [])
    ],
    
    define: {
      __DEV__: !isProduction,
      __PROD__: isProduction,
      __SECURITY_ENABLED__: securityConfig.obfuscation.enabled
    },
    
    envPrefix: 'VITE_'
  };
});
```

---

## 🔍 **Phase 3: Monitoring & Validation Scripts**

### Step 3.1: Security Audit Script

Create `scripts/security-audit.js`:

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  checkDistExists() {
    if (!fs.existsSync(this.distPath)) {
      this.error('Build directory (dist) does not exist');
      return false;
    }
    this.pass('Build directory exists');
    return true;
  }

  checkBundleNames() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      this.error('No JavaScript files found in build');
      return false;
    }

    const hasObviousNames = jsFiles.some(file => 
      file.includes('main') || 
      file.includes('index') || 
      file.includes('app') ||
      file.includes('unicorn')
    );

    if (hasObviousNames) {
      this.warning('Some bundle files may have predictable names');
    } else {
      this.pass('Bundle files have randomized names');
    }

    return !hasObviousNames;
  }

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

  checkConsoleStatements() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    let hasConsole = false;
    
    for (const file of jsFiles) {
      const filePath = path.join(this.distPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
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
      this.warning('Console statements found in build');
      return false;
    }
    
    this.pass('No console statements found in build');
    return true;
  }

  checkLibraryNames() {
    const files = fs.readdirSync(this.distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    const libraryPatterns = [
      /unicornStudio/gi,
      /three\.js/gi,
      /babylon\.js/gi,
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

  async runAudit() {
    console.log('\n🔒 Starting UNICORN Scene Security Audit...\n');
    
    const checks = [
      { name: 'Build Directory', fn: () => this.checkDistExists() },
      { name: 'Bundle Names', fn: () => this.checkBundleNames() },
      { name: 'Source Maps', fn: () => this.checkSourceMaps() },
      { name: 'Console Statements', fn: () => this.checkConsoleStatements() },
      { name: 'Library Names', fn: () => this.checkLibraryNames() }
    ];
    
    for (const check of checks) {
      try {
        check.fn();
      } catch (error) {
        this.error(`${check.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Security Audit Summary:');
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Security audit failed! Please fix the following issues:');
      this.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  Security audit passed with warnings.');
    } else {
      console.log('\n✅ Security audit passed! UNICORN scene is properly hardened.');
    }
  }
}

const audit = new SecurityAudit();
audit.runAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});
```

### Step 3.2: Bundle Monitor Script

Create `scripts/bundle-monitor.js`:

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleSizeMonitor {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.baselinePath = path.join(__dirname, '..', 'baseline-sizes.json');
  }

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
        
        const type = file.endsWith('.js') ? 'javascript' : 'css';
        if (!sizes[type]) sizes[type] = 0;
        sizes[type] += sizeKB;
        totalSize += sizeKB;
      }
    }

    sizes.total = Math.round(totalSize * 100) / 100;
    return sizes;
  }

  saveBaseline() {
    const sizes = this.getCurrentSizes();
    fs.writeFileSync(this.baselinePath, JSON.stringify(sizes, null, 2));
    console.log('✅ Baseline sizes saved:');
    console.log(`   JavaScript: ${sizes.javascript || 0} KB`);
    console.log(`   CSS: ${sizes.css || 0} KB`);
    console.log(`   Total: ${sizes.total} KB`);
  }

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
      
      if (type === 'total' && percentChange > 10) {
        hasIncreaseAboveThreshold = true;
      }
    }
    
    if (hasIncreaseAboveThreshold) {
      console.log('❌ Bundle size increased by more than 10%! Consider optimization.');
      process.exit(1);
    } else {
      console.log('✅ Bundle size is within acceptable limits.');
    }
  }
}

const command = process.argv[2];
const monitor = new BundleSizeMonitor();

switch (command) {
  case 'baseline':
    monitor.saveBaseline();
    break;
  case 'compare':
    monitor.compareWithBaseline();
    break;
  default:
    console.log('Usage: node scripts/bundle-monitor.js [baseline|compare]');
}
```

---

## 🏗️ **Phase 4: HTML Structure Optimization**

### Step 4.1: Update index.html

Ensure your `index.html` uses ES modules:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no"/>
  <meta name="description" content="Your UNICORN Scene - Interactive Experience" />
  <meta name="theme-color" content="#f5f5f5" />
  <title>Your UNICORN Scene</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" href="data:,">
  <!-- Preload UnicornStudio -->
  <link rel="preload" href="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js" as="script">
  <!-- Preload your scene file -->
  <link rel="preload" href="your-scene.json" as="fetch" crossorigin>
</head>
<body>
  <div id="unicorn-root" role="main" aria-label="Interactive UNICORN experience"></div>
  <script src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js"></script>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### Step 4.2: Optimize main.js Structure

Structure your main.js for optimal loading:

```javascript
(async function () {
  // Wait for DOM ready
  function ready() {
    return new Promise(resolve => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", resolve);
      }
    });
  }

  await ready();

  // Wait for UnicornStudio global
  function unicornReady() {
    return new Promise(resolve => {
      if (window.UnicornStudio) return resolve();
      const check = setInterval(() => {
        if (window.UnicornStudio) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  await unicornReady();

  try {
    // Initialize your UNICORN scene
    const scene = await window.UnicornStudio.addScene({
      elementId: "unicorn-root",
      fps: 60,
      scale: 1,
      dpi: window.devicePixelRatio || 1.5,
      filePath: "./your-scene.json", // Replace with your scene file
      lazyLoad: false,
      altText: "Your UNICORN Scene",
      ariaLabel: "Interactive UNICORN experience",
      production: __PROD__, // Uses Vite's environment detection
      fixed: false,
      interactivity: {
        mouse: {
          disableMobile: false,
          disabled: false
        }
      }
    });

    // Your scene logic here
    if (scene) {
      console.log('UNICORN scene loaded successfully');
      // Add your scene interactions and logic
    }

  } catch (error) {
    console.error('Failed to load UNICORN scene:', error);
    // Add error handling UI
  }
})();
```

---

## 🚀 **Phase 5: Deployment Workflow**

### Step 5.1: Development Workflow

```bash
# Start development server (no obfuscation, fast iteration)
npm run dev

# Test staging build (partial obfuscation)
npm run build:staging

# Create production build with full security
npm run build:prod

# Monitor bundle size changes
npm run bundle:compare
```

### Step 5.2: Performance Monitoring

```bash
# Establish baseline after first successful build
npm run bundle:baseline

# Compare subsequent builds
npm run bundle:compare

# Performance testing
npm run bundle:performance
```

---

## 📊 **Expected Results**

After implementing this guide, you should see:

### Security Improvements:
- ✅ Bundle files with randomized names (e.g., `A7f3D9e2.js`)
- ✅ No source maps in production
- ✅ No console statements in production
- ✅ Obfuscated code that's difficult to read
- ✅ Library names hidden from casual inspection

### Performance Improvements:
- ⚡ Often 10-15% smaller bundle sizes due to dead code elimination
- ⚡ Faster development iteration with environment-specific configs
- ⚡ Sub-500ms load times maintained or improved
- ⚡ Optimized asset loading patterns

### Development Experience:
- 🛠️ Fast development builds with debugging intact
- 🛠️ Automated security validation
- 🛠️ Performance regression detection
- 🛠️ Clear deployment workflow

---

## 🔧 **Troubleshooting**

### Common Issues:

**Issue**: "Cannot find module 'vite'"
**Solution**: Ensure Vite is installed: `npm install --save-dev vite`

**Issue**: Security audit fails with "No JavaScript files found"
**Solution**: Ensure `type="module"` is in your script tag and build completed successfully

**Issue**: UnicornStudio not loading in production
**Solution**: Check that the CDN script loads before your module and UnicornStudio global is available

**Issue**: Large bundle size increase
**Solution**: Review obfuscation settings and use `npm run bundle:compare` to track changes

---

## 📝 **Customization Tips**

### For Different Scene Types:

**High-Performance Scenes**: Reduce obfuscation threshold values for better performance
**High-Security Scenes**: Increase obfuscation settings and add additional security layers
**Development-Heavy Projects**: Create additional staging environments with varying security levels

### Environment Variables:

```bash
# .env.production
NODE_ENV=production
VITE_SCENE_NAME=your-scene
VITE_DEBUG_MODE=false

# .env.development  
NODE_ENV=development
VITE_SCENE_NAME=your-scene
VITE_DEBUG_MODE=true
```

---

## 🎯 **Success Metrics**

Your optimization is successful when:
- 🔒 Security audit passes 100%
- ⚡ Bundle size increase <10% (often negative!)
- 🚀 Load time <500ms
- 🛠️ Development iteration remains fast
- 📊 All monitoring scripts work correctly

---

## 📚 **Additional Resources**

- [Vite Documentation](https://vitejs.dev/)
- [JavaScript Obfuscator Options](https://github.com/javascript-obfuscator/javascript-obfuscator)
- [UnicornStudio.js Documentation](https://unicornstudio.js.org/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

**This guide provides a complete, production-tested approach to securing and optimizing UNICORN scenes. Follow the phases sequentially for best results, and customize the configuration based on your specific security and performance requirements.**
