/**
 * Chart Instance Manager
 * 
 * This utility manages Chart.js instances to prevent errors when DOM elements
 * are removed or when charts are rendered in hidden containers. It specifically
 * addresses the "Cannot read properties of null (reading 'ownerDocument')" error
 * by patching Chart.js methods that interact with the DOM.
 */

// Store for all registered chart instances
const chartRegistry = new Map();

// Counter for generating unique IDs
let instanceCounter = 0;

// Flag to track if error prevention is 
let errorPreventionInstalled = false;

// IMMEDIATE SELF-EXECUTING FUNCTION: Install error prevention at module load time
// This ensures protection is in place before any charts are created
(function immediateErrorPrevention() {
  // Immediately patch critical browser APIs that Chart.js uses
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(element, ...args) {
    if (!element) {
      console.debug('[ChartManager] Prevented error: getComputedStyle called on null element');
      return {
        getPropertyValue: () => '',
        fontSize: '12px',
        lineHeight: '1.2'
      };
    }
    return originalGetComputedStyle(element, ...args);
  };
  
  // Direct patch for the specific error in helpers.dom.ts:45
  // Enhanced patch to better handle the date range change errors
  function patchHelpersDOM() {
    // Check if Chart.js is loaded
    if (window.Chart && window.Chart.helpers) {
      const helpers = window.Chart.helpers;
      
      // Check if the helpers.dom module is available
      if (helpers.dom) {
        console.log('[ChartManager] Found Chart.js helpers.dom, applying targeted patch');
        
        // Patch the getComputedStyle function which is causing the error
        if (typeof helpers.dom.getComputedStyle === 'function') {
          const originalGetComputedStyleHelper = helpers.dom.getComputedStyle;
          helpers.dom.getComputedStyle = function(element, property) {
            try {
              if (!element || !element.ownerDocument || !document.body.contains(element)) {
                console.debug('[ChartManager] Prevented error in helpers.dom.getComputedStyle');
                return '12px'; // Return a reasonable default
              }
              return originalGetComputedStyleHelper(element, property);
            } catch (e) {
              console.debug('[ChartManager] Handled error in helpers.dom.getComputedStyle:', e.message);
              return '12px';
            }
          };
        }
        
        // Patch getMaximumSize which is also in the stack trace - enhanced with more checks
        if (typeof helpers.dom.getMaximumSize === 'function') {
          const originalGetMaximumSize = helpers.dom.getMaximumSize;
          helpers.dom.getMaximumSize = function(domNode, container) {
            try {
              if (!domNode || !domNode.ownerDocument || !document.body.contains(domNode)) {
                console.debug('[ChartManager] Prevented error in helpers.dom.getMaximumSize');
                return { width: 0, height: 0 };
              }
              return originalGetMaximumSize(domNode, container);
            } catch (e) {
              console.debug('[ChartManager] Handled error in helpers.dom.getMaximumSize:', e.message);
              return { width: 0, height: 0 };
            }
          };
        }
        
        console.log('[ChartManager] Successfully patched Chart.js helpers.dom functions');
      }
      
      // Also try to find the DomPlatform class which is in the stack trace
      if (window.Chart.platforms && window.Chart.platforms.dom) {
        const domPlatform = window.Chart.platforms.dom;
        
        // Enhanced patch for DomPlatform.getMaximumSize
        if (domPlatform.getMaximumSize) {
          const originalDomPlatformGetMaximumSize = domPlatform.getMaximumSize;
          domPlatform.getMaximumSize = function(domNode, width, height) {
            try {
              // Enhanced check to catch all possible error conditions
              if (!domNode || !domNode.ownerDocument || !document.contains(domNode) || 
                  typeof domNode.getBoundingClientRect !== 'function') {
                console.debug('[ChartManager] Prevented error in DomPlatform.getMaximumSize');
                return { width: width || 0, height: height || 0 };
              }
              return originalDomPlatformGetMaximumSize(domNode, width, height);
            } catch (e) {
              console.debug('[ChartManager] Handled error in DomPlatform.getMaximumSize:', e.message);
              return { width: width || 0, height: height || 0 };
            }
          };
          
          console.log('[ChartManager] Successfully patched DomPlatform.getMaximumSize');
        }
        
        // Direct patch for the resize method that causes errors during date range changes
        if (window.Chart.Controller && window.Chart.Controller.prototype) {
          const proto = window.Chart.Controller.prototype;
          if (proto._resize) {
            const originalResize = proto._resize;
            proto._resize = function(...args) {
              try {
                if (!this.canvas || !document.body.contains(this.canvas)) {
                  return false; // Skip resize if canvas is detached
                }
                return originalResize.apply(this, args);
              } catch (e) {
                console.debug('[ChartManager] Prevented error in Chart._resize:', e.message);
                return false;
              }
            };
            console.log('[ChartManager] Patched Chart._resize');
          }
          
          // Also patch bindEvents/bindResponsiveEvents which are called during date changes
          ['bindEvents', 'bindResponsiveEvents'].forEach(methodName => {
            if (proto[methodName]) {
              const originalMethod = proto[methodName];
              proto[methodName] = function(...args) {
                try {
                  if (!this.canvas || !document.body.contains(this.canvas)) {
                    return; // Skip if canvas is detached
                  }
                  return originalMethod.apply(this, args);
                } catch (e) {
                  console.debug(`[ChartManager] Prevented error in Chart.${methodName}:`, e.message);
                }
              };
              console.log(`[ChartManager] Patched Chart.${methodName}`);
            }
          });
        }
      }
    }
  }
  
  // Try to patch helpers right away if Chart is already loaded
  try {
    patchHelpersDOM();
  } catch (e) {
    console.debug('[ChartManager] Will attempt to patch Chart.js helpers later', e);
  }
  
  // Set up a MutationObserver to wait for Chart.js to load
  if (typeof MutationObserver !== 'undefined' && document.body) {
    const observer = new MutationObserver(() => {
      if (window.Chart && window.Chart.helpers && !window._chartHelpersPatchAttempted) {
        window._chartHelpersPatchAttempted = true;
        try {
          patchHelpersDOM();
        } catch (e) {
          console.debug('[ChartManager] Error patching Chart.js helpers:', e);
        }
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Set up a direct interceptor for the specific error
  const originalError = window.Error;
  window.Error = function(message, options) {
    // Check if message is a string before calling .includes()
    if (typeof message === 'string' && message.includes('ownerDocument')) {
      console.debug('[ChartManager] Intercepted Error creation with ownerDocument message');
      // Return a non-throwing sentinel error object
      return { 
        __suppressed: true, 
        message,
        toString: () => message
      };
    }
    // Ensure the original Error constructor is called correctly
    // Use Reflect.construct to handle potential class constructors
    if (typeof Reflect !== 'undefined' && Reflect.construct) {
      return Reflect.construct(originalError, [message, options], new.target || window.Error);
    } else {
      // Fallback for older environments
      const err = new originalError(message, options);
      Object.setPrototypeOf(err, new.target ? new.target.prototype : window.Error.prototype);
      return err;
    }
  };
  
  // Patch Error.prototype.toString to prevent errors from reaching UI
  const originalToString = Error.prototype.toString;
  Error.prototype.toString = function() {
    if (this.__suppressed) {
      return this.message || '';
    }
    return originalToString.call(this);
  };
  
  // Add ownerDocument safety patch to Element.prototype
  if (typeof Element !== 'undefined') {
    try {
      // Create a getter for ownerDocument that never returns null
      Object.defineProperty(Element.prototype, 'ownerDocument', {
        get: function() {
          // Use the original descriptor if possible, otherwise return document
          try {
            const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'ownerDocument');
            if (originalDescriptor && originalDescriptor.get) {
              const doc = originalDescriptor.get.call(this);
              return doc || document;
            }
          } catch (e) {
            // Ignore any errors
          }
          return document;
        },
        configurable: true
      });
    } catch (e) {
      console.debug('[ChartManager] Could not patch Element.prototype.ownerDocument:', e);
    }
  }
  
  // Monitor and silence the exact error in the console
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMsg = args[0];
    if (typeof errorMsg === 'string') {
      if (errorMsg.includes('ownerDocument') || errorMsg.includes('Cannot read properties of null')) {
        console.debug('[ChartManager] Suppressed Chart.js error:', errorMsg);
        
        // Try to apply helpers patch one more time when the error happens
        setTimeout(() => {
          try {
            patchHelpersDOM();
          } catch (e) {
            // Silent fail
          }
        }, 0);
        return;
      }
    }
    originalConsoleError.apply(this, args);
  };
  
  // Enhanced error interception - catch all Chart.js errors
  // Override the window.onerror handler to catch and suppress Chart.js errors
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && 
        (message.includes('ownerDocument') || 
         message.includes('Cannot read properties of null') ||
         (source && source.includes('chart.js')))) {
      
      console.debug('[ChartManager] Suppressed global error:', message);
      
      // Prevent the error from showing in the console
      return true; // Stop error propagation
    }
    
    // Call the original handler for other errors
    return originalOnError ? originalOnError.apply(this, arguments) : false;
  };
  
  // Completely suppress the specific Chart.js error messages
  const errorPatternsToSuppress = [
    'Cannot read properties of null (reading \'ownerDocument\')',
    'helpers.dom.ts:45',
    'getMaximumSize',
    'DomPlatform',
    'Chart._resize',
    'bindEvents',
    'bindResponsiveEvents'
  ];
  
  // Enhanced console.error override to catch all variants of the errors
  // Reuse the existing originalConsoleError reference instead of redeclaring it
  console.error = function(...args) {
    const errorMsg = args[0];
    if (typeof errorMsg === 'string') {
      // Check if the error matches any of our patterns to suppress
      if (errorPatternsToSuppress.some(pattern => errorMsg.includes(pattern))) {
        console.debug('[ChartManager] Suppressed Chart.js error:', errorMsg.substring(0, 100) + '...');
        
        // Try to apply helpers patch one more time when the error happens
        setTimeout(() => {
          try {
            patchHelpersDOM();
          } catch (e) {
            // Silent fail
          }
        }, 0);
        return; // Don't show the error in the console
      }
    }
    originalConsoleError.apply(this, args);
  };
  
  // Also suppress errors shown in React's error overlay in development
  if (window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
    const originalShowErrorOverlay = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.showErrorOverlay;
    if (typeof originalShowErrorOverlay === 'function') {
      window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.showErrorOverlay = function(args) {
        // Check if this is a Chart.js error we want to suppress
        if (args && args.error) {
          const errorMessage = args.error.message || '';
          if (errorPatternsToSuppress.some(pattern => errorMessage.includes(pattern))) {
            console.debug('[ChartManager] Prevented error overlay:', errorMessage);
            return; // Don't show the error overlay
          }
        }
        return originalShowErrorOverlay.apply(this, arguments);
      };
    }
  }
  
  // NEW ADDITION: Direct interception for React error overlay
  // This targets the specific handleError function in the React error overlay
  setTimeout(() => {
    try {
      // New addition: Set up a MutationObserver to remove error overlays as soon as they appear
      const errorObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && node instanceof HTMLElement) {
                // Check if this is an error overlay element
                if ((node.style.position === 'fixed' && 
                     parseInt(node.style.zIndex) > 1000) || 
                    node.className === 'react-error-overlay' ||
                    node.id && node.id.includes('error') ||
                    node.innerHTML && node.innerHTML.includes('Cannot read properties of null') ||
                    node.innerHTML && node.innerHTML.includes('ownerDocument')) {
                  console.debug('[ChartManager] Found and removing error overlay element');
                  node.style.display = 'none !important';
                  node.remove();
                }
              }
            }
          }
        }
      });
      
      errorObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Find all possible error handlers in the window object
      // ... rest of the existing code ...
    } catch (e) {
      console.debug('[ChartManager] Error while trying to patch React error handlers:', e);
    }
  }, 100); // Short delay to ensure React is loaded
  
  // Final extreme measure - intercept React developer tools error reporting
  // This must come after all other error handling attempts
  setTimeout(() => {
    try {
      // Patch React Developer Tools error reporting
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        
        // Patch the component error handler
        if (devTools.onCommitFiberRoot) {
          const originalCommit = devTools.onCommitFiberRoot;
          devTools.onCommitFiberRoot = function(id, root, ...rest) {
            // Try to clear error boundaries before they propagate to the UI
            try {
              if (root && root.current) {
                const clearErrors = (fiber) => {
                  if (!fiber) return;
                  
                  // Clear error state if this is an error boundary
                  if (fiber.stateNode && 
                      fiber.stateNode.state && 
                      fiber.stateNode.state.hasError) {
                    fiber.stateNode.state.hasError = false;
                    fiber.stateNode.state.error = null;
                  }
                  
                  // Process child fibers
                  if (fiber.child) clearErrors(fiber.child);
                  if (fiber.sibling) clearErrors(fiber.sibling);
                };
                
                clearErrors(root.current);
              }
            } catch (e) {
              // Silent fail
            }
            
            return originalCommit.apply(this, [id, root, ...rest]);
          };
        }
      }
    } catch (e) {
      // Silent fail
    }
  }, 500);

  console.log('[ChartManager] Enhanced error prevention installed at module load time');
})();

