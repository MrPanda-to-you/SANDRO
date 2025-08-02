# 🏗️ SANDRO Security Architecture Design

## 🎯 Design Overview
This document provides the technical architecture and implementation specifications for transforming the SANDRO web application from a completely discoverable state to a security-hardened application that requires expert-level effort to reverse engineer.

## 🔧 Technology Stack

### Build System & Bundling
- **Primary Bundler**: Vite 5.x with production optimizations
- **Code Obfuscation**: `javascript-obfuscator` v4.x + `terser` for dual-layer protection
- **Asset Processing**: Custom asset proxy with signed URL generation
- **Environment Management**: `cross-env` for environment-specific builds

### Security Libraries
- **Integrity Verification**: `crypto-js` for runtime hash validation
- **Dev Tools Detection**: Custom implementation using timing attacks and console monitoring
- **Rate Limiting**: Client-side request throttling with exponential backoff
- **URL Obfuscation**: Custom base64 + timestamp encoding system

---

## 🏛️ SYSTEM ARCHITECTURE

### Code Protection Layer

```typescript
interface CodeProtectionConfig {
  obfuscation: {
    compact: boolean;
    controlFlowFlattening: boolean;
    deadCodeInjection: boolean;
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
  };
}
```

**Implementation Pattern:**
```javascript
// Production build configuration
const productionConfig = {
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[hash].js',
        chunkFileNames: '[hash].js',
        assetFileNames: '[hash].[ext]'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: {
        properties: true
      }
    }
  }
}
```

### Asset Protection Layer

```typescript
interface AssetProtectionSystem {
  urlGeneration: {
    generateSignedUrl(assetPath: string, expirationMinutes: number): string;
    validateSignedUrl(signedUrl: string): boolean;
    revokeExpiredUrls(): void;
  };
  assetProxy: {
    serveAsset(token: string): Response | 403;
    validateAccess(token: string, userAgent: string): boolean;
    logAccessAttempt(token: string, success: boolean): void;
  };
}
```

**Asset URL Structure:**
```
Format: /assets/{randomToken}?exp={timestamp}&sig={signature}
Example: /assets/a7f3d9e2?exp=1722537600&sig=9f86d081884c7d659a2feaa0c55ad015
```

### API Obfuscation Layer

```typescript
interface APIObfuscationConfig {
  endpoints: {
    '/api/saints': '/x9f2a',
    '/api/chapel': '/b4e7d',
    '/api/assets': '/k8m1p'
  };
  responseTransform: {
    fieldMapping: Map<string, string>;
    dataMinification: boolean;
    responseEncryption: boolean;
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstLimit: number;
    blockDuration: number;
  };
}
```

### Runtime Security Monitor

```typescript
class SecurityMonitor {
  private devToolsDetector: DevToolsDetector;
  private integrityVerifier: IntegrityVerifier;
  private eventLogger: SecurityEventLogger;

  detectDevTools(): boolean {
    // Timing-based detection
    const start = performance.now();
    console.log('%c', 'color: transparent');
    const end = performance.now();
    return (end - start) > 100;
  }

  verifyCodeIntegrity(): boolean {
    const expectedHashes = this.getExpectedHashes();
    const currentHashes = this.calculateCurrentHashes();
    return this.compareHashes(expectedHashes, currentHashes);
  }

  logSecurityEvent(event: SecurityEvent): void {
    // Send to secure logging endpoint
  }
}
```

---

## 🏗️ COMPONENT ARCHITECTURE

### Build Pipeline Components

#### 1. Obfuscation Pipeline
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { obfuscator } from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    obfuscator({
      include: ['src/**/*.js', 'src/**/*.ts'],
      exclude: ['node_modules/**'],
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        sourceMap: false,
        stringArray: true,
        stringArrayThreshold: 0.8
      }
    })
  ]
});
```

#### 2. Asset Protection Service
```typescript
class AssetProtectionService {
  private readonly EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes
  private readonly SIGNATURE_KEY = process.env.ASSET_SIGNATURE_KEY;

  generateSignedUrl(assetPath: string): string {
    const token = this.generateRandomToken();
    const expiration = Date.now() + this.EXPIRATION_TIME;
    const signature = this.generateSignature(token, expiration);
    
    return `/assets/${token}?exp=${expiration}&sig=${signature}`;
  }

  private generateSignature(token: string, expiration: number): string {
    const data = `${token}:${expiration}`;
    return crypto.createHmac('sha256', this.SIGNATURE_KEY)
                .update(data)
                .digest('hex');
  }

  validateSignedUrl(url: string): boolean {
    const urlParams = new URL(url, 'http://localhost');
    const token = urlParams.pathname.split('/').pop();
    const expiration = parseInt(urlParams.searchParams.get('exp') || '0');
    const signature = urlParams.searchParams.get('sig');

    if (Date.now() > expiration) return false;
    
    const expectedSignature = this.generateSignature(token!, expiration);
    return signature === expectedSignature;
  }
}
```

#### 3. Dev Tools Detection Component
```typescript
class DevToolsDetector {
  private isDevToolsOpen = false;
  private callbacks: Array<(isOpen: boolean) => void> = [];

