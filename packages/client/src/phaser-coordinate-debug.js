// Phaser coordinate mapping debug script
console.log('=== PHASER COORDINATE MAPPING DEBUG ===');

function debugPhaserCoordinates() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  
  // Get the game instance from canvas
  const game = canvas.game;
  if (!game) {
    console.error('Phaser game instance not found');
    return;
  }
  
  console.log('Phaser game found:', game);
  console.log('Game config:', game.config);
  
  // Get the active scene
  const scene = game.scene.getScene('GameScene');
  if (!scene) {
    console.error('GameScene not found');
    return;
  }
  
  console.log('GameScene found:', scene);
  
  // Test coordinate conversion
  const canvasRect = canvas.getBoundingClientRect();
  console.log('Canvas rect:', canvasRect);
  
  // Add temporary debug to the scene
  const originalPointerDown = scene.input.events.listeners('pointerdown')[0];
  const originalPointerMove = scene.input.events.listeners('pointermove')[0];
  
  // Override pointerdown to log coordinates
  scene.input.off('pointerdown');
  scene.input.on('pointerdown', (pointer) => {
    console.log('=== POINTER DOWN EVENT ===');
    console.log('Raw pointer coordinates:', {
      x: pointer.x,
      y: pointer.y,
      worldX: pointer.worldX,
      worldY: pointer.worldY,
      clientX: pointer.event?.clientX,
      clientY: pointer.event?.clientY
    });
    
    // Calculate grid coordinates
    const CELL_SIZE = 32;
    const gridX = Math.floor(pointer.x / CELL_SIZE);
    const gridY = Math.floor(pointer.y / CELL_SIZE);
    
    console.log('Calculated grid coordinates:', { gridX, gridY });
    console.log('Expected cell bounds:', {
      minX: gridX * CELL_SIZE,
      maxX: (gridX + 1) * CELL_SIZE,
      minY: gridY * CELL_SIZE,
      maxY: (gridY + 1) * CELL_SIZE
    });
    
    // Check if coordinates are within expected bounds
    const inBounds = gridX >= 0 && gridX < 23 && gridY >= 0 && gridY < 23;
    console.log('Within grid bounds:', inBounds);
    
    // Call original handler
    if (originalPointerDown) {
      originalPointerDown.call(scene, pointer);
    }
  });
  
  // Override pointermove for hover debugging
  scene.input.off('pointermove');
  scene.input.on('pointermove', (pointer) => {
    const CELL_SIZE = 32;
    const gridX = Math.floor(pointer.x / CELL_SIZE);
    const gridY = Math.floor(pointer.y / CELL_SIZE);
    
    // Only log top 4 rows
    if (gridY >= 0 && gridY < 4) {
      console.log('TOP ROW HOVER:', {
        pointer: { x: pointer.x, y: pointer.y },
        grid: { x: gridX, y: gridY }
      });
    }
    
    // Call original handler
    if (originalPointerMove) {
      originalPointerMove.call(scene, pointer);
    }
  });
  
  // Test specific coordinates
  console.log('Testing coordinate mapping for top 4 rows...');
  
  const CELL_SIZE = 32;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 23; col += 5) {
      const gameX = col * CELL_SIZE + CELL_SIZE / 2;
      const gameY = row * CELL_SIZE + CELL_SIZE / 2;
      
      console.log(`Test coordinate for row ${row}, col ${col}:`, {
        gameX,
        gameY,
        expectedGridX: col,
        expectedGridY: row
      });
    }
  }
  
  // Check camera and viewport
  const camera = scene.cameras.main;
  console.log('Camera info:', {
    x: camera.x,
    y: camera.y,
    width: camera.width,
    height: camera.height,
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    zoom: camera.zoom
  });
  
  // Check scale manager
  const scaleManager = game.scale;
  console.log('Scale manager info:', {
    mode: scaleManager.mode,
    width: scaleManager.width,
    height: scaleManager.height,
    displayWidth: scaleManager.displayWidth,
    displayHeight: scaleManager.displayHeight,
    aspectRatio: scaleManager.aspectRatio
  });
  
  return {
    cleanup: () => {
      // Restore original handlers
      scene.input.off('pointerdown');
      scene.input.off('pointermove');
      if (originalPointerDown) scene.input.on('pointerdown', originalPointerDown);
      if (originalPointerMove) scene.input.on('pointermove', originalPointerMove);
    }
  };
}

// Run the debug
const debugResult = debugPhaserCoordinates();

// Make cleanup available globally
window.cleanupPhaserDebug = debugResult.cleanup;

console.log('Phaser coordinate debug complete. Use window.cleanupPhaserDebug() to restore.');