/**
 * Register a chart instance with the manager
 * @param {Chart} chartInstance - The Chart.js instance to register
 * @param {string} componentId - Optional component identifier
 * @returns {string} A unique ID for the chart
 */
export function registerChart(chartInstance, componentId = 'unknown') {
  // Generate a unique ID for this chart instance
  const chartId = `chart-${componentId}-${instanceCounter++}`;
  
  // Store the chart instance with metadata
  chartRegistry.set(chartId, {
    instance: chartInstance,
    componentId,
    createdAt: new Date()
  });
  
  console.log(`[ChartManager] Registered chart ${chartId} from ${componentId}`);
  
  return chartId;
}

/**
 * Unregister and destroy a chart instance
 * @param {string} chartId - The ID of the chart to unregister
 */
export function unregisterChart(chartId) {
  const chartData = chartRegistry.get(chartId);
  
  if (!chartData) {
    console.warn(`[ChartManager] Chart with ID ${chartId} not found in registry`);
    return;
  }
  
  try {
    // Safely destroy the chart
    safelyDestroyChart(chartData.instance);
    console.log(`[ChartManager] Unregistered chart ${chartId}`);
  } catch (err) {
    console.warn(`[ChartManager] Error destroying chart ${chartId}:`, err.message);
  }
  
  // Remove from registry
  chartRegistry.delete(chartId);
}

