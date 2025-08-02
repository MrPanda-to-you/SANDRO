/**
 * Phase 4: Advanced Monitoring - Developer Tools Detection
 * Detects when developer tools are opened and responds accordingly
 */

export interface DevToolsDetectionConfig {
  enabled: boolean;
  detectionMethods: ('timing' | 'resize' | 'console' | 'debugger')[];
  warningMessage: string;
  onDetection?: (method: string, confidence: number) => void;
  blockOnDetection: boolean;
  detectionInterval: number; // ms
  confidenceThreshold: number; // 0-1
}

export interface DetectionResult {
  detected: boolean;
  method: string;
  confidence: number;
  timestamp: number;
}

export class DevToolsDetector {
  private config: DevToolsDetectionConfig;
  private isDetecting: boolean = false;
  private detectionInterval?: number;
  private lastDetection: DetectionResult | null = null;
  private detectionHistory: DetectionResult[] = [];
  private startTime: number = 0;
  private warningShown: boolean = false;
  
  constructor(config: Partial<DevToolsDetectionConfig> = {}) {
    this.config = {
      enabled: true,
      detectionMethods: ['timing', 'resize', 'console', 'debugger'],
      warningMessage: '⚠️ Developer tools detected. This may affect your experience.',
      blockOnDetection: false,
      detectionInterval: 1000,
      confidenceThreshold: 0.8,
      ...config
    };
  }

  /**
   * Start monitoring for developer tools
   */
  start(): void {
    if (!this.config.enabled || this.isDetecting) {
      return;
    }

    this.isDetecting = true;
    this.startTime = Date.now();
    
    // Start continuous detection
    this.detectionInterval = window.setInterval(() => {
      this.runDetection();
    }, this.config.detectionInterval);

    // Initial detection
    this.runDetection();

    console.log('🔍 DevTools detection started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isDetecting) return;

    this.isDetecting = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = undefined;
    }

    console.log('🔍 DevTools detection stopped');
  }

  /**
   * Run all enabled detection methods
   */
  private runDetection(): void {
    const results: DetectionResult[] = [];

    for (const method of this.config.detectionMethods) {
      try {
        const result = this.detectByMethod(method);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`Detection method ${method} failed:`, error);
      }
    }

    // Process results
    const highConfidenceDetections = results.filter(
      r => r.detected && r.confidence >= this.config.confidenceThreshold
    );

    if (highConfidenceDetections.length > 0) {
      const bestDetection = highConfidenceDetections.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      this.handleDetection(bestDetection);
    }

