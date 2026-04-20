// Test script to debug coordinate mapping issues
console.log('=== COORDINATE MAPPING TEST ===');

function testCoordinateMapping() {
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    // Get the game instance and scene
    const game = canvas.game;
    const scene = game?.scene.getScene('GameScene');
    
    if (!scene) {
      console.error('GameScene not found');
      return;
    }
    
    console.log('=== TESTING COORDINATE SYSTEM ===');
    
    const canvasRect = canvas.getBoundingClientRect();
    const CELL_SIZE = 32;
    
    // Test the current coordinate mapping method
    console.log('Canvas rect:', canvasRect);
    console.log('Cell size:', CELL_SIZE);
    
    // Test different coordinate calculation methods
    const testMethods = [
      {
        name: 'Original Method (pointer.x / CELL_SIZE)',
        calculate: (x, y) => ({
          gridX: Math.floor(x / CELL_SIZE),
          gridY: Math.floor(y / CELL_SIZE)
        })
      },
      {
        name: 'getWorldPoint Method',
        calculate: (x, y) => {
          const worldPoint = scene.cameras.main.getWorldPoint(x, y);
          return {
            gridX: Math.floor(worldPoint.x / CELL_SIZE),
            gridY: Math.floor(worldPoint.y / CELL_SIZE)
          };
        }
      },
      {
        name: 'getWorldPosition Method',
        calculate: (x, y) => {
          const worldPoint = scene.cameras.main.getWorldPosition(x, y);
          return {
            gridX: Math.floor(worldPoint.x / CELL_SIZE),
            gridY: Math.floor(worldPoint.y / CELL_SIZE)
          };
        }
      }
    ];
    
    // Test points for top 4 rows
    const testPoints = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 23; col += 6) {
        const canvasX = col * CELL_SIZE + CELL_SIZE / 2;
        const canvasY = row * CELL_SIZE + CELL_SIZE / 2;
        
        testPoints.push({
          row,
          col,
          canvasX,
          canvasY,
          screenX: canvasRect.left + canvasX,
          screenY: canvasRect.top + canvasY
        });
      }
    }
    
    console.log('Testing coordinate methods with', testPoints.length, 'points');
    
    testPoints.forEach(point => {
      console.log(`\nTesting Row ${point.row}, Col ${point.col}:`);
      console.log(`  Canvas coords: (${point.canvasX}, ${point.canvasY})`);
      console.log(`  Screen coords: (${point.screenX}, ${point.screenY})`);
      
      testMethods.forEach(method => {
        const result = method.calculate(point.canvasX, point.canvasY);
        const isCorrect = result.gridX === point.col && result.gridY === point.row;
        console.log(`  ${method.name}: (${result.gridX}, ${result.gridY}) ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      });
    });
    
    // Test camera settings
    const camera = scene.cameras.main;
    console.log('\n=== CAMERA SETTINGS ===');
    console.log('Camera info:', {
      x: camera.x,
      y: camera.y,
      width: camera.width,
      height: camera.height,
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom
    });
    
    // Test scale manager
    const scaleManager = game.scale;
    console.log('\n=== SCALE MANAGER ===');
    console.log('Scale info:', {
      mode: scaleManager.mode,
      width: scaleManager.width,
      height: scaleManager.height,
      displayWidth: scaleManager.displayWidth,
      displayHeight: scaleManager.displayHeight,
      aspectRatio: scaleManager.aspectRatio
    });
    
    // Add event listener to test real mouse events
    console.log('\n=== REAL MOUSE EVENT TEST ===');
    console.log('Move your mouse over the top 4 rows to see coordinate mapping...');
    
    const mouseMoveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Only log for top 4 rows area
      if (y < 4 * CELL_SIZE) {
        console.log('Real mouse event:', {
          client: { x: e.clientX, y: e.clientY },
          canvas: { x, y }
        });
        
        testMethods.forEach(method => {
          const result = method.calculate(x, y);
          console.log(`  ${method.name}: (${result.gridX}, ${result.gridY})`);
        });
      }
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    
    // Return cleanup
    return {
      cleanup: () => {
        canvas.removeEventListener('mousemove', mouseMoveHandler);
        console.log('Coordinate test complete');
      }
    };
  }, 2000);
}

// Run the test
const testResult = testCoordinateMapping();

// Make cleanup available
window.cleanupCoordinateTest = () => {
  if (testResult && testResult.cleanup) {
    testResult.cleanup();
  }
};

console.log('Coordinate test loaded. Use window.cleanupCoordinateTest() to stop.');