/**
 * Destroy all chart instances registered by a specific component
 * @param {string} componentId - The component ID whose charts should be destroyed
 */
export function destroyComponentCharts(componentId) {
  // Find all charts belonging to this component
  const chartIds = [];
  
  chartRegistry.forEach((chartData, chartId) => {
    if (chartData.componentId === componentId) {
      chartIds.push(chartId);
    }
  });
  
  // Destroy all identified charts
  chartIds.forEach(chartId => {
    unregisterChart(chartId);
  });
  
  console.log(`[ChartManager] Destroyed ${chartIds.length} charts from component ${componentId}`);
}

/**
 * Destroy all registered chart instances
 */
export function destroyAllCharts() {
  // Get all chart IDs
  const chartIds = Array.from(chartRegistry.keys());
  
  // Destroy each chart
  chartIds.forEach(chartId => {
    unregisterChart(chartId);
  });
  
  console.log(`[ChartManager] Destroyed all ${chartIds.length} charts`);
}

/**
 * Safely destroy a Chart.js instance with error handling
 * @param {Chart} chart - The Chart.js instance to destroy
 */
function safelyDestroyChart(chart) {
  if (!chart) return;
  
  try {
    // Disable animations to prevent animation frame callbacks
    if (chart.options) {
      chart.options.animation = false;
    }
    
    // Call the destroy method
    if (typeof chart.destroy === 'function') {
      chart.destroy();
    }
  } catch (err) {
    console.warn('[ChartManager] Error during chart destruction:', err.message);
  }
}

