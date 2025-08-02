/**
 * Phase 4: Advanced Monitoring - Security Event Logging
 * Comprehensive security event tracking and logging system
 */

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  source: string;
  details: Record<string, any>;
  userAgent?: string;
  sessionId?: string;
  fingerprint?: string;
}

export type SecurityEventType = 
  | 'devtools_detected'
  | 'integrity_violation'
  | 'asset_access_denied'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'script_injection_attempt'
  | 'console_access'
  | 'debugger_hit'
  | 'network_anomaly'
  | 'performance_anomaly';

export interface SecurityEventLoggerConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
  localStorageKey: string;
  fingerprintingEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface EventBatch {
  events: SecurityEvent[];
  batchId: string;
  timestamp: number;
  sessionId: string;
}

export class SecurityEventLogger {
  private config: SecurityEventLoggerConfig;
  private eventQueue: SecurityEvent[] = [];
  private sessionId: string;
  private fingerprint: string = '';
  private flushTimer?: number;
  private isOnline: boolean = true;
  private retryQueue: EventBatch[] = [];

  constructor(config: Partial<SecurityEventLoggerConfig> = {}) {
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      localStorageKey: 'sandro_security_events',
      fingerprintingEnabled: true,
      encryptionEnabled: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    if (this.config.fingerprintingEnabled) {
      this.generateFingerprint();
    }

    this.setupEventListeners();
    this.startPeriodicFlush();
    this.loadPendingEvents();
  }

  /**
   * Log a security event
   */
  logEvent(
    type: SecurityEventType,
    details: Record<string, any> = {},
    severity: SecurityEvent['severity'] = 'medium',
    source: string = 'unknown'
  ): string {
    if (!this.config.enabled) {
      return '';
    }

    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: Date.now(),
      source,
      details,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      fingerprint: this.fingerprint
    };

    this.eventQueue.push(event);

    // Immediate flush for critical events
    if (severity === 'critical') {
      this.flush();
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }

