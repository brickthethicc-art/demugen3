// Test script to verify if removing overflow-hidden fixes the issue
console.log('=== TESTING OVERFLOW-HIDDEN FIX ===');

function testOverflowFix() {
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    console.log('=== TESTING OVERFLOW-HIDDEN REMOVAL ===');
    
    const canvasRect = canvas.getBoundingClientRect();
    const CELL_SIZE = 32;
    
    console.log('Canvas rect:', canvasRect);
    console.log('Cell size:', CELL_SIZE);
    
    // Check if overflow-hidden was removed
    const canvasContainer = canvas.parentElement;
    const containerStyles = window.getComputedStyle(canvasContainer);
    
    console.log('Container overflow settings:', {
      overflow: containerStyles.overflow,
      overflowX: containerStyles.overflowX,
      overflowY: containerStyles.overflowY,
      className: canvasContainer.className
    });
    
    // Test interaction on top 4 rows
    console.log('Testing top 4 rows interaction...');
    
    let hoverCount = 0;
    let clickCount = 0;
    const capturedEvents = [];
    
    const mouseMoveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);
      
      capturedEvents.push({
        type: 'mousemove',
        timestamp: Date.now(),
        client: { x: e.clientX, y: e.clientY },
        canvas: { x, y },
        grid: { x: gridX, y: gridY }
      });
      
      // Count top 4 rows hovers
      if (gridY >= 0 && gridY < 4) {
        hoverCount++;
        if (hoverCount <= 10) { // Limit console output
          console.log(`TOP ROW HOVER #${hoverCount}:`, {
            client: { x: e.clientX, y: e.clientY },
            canvas: { x, y },
            grid: { x: gridX, y: gridY }
          });
        }
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
      
      // Count top 4 rows clicks
      if (gridY >= 0 && gridY < 4) {
        clickCount++;
        console.log(`TOP ROW CLICK #${clickCount}:`, {
          client: { x: e.clientX, y: e.clientY },
          canvas: { x, y },
          grid: { x: gridX, y: gridY }
        });
      }
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    
    // Add visual indicators for top 4 rows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 23; col += 3) {
        const screenX = canvasRect.left + (col * CELL_SIZE + CELL_SIZE / 2);
        const screenY = canvasRect.top + (row * CELL_SIZE + CELL_SIZE / 2);
        
        const marker = document.createElement('div');
        marker.style.cssText = `
          position: fixed;
          left: ${screenX - 4}px;
          top: ${screenY - 4}px;
          width: 8px;
          height: 8px;
          background: cyan;
          z-index: 9999;
          pointer-events: none;
          border: 1px solid blue;
          border-radius: 50%;
        `;
        marker.title = `Row ${row}, Col ${col}`;
        document.body.appendChild(marker);
      }
    }
    
    console.log('Added cyan markers for top 4 rows');
    console.log('OVERFLOW-HIDDEN REMOVED - Try hovering over cyan markers');
    console.log('If you see hover events in console, the fix worked!');
    
    // Auto-check after 5 seconds
    setTimeout(() => {
      const topRowEvents = capturedEvents.filter(e => 
        e.type === 'mousemove' && e.grid.y >= 0 && e.grid.y < 4
      );
      
      console.log('\n=== RESULTS SUMMARY ===');
      console.log(`Top 4 rows hover events captured: ${topRowEvents.length}`);
      console.log(`Total hover events: ${capturedEvents.filter(e => e.type === 'mousemove').length}`);
      console.log(`Top 4 rows clicks: ${clickCount}`);
      
      if (topRowEvents.length > 0) {
        console.log('SUCCESS: Top 4 rows are now interactive!');
        console.log('The overflow-hidden was the root cause.');
      } else {
        console.log('ISSUE: Top 4 rows still not interactive');
        console.log('The problem is something else - need further investigation.');
      }
    }, 5000);
    
    return {
      cleanup: () => {
        canvas.removeEventListener('mousemove', mouseMoveHandler);
        canvas.removeEventListener('mousedown', mouseDownHandler);
        document.querySelectorAll('[style*="background: cyan"]').forEach(el => el.remove());
        console.log(`Test complete. Captured ${capturedEvents.length} total events`);
        console.log(`Top 4 rows hover events: ${capturedEvents.filter(e => e.type === 'mousemove' && e.grid.y >= 0 && e.grid.y < 4).length}`);
        return capturedEvents;
      }
    };
  }, 2000);
}

// Run the test
const testResult = testOverflowFix();

// Make cleanup available
window.cleanupOverflowTest = () => {
  if (testResult && testResult.cleanup) {
    return testResult.cleanup();
  }
  return [];
};

console.log('Overflow fix test loaded. Use window.cleanupOverflowTest() to see results.');
