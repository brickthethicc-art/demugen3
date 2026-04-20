// Comprehensive debugging script for grid interaction issue
console.log('=== COMPREHENSIVE GRID INTERACTION DEBUG ===');

function debugGridInteraction() {
  console.log('Starting comprehensive grid interaction debug...');
  
  // Wait for game to load
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas not found - game may not be loaded yet');
      return;
    }
    
    console.log('Canvas found:', canvas);
    
    // Step 1: Analyze canvas and container
    const canvasRect = canvas.getBoundingClientRect();
    const canvasContainer = canvas.parentElement;
    const gameBoard = canvasContainer?.parentElement;
    
    console.log('\n=== STEP 1: CANVAS ANALYSIS ===');
    console.log('Canvas rect:', canvasRect);
    console.log('Canvas dimensions:', {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight
    });
    
    if (canvasContainer) {
      const containerRect = canvasContainer.getBoundingClientRect();
      const containerStyles = window.getComputedStyle(canvasContainer);
      console.log('Canvas container:', {
        rect: containerRect,
        overflow: containerStyles.overflow,
        position: containerStyles.position,
        transform: containerStyles.transform,
        pointerEvents: containerStyles.pointerEvents
      });
    }
    
    if (gameBoard) {
      const boardRect = gameBoard.getBoundingClientRect();
      const boardStyles = window.getComputedStyle(gameBoard);
      console.log('Game board container:', {
        rect: boardRect,
        overflow: boardStyles.overflow,
        position: boardStyles.position,
        transform: boardStyles.transform,
        className: gameBoard.className
      });
    }
    
    // Step 2: Test coordinate mapping with real events
    console.log('\n=== STEP 2: COORDINATE MAPPING TEST ===');
    
    const CELL_SIZE = 32;
    const testPoints = [];
    
    // Test points for top 4 rows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 23; col += 4) {
        const gameX = col * CELL_SIZE + CELL_SIZE / 2;
        const gameY = row * CELL_SIZE + CELL_SIZE / 2;
        const screenX = canvasRect.left + gameX;
        const screenY = canvasRect.top + gameY;
        
        testPoints.push({
          row,
          col,
          gameX,
          gameY,
          screenX,
          screenY
        });
      }
    }
    
    console.log('Test points for top 4 rows:', testPoints);
    
    // Step 3: Add event listeners to capture actual mouse events
    console.log('\n=== STEP 3: MOUSE EVENT CAPTURE ===');
    
    let eventCount = 0;
    const capturedEvents = [];
    
    const mouseMoveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate grid coordinates using current method
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);
      
      capturedEvents.push({
        type: 'mousemove',
        timestamp: Date.now(),
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
      
      // Only log top 4 rows
      if (gridY >= 0 && gridY < 4) {
        console.log(`TOP ROW MOUSEMOVE:`, {
          client: { x: e.clientX, y: e.clientY },
          canvas: { x, y },
          grid: { x: gridX, y: gridY }
        });
      }
    };
    
    const mouseDownHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);
      
      capturedEvents.push({
        type: 'mousedown',
        timestamp: Date.now(),
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
      
      console.log(`MOUSEDOWN:`, {
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    
    // Step 4: Check for overlapping elements
    console.log('\n=== STEP 4: OVERLAPPING ELEMENTS CHECK ===');
    
    const topArea = {
      left: canvasRect.left,
      top: canvasRect.top,
      right: canvasRect.right,
      bottom: canvasRect.top + (4 * CELL_SIZE)
    };
    
    const allElements = document.querySelectorAll('*');
    const overlappingElements = [];
    
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      if (rect.left < topArea.right && rect.right > topArea.left &&
          rect.top < topArea.bottom && rect.bottom > topArea.top) {
        
        const styles = window.getComputedStyle(el);
        overlappingElements.push({
          element: el,
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          rect: rect,
          zIndex: styles.zIndex,
          pointerEvents: styles.pointerEvents,
          position: styles.position
        });
      }
    });
    
    console.log('Elements overlapping top 4 rows:', overlappingElements.length);
    overlappingElements.forEach((el, i) => {
      if (i < 5) { // Show first 5
        console.log(`  ${i + 1}. ${el.tagName}${el.className ? '.' + el.className : ''}`, {
          rect: el.rect,
          zIndex: el.zIndex,
          pointerEvents: el.pointerEvents
        });
      }
    });
    
    // Step 5: Visual testing
    console.log('\n=== STEP 5: VISUAL TESTING ===');
    
    // Add visual markers for test points
    testPoints.forEach((point, index) => {
      const marker = document.createElement('div');
      marker.style.cssText = `
        position: fixed;
        left: ${point.screenX - 2}px;
        top: ${point.screenY - 2}px;
        width: 4px;
        height: 4px;
        background: red;
        z-index: 9999;
        pointer-events: none;
        border: 1px solid white;
      `;
      marker.id = `debug-marker-${index}`;
      marker.title = `Row ${point.row}, Col ${point.col}`;
      document.body.appendChild(marker);
    });
    
    console.log(`Added ${testPoints.length} visual markers for top 4 rows`);
    console.log('Try hovering over the red markers to test interaction');
    
    // Return cleanup function
    return {
      cleanup: () => {
        canvas.removeEventListener('mousemove', mouseMoveHandler);
        canvas.removeEventListener('mousedown', mouseDownHandler);
        document.querySelectorAll('[id^="debug-marker"]').forEach(el => el.remove());
        console.log(`Captured ${capturedEvents.length} events`);
        return capturedEvents;
      },
      testPoints,
      overlappingElements
    };
  }, 2000);
}

// Auto-run debug
const debugResult = debugGridInteraction();

// Make cleanup available globally
window.cleanupGridDebug = () => {
  if (debugResult && typeof debugResult.cleanup === 'function') {
    return debugResult.cleanup();
  }
  return [];
};

console.log('Grid debug script loaded. Use window.cleanupGridDebug() to see captured events.');
