// Deep debugging script to identify the actual grid interaction issue
console.log('=== DEEP GRID INTERACTION DEBUG ===');

// Step 1: Find and analyze the canvas element
function analyzeCanvas() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return null;
  }
  
  const canvasRect = canvas.getBoundingClientRect();
  const canvasStyles = window.getComputedStyle(canvas);
  
  console.log('=== CANVAS ANALYSIS ===');
  console.log('Canvas element:', canvas);
  console.log('Canvas dimensions:', {
    width: canvas.width,
    height: canvas.height,
    clientWidth: canvas.clientWidth,
    clientHeight: canvas.clientHeight
  });
  console.log('Canvas rect:', canvasRect);
  console.log('Canvas styles:', {
    position: canvasStyles.position,
    transform: canvasStyles.transform,
    transformOrigin: canvasStyles.transformOrigin,
    pointerEvents: canvasStyles.pointerEvents,
    zIndex: canvasStyles.zIndex
  });
  
  return { canvas, canvasRect, canvasStyles };
}

// Step 2: Analyze container hierarchy
function analyzeContainers(canvas) {
  console.log('\n=== CONTAINER HIERARCHY ANALYSIS ===');
  
  let element = canvas.parentElement;
  let depth = 0;
  
  while (element && depth < 10) {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    console.log(`Depth ${depth}:`, {
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
}

// Step 3: Test coordinate mapping with actual events
function testCoordinateMapping(canvas, canvasRect) {
  console.log('\n=== COORDINATE MAPPING TEST ===');
  
  const CELL_SIZE = 32;
  const testPoints = [];
  
  // Test top 4 rows, multiple columns
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 23; col += 5) { // Test every 5th column
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
        screenY,
        inCanvas: gameX >= 0 && gameX < canvas.width && gameY >= 0 && gameY < canvas.height,
        inViewport: screenY >= window.scrollY && screenY <= window.scrollY + window.innerHeight
      });
    }
  }
  
  console.log('Test points:', testPoints);
  
  // Add visual markers for debugging
  testPoints.forEach((point, index) => {
    const marker = document.createElement('div');
    marker.style.cssText = `
      position: fixed;
      left: ${point.screenX}px;
      top: ${point.screenY}px;
      width: 4px;
      height: 4px;
      background: red;
      z-index: 9999;
      pointer-events: none;
    `;
    marker.id = `debug-marker-${index}`;
    document.body.appendChild(marker);
  });
  
  return testPoints;
}

// Step 4: Test actual interaction events
function testInteractionEvents(canvas, canvasRect) {
  console.log('\n=== INTERACTION EVENT TEST ===');
  
  const CELL_SIZE = 32;
  let eventCount = 0;
  
  // Add event listeners to track events
  const mouseDownHandler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    console.log(`MouseDown ${++eventCount}:`, {
      client: { x: e.clientX, y: e.clientY },
      canvas: { x, y },
      grid: { x: gridX, y: gridY },
      target: e.target.tagName
    });
  };
  
  const mouseMoveHandler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    // Only log top 4 rows
    if (gridY >= 0 && gridY < 4) {
      console.log(`MouseMove Top Row:`, {
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
    }
  };
  
  canvas.addEventListener('mousedown', mouseDownHandler);
  canvas.addEventListener('mousemove', mouseMoveHandler);
  
  // Simulate clicks on top 4 rows
  setTimeout(() => {
    console.log('Simulating clicks on top 4 rows...');
    
    let eventIndex = 0;
    const simulateEvent = () => {
      if (eventIndex >= 4 * 5) return; // 4 rows × 5 columns
      
      const row = Math.floor(eventIndex / 5);
      const col = 5 + (eventIndex % 5);
      
      const gameX = col * CELL_SIZE + CELL_SIZE / 2;
      const gameY = row * CELL_SIZE + CELL_SIZE / 2;
      const screenX = canvasRect.left + gameX;
      const screenY = canvasRect.top + gameY;
      
      const event = new MouseEvent('mousedown', {
        clientX: screenX,
        clientY: screenY,
        bubbles: true
      });
      
      canvas.dispatchEvent(event);
      eventIndex++;
      
      // Small delay between events
      setTimeout(simulateEvent, 100);
    };
    
    simulateEvent();
  }, 1000);
  
  return { mouseDownHandler, mouseMoveHandler };
}

// Step 5: Check for overlapping elements
function checkOverlappingElements(canvasRect) {
  console.log('\n=== OVERLAPPING ELEMENTS CHECK ===');
  
  const topArea = {
    left: canvasRect.left,
    top: canvasRect.top,
    right: canvasRect.right,
    bottom: canvasRect.top + (4 * 32)
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
        position: styles.position,
        display: styles.display,
        visibility: styles.visibility
      });
    }
  });
  
  console.log('Overlapping elements:', overlappingElements);
  return overlappingElements;
}

// Run all debugging steps
function runFullDebug() {
  const canvasAnalysis = analyzeCanvas();
  if (!canvasAnalysis) return;
  
  const { canvas, canvasRect, canvasStyles } = canvasAnalysis;
  
  analyzeContainers(canvas);
  const testPoints = testCoordinateMapping(canvas, canvasRect);
  const eventHandlers = testInteractionEvents(canvas, canvasRect);
  const overlappingElements = checkOverlappingElements(canvasRect);
  
  console.log('\n=== DEBUG SUMMARY ===');
  console.log('Canvas found:', !!canvas);
  console.log('Test points created:', testPoints.length);
  console.log('Overlapping elements found:', overlappingElements.length);
  console.log('Event handlers attached:', !!eventHandlers);
  
  return {
    canvas,
    testPoints,
    overlappingElements,
    cleanup: () => {
      // Remove debug markers
      document.querySelectorAll('[id^="debug-marker"]').forEach(el => el.remove());
      // Remove event listeners
      canvas.removeEventListener('mousedown', eventHandlers.mouseDownHandler);
      canvas.removeEventListener('mousemove', eventHandlers.mouseMoveHandler);
    }
  };
}

// Auto-run debug
const debugResult = runFullDebug();

// Make cleanup available globally
window.cleanupDebug = debugResult.cleanup;

console.log('Debug complete. Use window.cleanupDebug() to remove markers.');
