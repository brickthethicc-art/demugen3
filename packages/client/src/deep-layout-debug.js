// Deep layout debugging to find the real issue
console.log('=== DEEP LAYOUT DEBUG ===');

function debugLayoutIssue() {
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    console.log('=== DEEP LAYOUT ANALYSIS ===');
    
    // Step 1: Check the actual visual position vs calculated position
    const canvasRect = canvas.getBoundingClientRect();
    const canvasStyles = window.getComputedStyle(canvas);
    
    console.log('Canvas visual analysis:', {
      rect: canvasRect,
      position: canvasStyles.position,
      transform: canvasStyles.transform,
      transformOrigin: canvasStyles.transformOrigin,
      left: canvasStyles.left,
      top: canvasStyles.top,
      marginLeft: canvasStyles.marginLeft,
      marginTop: canvasStyles.marginTop
    });
    
    // Step 2: Check if canvas is actually visible and not obscured
    const computedStyle = window.getComputedStyle(canvas);
    console.log('Canvas visibility:', {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      pointerEvents: computedStyle.pointerEvents
    });
    
    // Step 3: Check parent container hierarchy for issues
    console.log('\n=== PARENT CONTAINER ANALYSIS ===');
    let element = canvas.parentElement;
    let depth = 0;
    
    while (element && depth < 10) {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      console.log(`Parent ${depth}:`, {
        element: element.tagName + (element.className ? '.' + element.className : ''),
        id: element.id,
        rect: rect,
        position: styles.position,
        transform: styles.transform,
        overflow: styles.overflow,
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
        pointerEvents: styles.pointerEvents,
        zIndex: styles.zIndex,
        clip: styles.clip,
        clipPath: styles.clipPath
      });
      
      element = element.parentElement;
      depth++;
    }
    
    // Step 4: Check for elements covering the top area
    console.log('\n=== TOP AREA COVERAGE ANALYSIS ===');
    
    const topArea = {
      left: canvasRect.left,
      top: canvasRect.top,
      right: canvasRect.right,
      bottom: canvasRect.top + (4 * 32)
    };
    
    const allElements = document.querySelectorAll('*');
    const coveringElements = [];
    
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      if (rect.left < topArea.right && rect.right > topArea.left &&
          rect.top < topArea.bottom && rect.bottom > topArea.top) {
        
        const styles = window.getComputedStyle(el);
        
        // Check if element could block interaction
        const couldBlock = (
          styles.position !== 'static' ||
          styles.zIndex !== 'auto' ||
          styles.pointerEvents === 'none' ||
          parseInt(styles.zIndex) > 0
        );
        
        if (couldBlock) {
          coveringElements.push({
            element: el,
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            rect: rect,
            zIndex: styles.zIndex,
            pointerEvents: styles.pointerEvents,
            position: styles.position,
            opacity: styles.opacity
          });
        }
      }
    });
    
    console.log('Elements potentially covering top 4 rows:', coveringElements.length);
    coveringElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}${el.className ? '.' + el.className : ''}`, {
        rect: el.rect,
        zIndex: el.zIndex,
        pointerEvents: el.pointerEvents,
        position: el.position
      });
    });
    
    // Step 5: Test by temporarily disabling potential blockers
    console.log('\n=== TESTING BY DISABLING BLOCKERS ===');
    
    const testResults = [];
    
    coveringElements.forEach((el, index) => {
      const originalPointerEvents = el.element.style.pointerEvents;
      const originalZIndex = el.element.style.zIndex;
      
      // Temporarily disable the element
      el.element.style.pointerEvents = 'none';
      el.element.style.zIndex = '-1';
      
      console.log(`Disabled element ${index + 1}: ${el.tagName}${el.className ? '.' + el.className : ''}`);
      
      testResults.push({
        element: el.element,
        originalPointerEvents,
        originalZIndex,
        index
      });
    });
    
    // Step 6: Add visual overlay to show actual interactive area
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      left: ${canvasRect.left}px;
      top: ${canvasRect.top}px;
      width: ${canvasRect.width}px;
      height: ${canvasRect.height}px;
      border: 2px solid red;
      pointer-events: none;
      z-index: 10000;
      background: rgba(255, 0, 0, 0.1);
    `;
    document.body.appendChild(overlay);
    
    // Highlight top 4 rows specifically
    const topOverlay = document.createElement('div');
    topOverlay.style.cssText = `
      position: fixed;
      left: ${canvasRect.left}px;
      top: ${canvasRect.top}px;
      width: ${canvasRect.width}px;
      height: ${4 * 32}px;
      border: 2px solid yellow;
      pointer-events: none;
      z-index: 10001;
      background: rgba(255, 255, 0, 0.2);
    `;
    document.body.appendChild(topOverlay);
    
    console.log('Added visual overlays - red border = full canvas, yellow border = top 4 rows');
    console.log('Try hovering over the yellow area to test interaction');
    
    // Return cleanup function
    return {
      cleanup: () => {
        // Restore all disabled elements
        testResults.forEach(result => {
          result.element.style.pointerEvents = result.originalPointerEvents;
          result.element.style.zIndex = result.originalZIndex;
        });
        
        // Remove overlays
        overlay.remove();
        topOverlay.remove();
        
        console.log('Layout debug complete - restored all elements');
      },
      coveringElements,
      testResults
    };
  }, 2000);
}

// Run the debug
const debugResult = debugLayoutIssue();

// Make cleanup available
window.cleanupLayoutDebug = () => {
  if (debugResult && debugResult.cleanup) {
    debugResult.cleanup();
  }
};

console.log('Layout debug loaded. Use window.cleanupLayoutDebug() to restore elements.');
