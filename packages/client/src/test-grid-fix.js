// Simple test to verify grid interaction fix
console.log('=== GRID INTERACTION FIX TEST ===');

// Test the top 4 rows interaction
function testGridInteraction() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found - waiting for game to load...');
    setTimeout(testGridInteraction, 1000);
    return;
  }
  
  const canvasRect = canvas.getBoundingClientRect();
  const CELL_SIZE = 32;
  
  console.log('Canvas found:', canvasRect);
  console.log('Testing top 4 rows interaction...');
  
  // Test clicks on top 4 rows
  let testCount = 0;
  const maxTests = 12; // 4 rows × 3 columns
  
  for (let row = 0; row < 4; row++) {
    for (let col = 5; col < 15; col += 3) {
      setTimeout(() => {
        const screenX = canvasRect.left + (col * CELL_SIZE + CELL_SIZE / 2);
        const screenY = canvasRect.top + (row * CELL_SIZE + CELL_SIZE / 2);
        
        console.log(`Testing click on row ${row}, col ${col} at (${screenX}, ${screenY})`);
        
        // Create and dispatch click event
        const clickEvent = new MouseEvent('mousedown', {
          clientX: screenX,
          clientY: screenY,
          bubbles: true
        });
        
        canvas.dispatchEvent(clickEvent);
        
        testCount++;
        if (testCount === maxTests) {
          console.log('Grid interaction test complete!');
          console.log('If you see unit selections or hover effects, the fix is working.');
        }
      }, testCount * 200);
    }
  }
}

// Start the test
setTimeout(testGridInteraction, 2000);

console.log('Grid interaction test will start in 2 seconds...');
