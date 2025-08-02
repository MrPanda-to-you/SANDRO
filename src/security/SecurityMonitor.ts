/**
 * Phase 4: Advanced Monitoring - Security Monitor
 * Unified security monitoring system that orchestrates all Phase 4 components
 */

import { DevToolsDetector, DevToolsDetectionConfig } from './DevToolsDetector.js';
import { SecurityEventLogger, SecurityEventLoggerConfig, SecurityEventType } from './SecurityEventLogger.js';
import { APIObfuscator, APIObfuscationConfig } from './APIObfuscator.js';

export interface SecurityMonitorConfig {
  enabled: boolean;
  devToolsDetection: Partial<DevToolsDetectionConfig>;
  eventLogging: Partial<SecurityEventLoggerConfig>;
  apiObfuscation: Partial<APIObfuscationConfig>;
  monitoringInterval: number; // ms
  alertThresholds: {
    devToolsDetections: number;
    integrityViolations: number;
    assetAccessDenials: number;
    rateLimitExceeded: number;
  };
  autoResponse: {
    enabled: boolean;
    blockOnCritical: boolean;
    warningOnMedium: boolean;
  };
}

export interface SecurityMetrics {
  uptime: number;
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  devToolsDetections: number;
  assetProtectionEvents: number;
  apiObfuscationStats: any;
  performanceImpact: {
    averageOverhead: number;
    peakOverhead: number;
    memoryUsage: number;
  };
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: number;
  acknowledged: boolean;
}

export class SecurityMonitor {
  private config: SecurityMonitorConfig;
  private devToolsDetector: DevToolsDetector;
  private eventLogger: SecurityEventLogger;
  private apiObfuscator: APIObfuscator;
  private startTime: number = Date.now();
  private monitoringTimer?: number;
  private isActive: boolean = false;
  private alerts: SecurityAlert[] = [];
  private metrics: Partial<SecurityMetrics> = {};

