import { defineConfig } from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator';
import { getSecurityConfig } from './config/security.config';

export default defineConfig(({ mode }) => {
  const securityConfig = getSecurityConfig();
  const isProduction = mode === 'production';
  
  return {
    // Input configuration
    build: {
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          // Randomize file names in production
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
      // Minification settings
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
      // Source maps
      sourcemap: securityConfig.bundling.sourceMaps,
      // Chunk size optimization
      chunkSizeWarningLimit: 1000,
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: true
    },
    
    // Plugins
    plugins: [
      // Apply obfuscation only when enabled
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
            // Additional security options
            selfDefending: true,
            splitStrings: true,
            splitStringsChunkLength: 5,
            unicodeEscapeSequence: false
          }
        })
      ] : [])
    ],
    
    // Define global constants
    define: {
      __DEV__: !isProduction,
      __PROD__: isProduction,
      __SECURITY_ENABLED__: securityConfig.obfuscation.enabled
    },
    
    // Environment variables
    envPrefix: 'VITE_'
  };
});
