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
    // Phase 2: Advanced obfuscation features
    stringArrayEncoding: string[];
    stringArrayRotate: boolean;
    stringArrayShuffle: boolean;
    splitStrings: boolean;
    splitStringsChunkLength: number;
    unicodeEscapeSequence: boolean;
    selfDefending: boolean;
    transformObjectKeys: boolean;
    reservedNames: string[];
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
      // Phase 2: Development settings (minimal obfuscation)
      stringArrayEncoding: [],
      stringArrayRotate: false,
      stringArrayShuffle: false,
      splitStrings: false,
      splitStringsChunkLength: 10,
      unicodeEscapeSequence: false,
      selfDefending: false,
      transformObjectKeys: false,
      reservedNames: ['UnicornStudio', 'console', 'window', 'document'],
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
      // Phase 2: Staging settings (moderate obfuscation)
      stringArrayEncoding: ['base64'],
      stringArrayRotate: true,
      stringArrayShuffle: true,
      splitStrings: true,
      splitStringsChunkLength: 8,
      unicodeEscapeSequence: false,
      selfDefending: true,
      transformObjectKeys: true,
      reservedNames: ['UnicornStudio'],
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
      controlFlowFlatteningThreshold: 1.0, // Maximum control flow obfuscation
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.8, // Increased dead code injection
      debugProtection: true,
      debugProtectionInterval: 1000,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal' as const,
      renameGlobals: true, // Enable global variable renaming
      sourceMap: false,
      stringArray: true,
      stringArrayThreshold: 1.0, // Maximum string obfuscation
      // Phase 2: Production settings (maximum obfuscation)
      stringArrayEncoding: ['rc4'],
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayIndexShift: true,
      stringArrayWrappersCount: 5,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function' as const,
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 1.0,
      splitStrings: true,
      splitStringsChunkLength: 2, // Even smaller chunks for maximum obfuscation
      unicodeEscapeSequence: true,
      selfDefending: true,
      transformObjectKeys: true,
      numbersToExpressions: true,
      numbersToExpressionsThreshold: 1.0,
      simplify: true,
      reservedNames: [], // No reserved names in production
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