  startDetection(): void {
    // Method 1: Console timing detection
    setInterval(() => {
      const start = performance.now();
      console.log('%c', 'color: transparent; font-size: 0px;');
      const end = performance.now();
      
      const isOpen = (end - start) > 100;
      if (isOpen !== this.isDevToolsOpen) {
        this.isDevToolsOpen = isOpen;
        this.notifyCallbacks(isOpen);
      }
    }, 1000);

    // Method 2: Window size detection
    window.addEventListener('resize', () => {
      const threshold = 160;
      const isOpen = (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      );
      
      if (isOpen !== this.isDevToolsOpen) {
        this.isDevToolsOpen = isOpen;
        this.notifyCallbacks(isOpen);
      }
    });
  }

  onDevToolsToggle(callback: (isOpen: boolean) => void): void {
    this.callbacks.push(callback);
  }

  private notifyCallbacks(isOpen: boolean): void {
    this.callbacks.forEach(callback => callback(isOpen));
  }
}
```

### Security Event Logging
```typescript
interface SecurityEvent {
  type: 'dev_tools_opened' | 'integrity_failure' | 'unauthorized_access' | 'rate_limit_exceeded';
  timestamp: number;
  userAgent: string;
  ip?: string;
  details: Record<string, any>;
}

class SecurityEventLogger {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  logEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Send to secure endpoint (rate limited)
    this.sendToEndpoint(event);
  }

  private async sendToEndpoint(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/security-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Fail silently to avoid revealing logging mechanism
    }
  }
}
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Bundle Size Management
- **Target**: <10% increase from obfuscation
- **Monitoring**: Bundle analyzer integration
- **Optimization**: Tree shaking + dead code elimination

### Asset Loading Strategy
```typescript
class LazyAssetLoader {
  private assetCache = new Map<string, Promise<string>>();

  async loadAsset(assetId: string): Promise<string> {
    if (this.assetCache.has(assetId)) {
      return this.assetCache.get(assetId)!;
    }

    const promise = this.fetchSignedAsset(assetId);
    this.assetCache.set(assetId, promise);
    
    // Auto-cleanup expired URLs
    setTimeout(() => {
      this.assetCache.delete(assetId);
    }, 15 * 60 * 1000);

    return promise;
  }

  private async fetchSignedAsset(assetId: string): Promise<string> {
    const signedUrl = await this.getSignedUrl(assetId);
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      throw new Error('Asset access denied');
    }
    
    return response.blob().then(blob => URL.createObjectURL(blob));
  }
}
```

---

## 🧪 TESTING ARCHITECTURE

### Security Testing Framework
```typescript
describe('Security Protection Suite', () => {
  test('Code obfuscation effectiveness', () => {
    const bundleContent = readBundleFile();
    expect(bundleContent).not.toContain('unicornStudio');
    expect(bundleContent).not.toContain('console.log');
    expect(bundleContent.match(/[a-zA-Z]{2,}/g).length).toBeLessThan(10);
  });

  test('Asset protection functionality', async () => {
    const signedUrl = assetService.generateSignedUrl('/image.jpg');
    expect(signedUrl).toMatch(/\/assets\/[a-f0-9]+\?exp=\d+&sig=[a-f0-9]+/);
    
    // Test expiration
    await wait(16 * 60 * 1000); // 16 minutes
    const response = await fetch(signedUrl);
    expect(response.status).toBe(403);
  });

  test('Dev tools detection accuracy', () => {
    const detector = new DevToolsDetector();
    let detectionCount = 0;
    
    detector.onDevToolsToggle(() => detectionCount++);
    detector.startDetection();
    
    // Simulate dev tools opening
    window.dispatchEvent(new Event('resize'));
    expect(detectionCount).toBeGreaterThan(0);
  });
});
```

### Penetration Testing Checklist
- [ ] Bundle analysis reveals no library names
- [ ] Source maps completely disabled
- [ ] Asset URLs expire properly
- [ ] Direct asset access returns 403/404
- [ ] API endpoints are non-discoverable
- [ ] Rate limiting prevents brute force
- [ ] Dev tools detection works across browsers
- [ ] Performance impact <10% bundle size, <500ms load time

---

## 🌐 DEPLOYMENT CONFIGURATION

### Environment-Specific Settings
```typescript
// config/security.ts
export const securityConfig = {
  development: {
    obfuscation: false,
    sourceMaps: true,
    consoleLogging: true,
    devToolsDetection: false
  },
  staging: {
    obfuscation: true,
    sourceMaps: false,
    consoleLogging: false,
    devToolsDetection: true
  },
  production: {
    obfuscation: true,
    sourceMaps: false,
    consoleLogging: false,
    devToolsDetection: true,
    integrityVerification: true,
    assetProtection: true
  }
};
```

### Build Script
```json
{
  "scripts": {
    "build:dev": "cross-env NODE_ENV=development vite build",
    "build:staging": "cross-env NODE_ENV=staging vite build",
    "build:prod": "cross-env NODE_ENV=production vite build && npm run security-audit",
    "security-audit": "node scripts/security-audit.js"
  }
}
```

---

## � Relationship to Design Methodology

This document demonstrates the design phase of spec-driven development by:

- **Requirements Translation**: Converting each security requirement into specific technical components
- **Architecture Definition**: Providing detailed system design with component relationships and data flow  
- **Technology Specification**: Selecting exact tools, libraries, and implementation patterns
- **Performance Optimization**: Defining measurable targets and optimization strategies
- **Testing Framework**: Establishing comprehensive testing approach for security measures
- **Implementation Guidance**: Offering code examples and configuration patterns

The relationship follows: **Requirements (what) → Design (how) → Tasks (step-by-step)**. This design document serves as the technical bridge that enables developers to implement the security requirements effectively while maintaining code quality and performance standards.