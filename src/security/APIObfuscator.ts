/**
 * Phase 4: Advanced Monitoring - API Endpoint Obfuscation
 * Obscures API endpoints and response data to prevent easy discovery
 */

export interface APIObfuscationConfig {
  enabled: boolean;
  obfuscateEndpoints: boolean;
  obfuscateFields: boolean;
  rotationInterval: number; // minutes
  encryptResponses: boolean;
  rateLimitEnabled: boolean;
  corsRestrictions: boolean;
}

export interface EndpointMapping {
  original: string;
  obfuscated: string;
  method: string;
  created: number;
  expires: number;
}

export interface FieldMapping {
  original: string;
  obfuscated: string;
  created: number;
}

export interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
}

export class APIObfuscator {
  private config: APIObfuscationConfig;
  private endpointMappings: Map<string, EndpointMapping> = new Map();
  private fieldMappings: Map<string, FieldMapping> = new Map();
  private reverseEndpointMappings: Map<string, string> = new Map();
  private reverseFieldMappings: Map<string, string> = new Map();
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private rotationTimer?: number;

  constructor(config: Partial<APIObfuscationConfig> = {}) {
    this.config = {
      enabled: true,
      obfuscateEndpoints: true,
      obfuscateFields: true,
      rotationInterval: 60, // 1 hour
      encryptResponses: false,
      rateLimitEnabled: true,
      corsRestrictions: true,
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize the obfuscation system
   */
  private initialize(): void {
    this.setupEndpointMappings();
    this.setupFieldMappings();
    this.interceptFetchRequests();
    this.startRotationTimer();
    
    console.log('🔀 API obfuscation initialized');
  }

  /**
   * Setup endpoint obfuscation mappings
   */
  private setupEndpointMappings(): void {
    const commonEndpoints = [
      { path: '/api/auth/login', method: 'POST' },
      { path: '/api/auth/logout', method: 'POST' },
      { path: '/api/user/profile', method: 'GET' },
      { path: '/api/user/settings', method: 'GET' },
      { path: '/api/data/analytics', method: 'POST' },
      { path: '/api/assets/scene', method: 'GET' },
      { path: '/api/security/events', method: 'POST' },
      { path: '/api/performance/metrics', method: 'POST' }
    ];

    for (const endpoint of commonEndpoints) {
      this.createEndpointMapping(endpoint.path, endpoint.method);
    }
  }

  /**
   * Setup field obfuscation mappings
   */
  private setupFieldMappings(): void {
    const commonFields = [
      'username', 'password', 'email', 'userId', 'sessionId',
      'accessToken', 'refreshToken', 'apiKey', 'userData',
      'profile', 'settings', 'preferences', 'analytics',
      'performance', 'security', 'events', 'logs'
    ];

    for (const field of commonFields) {
      this.createFieldMapping(field);
    }
  }

  /**
   * Create endpoint mapping
   */
  private createEndpointMapping(originalPath: string, method: string): string {
    const obfuscated = this.generateObfuscatedPath();
    const now = Date.now();
    const expires = now + (this.config.rotationInterval * 60 * 1000);

    const mapping: EndpointMapping = {
      original: originalPath,
      obfuscated,
      method,
      created: now,
      expires
    };

    this.endpointMappings.set(originalPath, mapping);
    this.reverseEndpointMappings.set(obfuscated, originalPath);

    return obfuscated;
  }

  /**
   * Create field mapping
   */
  private createFieldMapping(originalField: string): string {
    const obfuscated = this.generateObfuscatedField();
    const now = Date.now();

    const mapping: FieldMapping = {
      original: originalField,
      obfuscated,
      created: now
    };

    this.fieldMappings.set(originalField, mapping);
    this.reverseFieldMappings.set(obfuscated, originalField);

    return obfuscated;
  }

  /**
   * Generate obfuscated endpoint path
   */
  private generateObfuscatedPath(): string {
    const segments = [
      this.generateRandomString(4),
      this.generateRandomString(6),
      this.generateRandomString(5)
    ];
    return `/${segments.join('/')}`;
  }

  /**
   * Generate obfuscated field name
   */
  private generateObfuscatedField(): string {
    const prefixes = ['x', 'z', 'q', 'w'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return prefix + this.generateRandomString(7);
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Intercept fetch requests for obfuscation
   */
  private interceptFetchRequests(): void {
    const originalFetch = window.fetch;
    const obfuscator = this;

    window.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      try {
        // Apply obfuscation to request
        const { url, options } = obfuscator.obfuscateRequest(input, init);
        
        // Apply rate limiting
        if (obfuscator.config.rateLimitEnabled) {
          obfuscator.checkRateLimit(url);
        }

        // Make request with obfuscated URL
        const response = await originalFetch(url, options);

        // Deobfuscate response if needed
        if (response.ok && obfuscator.config.obfuscateFields) {
          return obfuscator.deobfuscateResponse(response);
        }

        return response;

      } catch (error) {
        console.error('API obfuscation error:', error);
        throw error;
      }
    };
  }

  /**
   * Obfuscate outgoing request
   */
  private obfuscateRequest(
    input: RequestInfo | URL,
    init?: RequestInit
  ): { url: string; options: RequestInit } {
    let url = typeof input === 'string' ? input : input.toString();
    let options = { ...init };

    // Obfuscate endpoint if configured
    if (this.config.obfuscateEndpoints) {
      url = this.obfuscateURL(url);
    }

    // Obfuscate request body fields
    if (this.config.obfuscateFields && options.body) {
      options.body = this.obfuscateRequestBody(options.body);
    }

    // Add CORS restrictions
    if (this.config.corsRestrictions) {
      options.headers = {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-API-Version': '1.0'
      };
    }

    return { url, options };
  }

  /**
   * Obfuscate URL path
   */
  private obfuscateURL(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const mapping = this.endpointMappings.get(urlObj.pathname);
      
      if (mapping && mapping.expires > Date.now()) {
        urlObj.pathname = mapping.obfuscated;
        return urlObj.toString();
      }
      
      // Create new mapping if not exists or expired
      if (urlObj.pathname.startsWith('/api/')) {
        const obfuscated = this.createEndpointMapping(urlObj.pathname, 'GET');
        urlObj.pathname = obfuscated;
        return urlObj.toString();
      }

    } catch (error) {
      console.warn('URL obfuscation failed:', error);
    }

    return url;
  }

  /**
   * Obfuscate request body
   */
  private obfuscateRequestBody(body: BodyInit): BodyInit {
    if (typeof body !== 'string') {
      return body;
    }

    try {
      const data = JSON.parse(body);
      const obfuscated = this.obfuscateObject(data);
      return JSON.stringify(obfuscated);
    } catch (error) {
      return body;
    }
  }

  /**
   * Obfuscate object fields
   */
  private obfuscateObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.obfuscateObject(item));
    }

