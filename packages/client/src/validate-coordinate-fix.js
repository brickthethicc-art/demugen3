// Validation script to test the coordinate mapping fix
console.log('=== COORDINATE FIX VALIDATION ===');

function validateCoordinateFix() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  
  // Get the game and scene
  const game = canvas.game;
  const scene = game?.scene.getScene('GameScene');
  
  if (!scene) {
    console.error('GameScene not found');
    return;
  }
  
  const canvasRect = canvas.getBoundingClientRect();
  const CELL_SIZE = 32;
  
  console.log('=== VALIDATING COORDINATE MAPPING ===');
  console.log('Canvas rect:', canvasRect);
  console.log('Cell size:', CELL_SIZE);
  
  // Test coordinate mapping for all rows
  const testResults = [];
  
  for (let row = 0; row < 23; row++) {
    for (let col = 0; col < 23; col += 6) { // Test every 6th column
      // Calculate screen coordinates
      const screenX = canvasRect.left + (col * CELL_SIZE + CELL_SIZE / 2);
      const screenY = canvasRect.top + (row * CELL_SIZE + CELL_SIZE / 2);
      
      // Simulate pointer event
      const mockPointer = {
        x: screenX - canvasRect.left,
        y: screenY - canvasRect.top,
        worldX: undefined,
        worldY: undefined
      };
      
      // Apply the same coordinate transformation as the fix
      const worldPoint = scene.cameras.main.getWorldPoint(mockPointer.x, mockPointer.y);
      const gridX = Math.floor(worldPoint.x / CELL_SIZE);
      const gridY = Math.floor(worldPoint.y / CELL_SIZE);
      
      const isCorrect = gridX === col && gridY === row;
      
      testResults.push({
        expected: { row, col },
        calculated: { gridX, gridY },
        screenCoords: { x: screenX, y: screenY },
        isCorrect
      });
      
      // Log errors for top 4 rows specifically
      if (row < 4 && !isCorrect) {
        console.error(`Coordinate mapping error - Row ${row}, Col ${col}:`, {
          expected: { row, col },
          calculated: { gridX, gridY },
          worldPoint
        });
      }
    }
  }
  
  // Summary
  const correctMappings = testResults.filter(r => r.isCorrect).length;
  const totalMappings = testResults.length;
  const accuracy = (correctMappings / totalMappings * 100).toFixed(1);
  
  console.log('=== VALIDATION RESULTS ===');
  console.log(`Coordinate mapping accuracy: ${accuracy}% (${correctMappings}/${totalMappings})`);
  
  // Test top 4 rows specifically
  const top4Results = testResults.filter(r => r.expected.row < 4);
  const top4Correct = top4Results.filter(r => r.isCorrect).length;
  const top4Accuracy = (top4Correct / top4Results.length * 100).toFixed(1);
  
  console.log(`Top 4 rows accuracy: ${top4Accuracy}% (${top4Correct}/${top4Results.length})`);
  
  if (top4Accuracy === '100.0') {
    console.log('SUCCESS: All top 4 rows have correct coordinate mapping!');
  } else {
    console.error('ISSUE: Top 4 rows still have coordinate mapping problems');
  }
  
  return {
    overallAccuracy: accuracy,
    top4Accuracy: top4Accuracy,
    testResults
  };
}

// Test actual interaction
function testActualInteraction() {
  console.log('\n=== TESTING ACTUAL INTERACTION ===');
  
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  const canvasRect = canvas.getBoundingClientRect();
  const CELL_SIZE = 32;
  
  // Add visual feedback for testing
  let testIndex = 0;
  const testPositions = [];
  
  // Test top 4 rows
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 23; col += 3) {
      testPositions.push({
        row,
        col,
        screenX: canvasRect.left + (col * CELL_SIZE + CELL_SIZE / 2),
        screenY: canvasRect.top + (row * CELL_SIZE + CELL_SIZE / 2)
      });
    }
  }
  
  console.log(`Testing ${testPositions.length} positions on top 4 rows...`);
  
  // Add event listeners to capture actual events
  const events = [];
  
  const mouseDownHandler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    events.push({
      type: 'mousedown',
      clientX: e.clientX,
      clientY: e.clientY,
      canvasX: x,
      canvasY: y,
      timestamp: Date.now()
    });
    
    console.log('Mouse down captured:', {
      client: { x: e.clientX, y: e.clientY },
      canvas: { x, y }
    });
  };
  
  canvas.addEventListener('mousedown', mouseDownHandler);
  
  // Auto-test with simulated events
  setTimeout(() => {
    console.log('Simulating interaction events...');
    
    testPositions.forEach((pos, index) => {
      setTimeout(() => {
        const event = new MouseEvent('mousedown', {
          clientX: pos.screenX,
          clientY: pos.screenY,
          bubbles: true
        });
        
        canvas.dispatchEvent(event);
        console.log(`Simulated click on row ${pos.row}, col ${pos.col}`);
      }, index * 100);
    });
  }, 1000);
  
  // Return cleanup function
  return {
    cleanup: () => {
      canvas.removeEventListener('mousedown', mouseDownHandler);
      console.log(`Captured ${events.length} actual events`);
      return events;
    }
  };
}

// Run validation
const validation = validateCoordinateFix();
const interactionTest = testActualInteraction();

// Make cleanup available
window.cleanupValidation = () => {
  const events = interactionTest.cleanup();
  console.log('Validation complete. Events captured:', events.length);
  return events;
};

console.log('Coordinate fix validation running. Use window.cleanupValidation() to see results.');