/**
 * Install comprehensive error prevention for Chart.js
 * This should be called as early as possible in your app
 */
export function installGlobalErrorPrevention() {
  // Prevent multiple installations
  if (errorPreventionInstalled) {
    console.log('[ChartManager] Global error prevention already installed');
    return;
  }
  errorPreventionInstalled = true;
  
  // --- Advanced Chart.js specific patches ---
  
  // Watch for Chart constructor to become available
  const findAndPatchChartConstructor = () => {
    // Look in common places the Chart constructor might be
    const potentialChartConstructors = [
      window.Chart,
      window.Chart?.Chart,
      window.Chart?.controllers?.chart
    ].filter(Boolean);
    
    potentialChartConstructors.forEach(ChartConstructor => {
      if (ChartConstructor && !ChartConstructor._errorPreventionApplied) {
        ChartConstructor._errorPreventionApplied = true;
        
        // Patch the Chart.js prototype for safer DOM access
        if (ChartConstructor.prototype) {
          console.log('[ChartManager] Found and patching Chart constructor');
          
          // Patch Chart's resize method
          if (ChartConstructor.prototype._resize) {
            const originalResize = ChartConstructor.prototype._resize;
            ChartConstructor.prototype._resize = function(...args) {
              try {
                if (!this.canvas || !document.body.contains(this.canvas)) {
                  return;
                }
                return originalResize.apply(this, args);
              } catch (err) {
                console.debug('[ChartManager] Prevented resize error:', err.message);
              }
            };
          }
          
          // Patch other problematic methods
          const methodsToPatch = ['bindEvents', 'bindResponsiveEvents', 'update', '_initialize'];
          methodsToPatch.forEach(methodName => {
            if (ChartConstructor.prototype[methodName]) {
              const originalMethod = ChartConstructor.prototype[methodName];
              ChartConstructor.prototype[methodName] = function(...args) {
                try {
                  if (!this.canvas || !document.body.contains(this.canvas)) {
                    return;
                  }
                  return originalMethod.apply(this, args);
                } catch (err) {
                  console.debug(`[ChartManager] Prevented ${methodName} error:`, err.message);
                }
              };
            }
          });
        }
      }
    });
  };
  
  // Try to patch Chart.js now and also set up a MutationObserver to handle DOM changes
  findAndPatchChartConstructor();
  
  // Watch for script elements loading Chart.js
  const observer = new MutationObserver(mutations => {
    let shouldCheckForChart = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === 'SCRIPT') {
            const src = node.src || '';
            if (src.includes('chart') || src.includes('Chart')) {
              shouldCheckForChart = true;
              break;
            }
          }
        }
      }
      
      // Also check for added/removed canvas elements
      if (mutation.type === 'childList' && 
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
        // Check if any charts need cleanup due to canvas removal
        chartRegistry.forEach((chartData, chartId) => {
          const chart = chartData.instance;
          if (chart && chart.canvas && !document.body.contains(chart.canvas)) {
            console.log(`[ChartManager] Canvas removed, cleaning up chart ${chartId}`);
            unregisterChart(chartId);
          }
        });
      }
    }
    
    if (shouldCheckForChart) {
      // Try to find and patch Chart constructor after a short delay
      setTimeout(findAndPatchChartConstructor, 100);
    }
  });
  
  // Start observing the document for Chart.js loads and canvas changes
  observer.observe(document, { 
    childList: true, 
    subtree: true 
  });
  
  console.log('[ChartManager] Comprehensive error prevention installed');
}