    const obfuscated: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const mapping = this.fieldMappings.get(key);
      const obfuscatedKey = mapping ? mapping.obfuscated : key;
      obfuscated[obfuscatedKey] = this.obfuscateObject(value);
    }

    return obfuscated;
  }

  /**
   * Deobfuscate response
   */
  private async deobfuscateResponse(response: Response): Promise<Response> {
    try {
      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON, return as-is
        return new Response(text, response);
      }

      const deobfuscated = this.deobfuscateObject(data);
      
      return new Response(JSON.stringify(deobfuscated), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      console.warn('Response deobfuscation failed:', error);
      return response;
    }
  }

  /**
   * Deobfuscate object fields
   */
  private deobfuscateObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deobfuscateObject(item));
    }

    const deobfuscated: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const originalKey = this.reverseFieldMappings.get(key) || key;
      deobfuscated[originalKey] = this.deobfuscateObject(value);
    }

    return deobfuscated;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(url: string): void {
    const clientId = this.getClientId();
    const key = `${clientId}:${url}`;
    const now = Date.now();
    const windowSize = 60000; // 1 minute window
    const maxRequests = 100; // 100 requests per minute

    let entry = this.rateLimitStore.get(key);
    
    if (!entry) {
      entry = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
        blocked: false
      };
      this.rateLimitStore.set(key, entry);
      return;
    }

    // Reset window if expired
    if (now - entry.firstRequest > windowSize) {
      entry.count = 1;
      entry.firstRequest = now;
      entry.lastRequest = now;
      entry.blocked = false;
      return;
    }

    entry.count++;
    entry.lastRequest = now;

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      entry.blocked = true;
      throw new Error(`Rate limit exceeded for ${url}`);
    }
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientId(): string {
    // Simple client ID based on session storage
    let clientId = sessionStorage.getItem('client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  /**
   * Start rotation timer for mappings
   */
  private startRotationTimer(): void {
    this.rotationTimer = window.setInterval(() => {
      this.rotateMappings();
    }, this.config.rotationInterval * 60 * 1000);
  }

  /**
   * Rotate expired mappings
   */
  private rotateMappings(): void {
    const now = Date.now();
    let rotatedCount = 0;

    // Rotate endpoint mappings
    for (const [original, mapping] of this.endpointMappings.entries()) {
      if (mapping.expires <= now) {
        // Remove old mapping
        this.reverseEndpointMappings.delete(mapping.obfuscated);
        
        // Create new mapping
        const newObfuscated = this.createEndpointMapping(original, mapping.method);
        rotatedCount++;
        
        console.log(`🔄 Rotated endpoint: ${original} -> ${newObfuscated}`);
      }
    }

    // Clean up old rate limit entries
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now - entry.lastRequest > 3600000) { // 1 hour old
        this.rateLimitStore.delete(key);
      }
    }

    if (rotatedCount > 0) {
      console.log(`🔄 Rotated ${rotatedCount} API mappings`);
    }
  }

  /**
   * Get obfuscated endpoint for original path
   */
  getObfuscatedEndpoint(originalPath: string): string | null {
    const mapping = this.endpointMappings.get(originalPath);
    return mapping && mapping.expires > Date.now() ? mapping.obfuscated : null;
  }

  /**
   * Get original endpoint for obfuscated path
   */
  getOriginalEndpoint(obfuscatedPath: string): string | null {
    return this.reverseEndpointMappings.get(obfuscatedPath) || null;
  }

  /**
   * Get obfuscated field name
   */
  getObfuscatedField(originalField: string): string | null {
    const mapping = this.fieldMappings.get(originalField);
    return mapping ? mapping.obfuscated : null;
  }

  /**
   * Get original field name
   */
  getOriginalField(obfuscatedField: string): string | null {
    return this.reverseFieldMappings.get(obfuscatedField) || null;
  }

  /**
   * Add custom endpoint mapping
   */
  addEndpoint(originalPath: string, method: string = 'GET'): string {
    return this.createEndpointMapping(originalPath, method);
  }

  /**
   * Add custom field mapping
   */
  addField(originalField: string): string {
    return this.createFieldMapping(originalField);
  }

  /**
   * Get statistics
   */
  getStats(): {
    endpointMappings: number;
    fieldMappings: number;
    rateLimitEntries: number;
    activeBlocks: number;
  } {
    const activeBlocks = Array.from(this.rateLimitStore.values())
      .filter(entry => entry.blocked).length;

    return {
      endpointMappings: this.endpointMappings.size,
      fieldMappings: this.fieldMappings.size,
      rateLimitEntries: this.rateLimitStore.size,
      activeBlocks
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<APIObfuscationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    this.endpointMappings.clear();
    this.fieldMappings.clear();
    this.reverseEndpointMappings.clear();
    this.reverseFieldMappings.clear();
    this.rateLimitStore.clear();
  }
}

// Singleton instance for global access
let globalObfuscator: APIObfuscator | null = null;

export function getAPIObfuscator(): APIObfuscator {
  if (!globalObfuscator) {
    globalObfuscator = new APIObfuscator();
  }
  return globalObfuscator;
}

export function startAPIObfuscation(config?: Partial<APIObfuscationConfig>): void {
  const obfuscator = getAPIObfuscator();
  if (config) {
    obfuscator.updateConfig(config);
  }
}

export default APIObfuscator;
