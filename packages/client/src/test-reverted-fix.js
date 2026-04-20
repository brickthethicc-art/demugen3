// Test script to verify the reverted coordinate mapping fix
console.log('=== TESTING REVERTED COORDINATE FIX ===');

function testRevertedFix() {
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    console.log('=== TESTING REVERTED COORDINATE MAPPING ===');
    
    const canvasRect = canvas.getBoundingClientRect();
    const CELL_SIZE = 32;
    
    console.log('Canvas rect:', canvasRect);
    console.log('Cell size:', CELL_SIZE);
    
    // Test the top 4 rows specifically
    console.log('Testing top 4 rows interaction...');
    
    let eventCount = 0;
    const capturedEvents = [];
    
    const mouseMoveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate grid coordinates using reverted method
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);
      
      capturedEvents.push({
        type: 'mousemove',
        timestamp: Date.now(),
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
      
      // Log top 4 rows events
      if (gridY >= 0 && gridY < 4) {
        console.log(`TOP ROW HOVER (reverted method):`, {
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
      
      console.log(`CLICK (reverted method):`, {
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    
    // Add visual markers for top 4 rows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 23; col += 4) {
        const screenX = canvasRect.left + (col * CELL_SIZE + CELL_SIZE / 2);
        const screenY = canvasRect.top + (row * CELL_SIZE + CELL_SIZE / 2);
        
        const marker = document.createElement('div');
        marker.style.cssText = `
          position: fixed;
          left: ${screenX - 3}px;
          top: ${screenY - 3}px;
          width: 6px;
          height: 6px;
          background: lime;
          z-index: 9999;
          pointer-events: none;
          border: 1px solid black;
        `;
        marker.title = `Row ${row}, Col ${point?.col || col}`;
        document.body.appendChild(marker);
      }
    }
    
    console.log('Added green markers for top 4 rows');
    console.log('Try hovering over the green markers to test interaction');
    
    return {
      cleanup: () => {
        canvas.removeEventListener('mousemove', mouseMoveHandler);
        canvas.removeEventListener('mousedown', mouseDownHandler);
        document.querySelectorAll('[style*="background: lime"]').forEach(el => el.remove());
        console.log(`Captured ${capturedEvents.length} events with reverted method`);
        return capturedEvents;
      }
    };
  }, 2000);
}

// Run the test
const testResult = testRevertedFix();

// Make cleanup available
window.cleanupRevertedTest = () => {
  if (testResult && testResult.cleanup) {
    return testResult.cleanup();
  }
  return [];
};

console.log('Reverted fix test loaded. Use window.cleanupRevertedTest() to see results.');