    console.log(`🔒 Security event logged: ${type} (${severity})`, details);
    return event.id;
  }

  /**
   * Log developer tools detection
   */
  logDevToolsDetection(method: string, confidence: number): string {
    return this.logEvent(
      'devtools_detected',
      {
        detectionMethod: method,
        confidence,
        timestamp: Date.now(),
        url: window.location.href
      },
      confidence > 0.8 ? 'high' : 'medium',
      'DevToolsDetector'
    );
  }

  /**
   * Log integrity violation
   */
  logIntegrityViolation(
    resourceType: string,
    expectedHash: string,
    actualHash: string
  ): string {
    return this.logEvent(
      'integrity_violation',
      {
        resourceType,
        expectedHash,
        actualHash,
        url: window.location.href
      },
      'critical',
      'IntegrityVerifier'
    );
  }

  /**
   * Log asset access denial
   */
  logAssetAccessDenied(
    assetPath: string,
    reason: string,
    token?: string
  ): string {
    return this.logEvent(
      'asset_access_denied',
      {
        assetPath,
        reason,
        token: token ? this.hashToken(token) : undefined,
        referer: document.referrer,
        url: window.location.href
      },
      'high',
      'AssetProtectionService'
    );
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    activity: string,
    details: Record<string, any> = {}
  ): string {
    return this.logEvent(
      'suspicious_activity',
      {
        activity,
        ...details,
        url: window.location.href,
        timestamp: Date.now()
      },
      'medium',
      'SecurityMonitor'
    );
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(
    endpoint: string,
    attempts: number,
    timeWindow: number
  ): string {
    return this.logEvent(
      'rate_limit_exceeded',
      {
        endpoint,
        attempts,
        timeWindow,
        clientIP: 'hidden', // Client-side can't get real IP
        url: window.location.href
      },
      'medium',
      'RateLimiter'
    );
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const batch: EventBatch = {
      events: [...this.eventQueue],
      batchId: this.generateBatchId(),
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.eventQueue = [];

    try {
      await this.sendBatch(batch);
      console.log(`📊 Security events flushed: ${batch.events.length} events`);
    } catch (error) {
      console.error('Failed to flush security events:', error);
      this.retryQueue.push(batch);
      this.scheduleRetry();
    }
  }

  /**
   * Send event batch to server
   */
  private async sendBatch(batch: EventBatch): Promise<void> {
    if (!this.config.endpoint) {
      // Store locally if no endpoint configured
      this.storeLocally(batch);
      return;
    }

    const payload = this.config.encryptionEnabled 
      ? this.encryptBatch(batch)
      : batch;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Store events locally when offline
   */
  private storeLocally(batch: EventBatch): void {
    try {
      const stored = localStorage.getItem(this.config.localStorageKey);
      const existingBatches: EventBatch[] = stored ? JSON.parse(stored) : [];
      
      existingBatches.push(batch);
      
      // Keep only last 100 batches to prevent storage overflow
      if (existingBatches.length > 100) {
        existingBatches.splice(0, existingBatches.length - 100);
      }
      
      localStorage.setItem(
        this.config.localStorageKey,
        JSON.stringify(existingBatches)
      );
    } catch (error) {
      console.error('Failed to store events locally:', error);
    }
  }

  /**
   * Load pending events from local storage
   */
  private loadPendingEvents(): void {
    try {
      const stored = localStorage.getItem(this.config.localStorageKey);
      if (stored) {
        const batches: EventBatch[] = JSON.parse(stored);
        this.retryQueue.push(...batches);
        
        // Clear local storage
        localStorage.removeItem(this.config.localStorageKey);
        
        // Schedule retry for pending events
        if (this.retryQueue.length > 0) {
          this.scheduleRetry();
        }
      }
    } catch (error) {
      console.error('Failed to load pending events:', error);
    }
  }

  /**
   * Schedule retry for failed batches
   */
  private scheduleRetry(): void {
    setTimeout(async () => {
      const batch = this.retryQueue.shift();
      if (batch) {
        try {
          await this.sendBatch(batch);
          console.log(`🔄 Retried security event batch: ${batch.batchId}`);
        } catch (error) {
          console.error('Retry failed for batch:', batch.batchId, error);
          
          // Re-queue if retries remaining
          if (batch.events[0] && !batch.events[0].details.retryCount) {
            batch.events.forEach(event => {
              event.details.retryCount = 1;
            });
            this.retryQueue.push(batch);
          }
        }
        
        // Continue processing retry queue
        if (this.retryQueue.length > 0) {
          this.scheduleRetry();
        }
      }
    }, this.config.retryDelay);
  }

  /**
   * Setup event listeners for automatic logging
   */
  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page unload - flush remaining events
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliability during unload
      this.flushBeforeUnload();
    });

    // Console access detection
    this.setupConsoleMonitoring();

    // Error monitoring
    window.addEventListener('error', (event) => {
      this.logEvent(
        'script_injection_attempt',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        },
        'medium',
        'ErrorHandler'
      );
    });

    // Performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Setup console access monitoring
   */
  private setupConsoleMonitoring(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      this.logEvent(
        'console_access',
        { method: 'log', args: args.slice(0, 3) }, // Limit logged args
        'low',
        'ConsoleMonitor'
      );
      return originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      this.logEvent(
        'console_access',
        { method: 'warn', args: args.slice(0, 3) },
        'low',
        'ConsoleMonitor'
      );
      return originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.logEvent(
        'console_access',
        { method: 'error', args: args.slice(0, 3) },
        'medium',
        'ConsoleMonitor'
      );
      return originalError.apply(console, args);
    };
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Tasks longer than 100ms
              this.logEvent(
                'performance_anomaly',
                {
                  type: 'long_task',
                  duration: entry.duration,
                  startTime: entry.startTime
                },
                'low',
                'PerformanceMonitor'
              );
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  /**
   * Flush events before page unload
   */
  private flushBeforeUnload(): void {
    if (this.eventQueue.length === 0) return;

    const batch: EventBatch = {
      events: [...this.eventQueue],
      batchId: this.generateBatchId(),
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    if (this.config.endpoint && navigator.sendBeacon) {
      const payload = JSON.stringify(batch);
      navigator.sendBeacon(this.config.endpoint, payload);
    } else {
      this.storeLocally(batch);
    }

    this.eventQueue = [];
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate browser fingerprint
   */
  private generateFingerprint(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    };

    this.fingerprint = btoa(JSON.stringify(fingerprint)).substr(0, 32);
  }

  /**
   * Hash token for privacy
   */
  private hashToken(token: string): string {
    // Simple hash for client-side (use crypto.subtle in production)
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Encrypt batch (placeholder - implement with actual encryption)
   */
  private encryptBatch(batch: EventBatch): any {
    // In production, use Web Crypto API for encryption
    return {
      encrypted: true,
      data: btoa(JSON.stringify(batch)),
      algorithm: 'base64' // Placeholder
    };
  }

  /**
   * Get logger statistics
   */
  getStats(): {
    sessionId: string;
    queueSize: number;
    totalLogged: number;
    retryQueueSize: number;
    isOnline: boolean;
  } {
    return {
      sessionId: this.sessionId,
      queueSize: this.eventQueue.length,
      totalLogged: 0, // Would track in production
      retryQueueSize: this.retryQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityEventLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flush(); // Final flush
    this.eventQueue = [];
    this.retryQueue = [];
  }
}

// Singleton instance for global access
let globalLogger: SecurityEventLogger | null = null;

export function getSecurityEventLogger(): SecurityEventLogger {
  if (!globalLogger) {
    globalLogger = new SecurityEventLogger();
  }
  return globalLogger;
}

export function logSecurityEvent(
  type: SecurityEventType,
  details: Record<string, any> = {},
  severity: SecurityEvent['severity'] = 'medium',
  source: string = 'unknown'
): string {
  const logger = getSecurityEventLogger();
  return logger.logEvent(type, details, severity, source);
}

export default SecurityEventLogger;