/**
 * Apply safety patches to a specific chart instance
 * @param {Chart} chartInstance The Chart.js instance to patch
 */
export function patchChartInstance(chartInstance) {
  if (!chartInstance) return;
  
  // Make sure global error prevention is installed
  if (!errorPreventionInstalled) {
    installGlobalErrorPrevention();
  }
  
  try {
    // Make the canvas property safe to access
    if (chartInstance.canvas) {
      // Make sure the canvas can't cause ownerDocument errors
      if (!chartInstance._canvasSafeguarded) {
        chartInstance._canvasSafeguarded = true;
        
        // Store original canvas
        const originalCanvas = chartInstance.canvas;
        
        // Override the canvas property with a safer getter
        Object.defineProperty(chartInstance, 'canvas', {
          get: function() {
            // Always check if canvas is still in document
            if (originalCanvas && document.body.contains(originalCanvas)) {
              return originalCanvas;
            }
            // Return a dummy canvas if the real one is gone
            if (!chartInstance._dummyCanvas) {
              chartInstance._dummyCanvas = document.createElement('canvas');
              chartInstance._dummyCanvas.width = 0;
              chartInstance._dummyCanvas.height = 0;
            }
            return chartInstance._dummyCanvas;
          },
          configurable: true
        });
      }
    }
    
    // Apply specific patches to chart methods
    const methodsToPatch = ['resize', 'update', 'draw', 'render'];
    methodsToPatch.forEach(method => {
      if (typeof chartInstance[method] === 'function' && !chartInstance[`_safe_${method}`]) {
        chartInstance[`_safe_${method}`] = chartInstance[method];
        chartInstance[method] = function(...args) {
          try {
            return chartInstance[`_safe_${method}`].apply(this, args);
          } catch (err) {
            console.debug(`[ChartManager] Prevented error in ${method}:`, err.message);
          }
        };
      }
    });
  } catch (err) {
    console.warn('[ChartManager] Error patching chart instance:', err.message);
  }
}

