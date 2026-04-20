// Debug script to test Phaser scaling coordinate mapping
console.log('=== PHASER SCALING DEBUG ===');

// Find the Phaser game instance
const canvas = document.querySelector('canvas');
if (!canvas) {
  console.error('Canvas not found');
} else {
  const canvasRect = canvas.getBoundingClientRect();
  const containerRect = canvas.parentElement.getBoundingClientRect();
  
  console.log('Canvas element size:', {
    width: canvas.width,
    height: canvas.height,
    styleWidth: canvas.style.width,
    styleHeight: canvas.style.height
  });
  
  console.log('Canvas rect:', canvasRect);
  console.log('Container rect:', containerRect);
  
  // Check if canvas is being scaled
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  
  console.log('Scaling factors:', {
    scaleX: scaleX,
    scaleY: scaleY,
    isUniform: Math.abs(scaleX - scaleY) < 0.01
  });
  
  // Test coordinate mapping for top rows
  const CELL_SIZE = 32;
  console.log('Testing top 4 rows coordinate mapping:');
  
  for (let row = 0; row < 4; row++) {
    const gameY = row * CELL_SIZE; // Game coordinate
    const expectedCanvasY = gameY; // Should be same in game coordinates
    const actualScreenY = canvasRect.top + (gameY * scaleY); // Screen coordinate
    
    console.log(`Row ${row}:`, {
      gameY: gameY,
      expectedCanvasY: expectedCanvasY,
      actualScreenY: actualScreenY,
      inViewport: actualScreenY >= window.scrollY && actualScreenY <= window.scrollY + window.innerHeight
    });
  }
  
  // Check if there's a transformation matrix affecting the canvas
  const computedStyle = window.getComputedStyle(canvas);
  const transform = computedStyle.transform;
  
  if (transform && transform !== 'none') {
    console.log('Canvas has transform:', transform);
    
    // Try to extract matrix values
    const matrix = transform.match(/matrix.*\((.+)\)/);
    if (matrix) {
      const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
      console.log('Transform matrix values:', values);
    }
  } else {
    console.log('No transform on canvas');
  }
}