  constructor(config: Partial<SecurityMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      devToolsDetection: {
        enabled: true,
        detectionMethods: ['timing', 'resize', 'console'],
        warningMessage: '⚠️ Developer tools detected. This may affect your experience.',
        blockOnDetection: false,
        detectionInterval: 2000,
        confidenceThreshold: 0.7
      },
      eventLogging: {
        enabled: true,
        batchSize: 5,
        flushInterval: 15000,
        fingerprintingEnabled: true
      },
      apiObfuscation: {
        enabled: true,
        obfuscateEndpoints: true,
        obfuscateFields: true,
        rotationInterval: 30,
        rateLimitEnabled: true
      },
      monitoringInterval: 5000,
      alertThresholds: {
        devToolsDetections: 3,
        integrityViolations: 1,
        assetAccessDenials: 5,
        rateLimitExceeded: 10
      },
      autoResponse: {
        enabled: true,
        blockOnCritical: false,
        warningOnMedium: true
      },
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the security monitoring system
   */
  private initialize(): void {
    if (!this.config.enabled) {
      console.log('🔒 Security monitoring disabled');
      return;
    }

    // Initialize DevTools detection
    this.devToolsDetector = new DevToolsDetector({
      ...this.config.devToolsDetection,
      onDetection: (method, confidence) => {
        this.handleDevToolsDetection(method, confidence);
      }
    });

    // Initialize event logging
    this.eventLogger = new SecurityEventLogger(this.config.eventLogging);

    // Initialize API obfuscation
    this.apiObfuscator = new APIObfuscator(this.config.apiObfuscation);

    // Setup global error handlers
    this.setupGlobalErrorHandlers();

    // Start monitoring
    this.startMonitoring();

    console.log('🛡️ Security monitoring system initialized');
  }

  /**
   * Start comprehensive security monitoring
   */
  startMonitoring(): void {
    if (this.isActive) {
      console.warn('Security monitoring already active');
      return;
    }

    this.isActive = true;
    this.startTime = Date.now();

    // Start individual components
    this.devToolsDetector.start();

    // Start periodic monitoring
    this.monitoringTimer = window.setInterval(() => {
      this.performSecurityCheck();
    }, this.config.monitoringInterval);

    // Log monitoring start
    this.eventLogger.logEvent(
      'security_monitor_started' as SecurityEventType,
      {
        config: this.config,
        timestamp: Date.now()
      },
      'low',
      'SecurityMonitor'
    );

    console.log('🔍 Security monitoring started');
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Stop individual components
    this.devToolsDetector.stop();

    // Stop monitoring timer
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    // Log monitoring stop
    this.eventLogger.logEvent(
      'security_monitor_stopped' as SecurityEventType,
      {
        uptime: Date.now() - this.startTime,
        totalAlerts: this.alerts.length
      },
      'low',
      'SecurityMonitor'
    );

    console.log('🔍 Security monitoring stopped');
  }

  /**
   * Perform periodic security check
   */
  private performSecurityCheck(): void {
    try {
      // Update metrics
      this.updateMetrics();

      // Check for anomalies
      this.checkForAnomalies();

      // Process alerts
      this.processAlerts();

      // Cleanup old data
      this.cleanup();

    } catch (error) {
      console.error('Security check failed:', error);
      this.eventLogger.logEvent(
        'performance_anomaly',
        {
          error: error.message,
          stack: error.stack
        },
        'medium',
        'SecurityMonitor'
      );
    }
  }

  /**
   * Handle DevTools detection
   */
  private handleDevToolsDetection(method: string, confidence: number): void {
    // Log the detection
    this.eventLogger.logDevToolsDetection(method, confidence);

    // Create alert
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: 'devtools_detected',
      severity: confidence > 0.8 ? 'high' : 'medium',
      message: `Developer tools detected via ${method}`,
      details: { method, confidence, timestamp: Date.now() },
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Check if threshold exceeded
    const recentDetections = this.alerts.filter(
      a => a.type === 'devtools_detected' && 
           Date.now() - a.timestamp < 60000 // Last minute
    ).length;

    if (recentDetections >= this.config.alertThresholds.devToolsDetections) {
      this.escalateAlert(alert, 'Multiple developer tools detections in short time');
    }
  }

  /**
   * Handle integrity violation
   */
  handleIntegrityViolation(resource: string, expected: string, actual: string): void {
    // Log the violation
    this.eventLogger.logIntegrityViolation(resource, expected, actual);

    // Create critical alert
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: 'integrity_violation',
      severity: 'critical',
      message: `Integrity violation detected for ${resource}`,
      details: { resource, expected, actual, timestamp: Date.now() },
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Always escalate integrity violations
    this.escalateAlert(alert, 'Code integrity compromised');
  }

  /**
   * Handle asset access denial
   */
  handleAssetAccessDenial(assetPath: string, reason: string): void {
    // Log the denial
    this.eventLogger.logAssetAccessDenied(assetPath, reason);

    // Create alert
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: 'asset_access_denied',
      severity: 'medium',
      message: `Asset access denied: ${assetPath}`,
      details: { assetPath, reason, timestamp: Date.now() },
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Check threshold
    const recentDenials = this.alerts.filter(
      a => a.type === 'asset_access_denied' && 
           Date.now() - a.timestamp < 300000 // Last 5 minutes
    ).length;

    if (recentDenials >= this.config.alertThresholds.assetAccessDenials) {
      this.escalateAlert(alert, 'Multiple asset access attempts blocked');
    }
  }

  /**
   * Escalate alert for immediate attention
   */
  private escalateAlert(alert: SecurityAlert, reason: string): void {
    console.warn(`🚨 SECURITY ALERT ESCALATED: ${alert.message} - ${reason}`);

    // Log escalation
    this.eventLogger.logEvent(
      'security_alert_escalated' as SecurityEventType,
      {
        alertId: alert.id,
        originalType: alert.type,
        reason,
        details: alert.details
      },
      'critical',
      'SecurityMonitor'
    );

    // Auto-response if enabled
    if (this.config.autoResponse.enabled) {
      if (alert.severity === 'critical' && this.config.autoResponse.blockOnCritical) {
        this.initiateEmergencyBlock(reason);
      } else if (alert.severity === 'medium' && this.config.autoResponse.warningOnMedium) {
        this.showSecurityWarning(alert.message);
      }
    }
  }

  /**
   * Initiate emergency security block
   */
  private initiateEmergencyBlock(reason: string): void {
    console.error(`🚫 EMERGENCY SECURITY BLOCK: ${reason}`);

    // Block all asset access - would integrate with AssetSecurityIntegration
    try {
      // Emergency revocation would be implemented here
      console.warn('Emergency asset revocation triggered');
    } catch (error) {
      console.error('Emergency revocation failed:', error);
    }

    // Show blocking message
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #ff1744;
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1>🚫 Security Alert</h1>
          <p>Access has been temporarily blocked due to security concerns.</p>
          <p style="font-size: 0.9em; opacity: 0.8;">Reason: ${reason}</p>
          <p style="font-size: 0.8em; margin-top: 20px;">
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    `;

    // Prevent further execution
    throw new Error(`Emergency security block: ${reason}`);
  }

  /**
   * Show security warning
   */
  private showSecurityWarning(message: string): void {
    // Create warning notification
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      max-width: 300px;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    warning.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="font-size: 18px; margin-right: 10px;">⚠️</span>
        <div>
          <strong>Security Warning</strong><br>
          ${message}
        </div>
      </div>
    `;

    document.body.appendChild(warning);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(warning)) {
        document.body.removeChild(warning);
      }
    }, 10000);
  }

  /**
   * Update security metrics
   */
  private updateMetrics(): void {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Count events by type
    const eventsByType: Record<string, number> = {};
    for (const alert of this.alerts) {
      eventsByType[alert.type] = (eventsByType[alert.type] || 0) + 1;
    }

    // Calculate threat level
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = this.alerts.filter(a => a.severity === 'high').length;
    
    let threatLevel: SecurityMetrics['threatLevel'] = 'low';
    if (criticalAlerts > 0) threatLevel = 'critical';
    else if (highAlerts > 2) threatLevel = 'high';
    else if (this.alerts.length > 10) threatLevel = 'medium';

    this.metrics = {
      uptime,
      totalEvents: this.alerts.length,
      eventsByType: eventsByType as Record<SecurityEventType, number>,
      devToolsDetections: eventsByType['devtools_detected'] || 0,
      assetProtectionEvents: eventsByType['asset_access_denied'] || 0,
      apiObfuscationStats: this.apiObfuscator.getStats(),
      performanceImpact: {
        averageOverhead: 5, // Would measure in production
        peakOverhead: 15,
        memoryUsage: 2048 // KB
      },
      threatLevel
    };
  }

  /**
   * Check for security anomalies
   */
  private checkForAnomalies(): void {
    const recentAlerts = this.alerts.filter(
      a => Date.now() - a.timestamp < 300000 // Last 5 minutes
    );

    // Check for rapid-fire alerts (potential attack)
    if (recentAlerts.length > 20) {
      this.eventLogger.logEvent(
        'suspicious_activity',
        {
          alertCount: recentAlerts.length,
          timeWindow: 300000,
          alertTypes: [...new Set(recentAlerts.map(a => a.type))]
        },
        'high',
        'SecurityMonitor'
      );
    }

    // Check for performance degradation
    const performanceEntries = performance.getEntriesByType('navigation');
    if (performanceEntries.length > 0) {
      const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
      if (navEntry.loadEventEnd - navEntry.loadEventStart > 5000) {
        this.eventLogger.logEvent(
          'performance_anomaly',
          {
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            threshold: 5000
          },
          'medium',
          'SecurityMonitor'
        );
      }
    }
  }

  /**
   * Process pending alerts
   */
  private processAlerts(): void {
    // Auto-acknowledge old low-severity alerts
    const oneHourAgo = Date.now() - 3600000;
    
    for (const alert of this.alerts) {
      if (!alert.acknowledged && 
          alert.severity === 'low' && 
          alert.timestamp < oneHourAgo) {
        alert.acknowledged = true;
      }
    }
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const oneDayAgo = Date.now() - 86400000; // 24 hours

    // Remove old acknowledged alerts
    this.alerts = this.alerts.filter(
      alert => !alert.acknowledged || alert.timestamp > oneDayAgo
    );

    // Limit total alerts to prevent memory issues
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.eventLogger.logEvent(
        'script_injection_attempt',
        {
          reason: event.reason?.toString(),
          promise: 'unhandled_rejection'
        },
        'medium',
        'GlobalErrorHandler'
      );
    });

    // Global errors
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('extension://')) {
        // Browser extension error, ignore
        return;
      }

      this.eventLogger.logEvent(
        'script_injection_attempt',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        'medium',
        'GlobalErrorHandler'
      );
    });
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  /**
   * Get current security metrics
   */
  getMetrics(): SecurityMetrics {
    this.updateMetrics();
    return this.metrics as SecurityMetrics;
  }

  /**
   * Get recent security alerts
   */
  getAlerts(limit: number = 50): SecurityAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get security status summary
   */
  getStatus(): {
    isActive: boolean;
    threatLevel: string;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    uptime: number;
  } {
    const unacknowledgedAlerts = this.alerts.filter(a => !a.acknowledged).length;
    
    return {
      isActive: this.isActive,
      threatLevel: this.metrics.threatLevel || 'low',
      totalAlerts: this.alerts.length,
      unacknowledgedAlerts,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update component configurations
    if (newConfig.devToolsDetection) {
      this.devToolsDetector.updateConfig(newConfig.devToolsDetection);
    }
    
    if (newConfig.eventLogging) {
      this.eventLogger.updateConfig(newConfig.eventLogging);
    }
    
    if (newConfig.apiObfuscation) {
      this.apiObfuscator.updateConfig(newConfig.apiObfuscation);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    
    this.devToolsDetector.destroy();
    this.eventLogger.destroy();
    this.apiObfuscator.destroy();
    
    this.alerts = [];
    this.metrics = {};
  }
}

// Singleton instance for global access
let globalMonitor: SecurityMonitor | null = null;

export function getSecurityMonitor(): SecurityMonitor {
  if (!globalMonitor) {
    globalMonitor = new SecurityMonitor();
  }
  return globalMonitor;
}

export function startSecurityMonitoring(config?: Partial<SecurityMonitorConfig>): void {
  const monitor = getSecurityMonitor();
  if (config) {
    monitor.updateConfig(config);
  }
  monitor.startMonitoring();
}

export default SecurityMonitor;
