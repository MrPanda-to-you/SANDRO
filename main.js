(async function () {
  // Phase 3: Asset Security Integration
  // Initialize asset protection before loading any assets
  let assetSecurity = null;
  
  // Import asset security (with fallback for development)
  try {
    const { getAssetSecurity } = await import('./src/security/AssetSecurityIntegration.js');
    assetSecurity = getAssetSecurity();
    console.log('🔐 Asset security initialized');
  } catch (error) {
    console.warn('Asset security not available:', error.message);
  }

  // Phase 4: Advanced Monitoring Integration
  // Initialize security monitoring system
  let securityMonitor = null;
  
  try {
    const { getSecurityMonitor } = await import('./src/security/SecurityMonitor.js');
    securityMonitor = getSecurityMonitor();
    console.log('🛡️ Security monitoring initialized');
  } catch (error) {
    console.warn('Security monitoring not available:', error.message);
  }

  // Wait for DOM to be ready
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

  // Initialize asset security if available
  if (assetSecurity) {
    try {
      await assetSecurity.initialize();
      console.log('✅ Asset protection active');
    } catch (error) {
      console.warn('Asset protection initialization failed:', error);
    }
  }

  // Initialize security monitoring if available
  if (securityMonitor) {
    try {
      securityMonitor.startMonitoring();
      console.log('✅ Security monitoring active');
    } catch (error) {
      console.warn('Security monitoring initialization failed:', error);
    }
  }

  // Wait for UnicornStudio global to be available
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
    // Protect scene file path if asset security is available
    let sceneFilePath = "./sandro-clinic-glass.json";
    
    if (assetSecurity) {
      try {
        sceneFilePath = await assetSecurity.protectAsset(sceneFilePath);
        console.log('🔒 Scene file protected');
      } catch (error) {
        console.warn('Scene protection failed, using original path:', error);
      }
    }

    // Add the scene using the correct UnicornStudio API with full viewport settings
    const scene = await window.UnicornStudio.addScene({
      elementId: "unicorn-root", // Container element
      fps: 60, // Smooth animation
      scale: 1, // Full scale for maximum quality
      dpi: window.devicePixelRatio || 1.5, // Auto-detect device pixel ratio
      filePath: sceneFilePath, // Protected scene file
      lazyLoad: false, // Load immediately for better UX
      altText: "Sandro Clinic Interactive Scene", // SEO optimization
      ariaLabel: "Interactive Sandro Clinic experience with glass effects", // Accessibility
      production: false, // Development mode
      fixed: false, // Let scene be responsive, not fixed
      interactivity: {
        mouse: {
          disableMobile: false, // Keep mouse interaction on mobile/touch
          disabled: false // Enable all interactions
        }
      }
    });

    console.log('UnicornStudio scene loaded successfully:', scene);

    // Enable UnicornStudio protection if available
    if (assetSecurity && scene) {
      try {
        await assetSecurity.loadProtectedModel(sceneFilePath, { scene });
        console.log('🛡️ UnicornStudio protection enabled');
      } catch (error) {
        console.warn('UnicornStudio protection failed:', error);
      }
    }

    // Add responsive resize handler for optimal scaling
    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (scene && scene.resize) {
          scene.resize(); // UnicornStudio's built-in responsive resize
          
          // Force canvas to fill viewport after resize
          const canvas = document.querySelector('#unicorn-root canvas');
          if (canvas) {
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.objectFit = 'cover';
          }
          
          console.log('Scene resized for viewport:', window.innerWidth, 'x', window.innerHeight);
        }
      }, 150); // Debounce resize events
    }

    // Listen for viewport changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 300); // Delay for orientation change completion
    });

    // Optional: Listen for visibility changes to pause/resume scene
    document.addEventListener('visibilitychange', () => {
      if (scene) {
        if (document.hidden) {
          scene.paused = true; // Pause when tab is hidden (performance)
        } else {
          scene.paused = false; // Resume when tab is visible
        }
      }
    });

    // Expose scene globally for debugging (remove in production)
    window.sandroScene = scene;

  } catch (error) {
    console.error('Error loading UnicornStudio scene:', error);
    const container = document.getElementById('unicorn-root');
    if (container) {
      container.innerHTML = `
        <div class="error-container">
          <h2>Scene Loading Error</h2>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please check your network connection and try refreshing the page.</p>
          <p><small>Viewport: ${window.innerWidth} × ${window.innerHeight}</small></p>
        </div>
      `;
    }
  }
})();