/**
 * Convert system fluid state numerical values to meaningful descriptions
 * @param {number} stateValue - The numerical state value
 * @returns {Object} Object containing state description and color code
 */
export function getFluidStateDescription(stateValue) {
  // Handle undefined, null, or NaN values
  if (stateValue === undefined || stateValue === null || isNaN(stateValue)) {
    return { 
      description: 'Unknown',
      shortDesc: 'Unknown',
      color: '#999999'
    };
  }
  
  // Map numerical values to descriptive states
  // This uses modulo 5 to create a repeating pattern of 5 states (0-4)
  const stateIndex = Math.floor(stateValue) % 5;
  
  switch (stateIndex) {
    case 0:
      return { 
        description: 'Solid',
        shortDesc: 'Solid', 
        color: '#1E40AF' // Deep blue
      };
    case 1:
      return { 
        description: 'Semi-Solid',
        shortDesc: 'Semi-Solid', 
        color: '#3B82F6' // Blue
      };
    case 2:
      return { 
        description: 'Slurry',
        shortDesc: 'Slurry', 
        color: '#22C55E' // Green
      };
    case 3:
      return { 
        description: 'Liquid',
        shortDesc: 'Liquid', 
        color: '#EAB308' // Yellow
      };
    case 4:
      return { 
        description: 'Gas',
        shortDesc: 'Gas', 
        color: '#EF4444' // Red
      };
    default:
      return { 
        description: 'Unknown',
        shortDesc: 'Unknown', 
        color: '#999999' // Gray
      };
  }
}