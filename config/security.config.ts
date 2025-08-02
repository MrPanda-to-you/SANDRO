// Security configuration for different environments
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
    urlExpiration: number; // minutes
  };
  monitoring: {
    devToolsDetection: boolean;
    integrityVerification: boolean;
    securityLogging: boolean;
  };
}

// Environment-specific configurations
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
      urlExpiration: 60, // 1 hour for development
    },
    monitoring: {
      devToolsDetection: false,
      integrityVerification: false,
      securityLogging: false,
    },
  } as SecurityConfig,

  staging: {
    obfuscation: {
      enabled: true,
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      debugProtection: false, // Disable for easier debugging in staging
      debugProtectionInterval: 0,
      disableConsoleOutput: false, // Keep some logging for staging
      identifierNamesGenerator: 'hexadecimal' as const,
      renameGlobals: false,
      sourceMap: false,
      stringArray: true,
      stringArrayThreshold: 0.5,
    },
    bundling: {
      randomizeFileNames: true,
      stripConsole: false, // Keep some console output for staging
      removeComments: true,
      mangleProps: true,
      sourceMaps: false,
    },
    assetProtection: {
      enabled: true,
      signedUrls: true,
      urlExpiration: 30, // 30 minutes
    },
    monitoring: {
      devToolsDetection: true,
      integrityVerification: true,
      securityLogging: true,
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
      urlExpiration: 15, // 15 minutes maximum
    },
    monitoring: {
      devToolsDetection: true,
      integrityVerification: true,
      securityLogging: true,
    },
  } as SecurityConfig,
};

// Get configuration for current environment
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return securityConfig.production;
    case 'staging':
      return securityConfig.staging;
    case 'development':
    default:
      return securityConfig.development;
  }
}

// Environment detection utilities
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}