    // Store detection history (keep last 10)
    this.detectionHistory.push(...results);
    if (this.detectionHistory.length > 10) {
      this.detectionHistory = this.detectionHistory.slice(-10);
    }
  }

  /**
   * Detect using specific method
   */
  private detectByMethod(method: string): DetectionResult | null {
    const timestamp = Date.now();

    switch (method) {
      case 'timing':
        return this.timingBasedDetection(timestamp);
      case 'resize':
        return this.resizeBasedDetection(timestamp);
      case 'console':
        return this.consoleBasedDetection(timestamp);
      case 'debugger':
        return this.debuggerBasedDetection(timestamp);
      default:
        return null;
    }
  }

  /**
   * Timing-based detection using performance measurement
   */
  private timingBasedDetection(timestamp: number): DetectionResult {
    const start = performance.now();
    
    // Execute code that takes longer when devtools are open
    const obj: any = {};
    Object.defineProperty(obj, 'id', {
      get: function() {
        return 'test';
      }
    });
    
    // Access the property to trigger getter
    const _ = obj.id;
    
    const end = performance.now();
    const duration = end - start;
    
    // DevTools typically add 10-100ms overhead
    const detected = duration > 10;
    const confidence = Math.min(duration / 50, 1); // Normalize to 0-1

    return {
      detected,
      method: 'timing',
      confidence,
      timestamp
    };
  }

  /**
   * Window resize-based detection
   */
  private resizeBasedDetection(timestamp: number): DetectionResult {
    const threshold = 160; // Minimum devtools height
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // Check if the difference suggests devtools are open
    const detected = heightDiff > threshold || widthDiff > threshold;
    const confidence = detected ? Math.min((Math.max(heightDiff, widthDiff) - threshold) / 200, 1) : 0;

    return {
      detected,
      method: 'resize',
      confidence,
      timestamp
    };
  }

  /**
   * Console-based detection
   */
  private consoleBasedDetection(timestamp: number): DetectionResult {
    let detected = false;
    let confidence = 0;

    try {
      // Create a console object that detects access
      const devtools = {
        open: false,
        orientation: null
      };

      // Override console methods to detect access
      const original = console.log;
      console.log = function(...args) {
        devtools.open = true;
        return original.apply(console, args);
      };

      // Trigger console access
      console.log('%c', '');
      
      // Restore original
      console.log = original;

      detected = devtools.open;
      confidence = detected ? 0.7 : 0; // Medium confidence

    } catch (error) {
      // If error occurs, likely devtools interference
      detected = true;
      confidence = 0.6;
    }

    return {
      detected,
      method: 'console',
      confidence,
      timestamp
    };
  }

  /**
   * Debugger statement-based detection
   */
  private debuggerBasedDetection(timestamp: number): DetectionResult {
    const start = performance.now();
    
    try {
      // Use function constructor to avoid static analysis
      const func = new Function('debugger');
      func();
    } catch (error) {
      // Debugger blocked
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // If debugger was hit, duration will be much longer
    const detected = duration > 100;
    const confidence = detected ? Math.min(duration / 1000, 1) : 0;

    return {
      detected,
      method: 'debugger',
      confidence,
      timestamp
    };
  }

  /**
   * Handle positive detection
   */
  private handleDetection(detection: DetectionResult): void {
    this.lastDetection = detection;

    // Call custom callback
    if (this.config.onDetection) {
      this.config.onDetection(detection.method, detection.confidence);
    }

    // Show warning (once per session)
    if (!this.warningShown) {
      this.showWarning();
      this.warningShown = true;
    }

    // Block if configured
    if (this.config.blockOnDetection) {
      this.blockAccess();
    }

    console.warn(`🚨 DevTools detected via ${detection.method} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`);
  }

  /**
   * Show warning message
   */
  private showWarning(): void {
    // Create warning overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

    const message = document.createElement('div');
    message.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    message.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">⚠️ Developer Tools Detected</h3>
      <p style="margin: 0 0 15px 0; color: #333;">${this.config.warningMessage}</p>
      <button id="devtools-warning-close" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      ">Continue</button>
    `;

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Close button handler
    const closeBtn = document.getElementById('devtools-warning-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        document.body.removeChild(overlay);
      };
    }

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 10000);
  }

  /**
   * Block access completely
   */
  private blockAccess(): void {
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #f5f5f5;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1 style="color: #ff6b6b; margin-bottom: 20px;">🚫 Access Blocked</h1>
          <p style="color: #666; max-width: 400px;">
            Developer tools have been detected. Please close them and refresh the page to continue.
          </p>
        </div>
      </div>
    `;

    // Prevent further script execution
    throw new Error('Access blocked due to developer tools detection');
  }

  /**
   * Get detection statistics
   */
  getStats(): {
    isActive: boolean;
    totalDetections: number;
    lastDetection: DetectionResult | null;
    uptime: number;
    detectionRate: number;
  } {
    const totalDetections = this.detectionHistory.filter(d => d.detected).length;
    const uptime = this.isDetecting ? Date.now() - this.startTime : 0;
    const detectionRate = uptime > 0 ? totalDetections / (uptime / 1000 / 60) : 0; // per minute

    return {
      isActive: this.isDetecting,
      totalDetections,
      lastDetection: this.lastDetection,
      uptime,
      detectionRate
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DevToolsDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if currently detected
   */
  isCurrentlyDetected(): boolean {
    if (!this.lastDetection) return false;
    
    // Consider detection valid for 5 seconds
    const fiveSecondsAgo = Date.now() - 5000;
    return this.lastDetection.timestamp > fiveSecondsAgo && this.lastDetection.detected;
  }

  /**
   * Force a manual detection check
   */
  checkNow(): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    for (const method of this.config.detectionMethods) {
      const result = this.detectByMethod(method);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.detectionHistory = [];
    this.lastDetection = null;
  }
}

// Singleton instance for global access
let globalDetector: DevToolsDetector | null = null;

export function getDevToolsDetector(): DevToolsDetector {
  if (!globalDetector) {
    globalDetector = new DevToolsDetector();
  }
  return globalDetector;
}

export function startDevToolsDetection(config?: Partial<DevToolsDetectionConfig>): void {
  const detector = getDevToolsDetector();
  if (config) {
    detector.updateConfig(config);
  }
  detector.start();
}

export default DevToolsDetector;
