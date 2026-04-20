// Debug script to test grid interaction
// This will be injected into the browser console to test interaction

console.log('=== GRID INTERACTION DEBUG ===');

// Test 1: Verify grid dimensions
const gameBoard = document.querySelector('[data-testid="game-screen"]');
if (gameBoard) {
  const rect = gameBoard.getBoundingClientRect();
  console.log('GameScreen container:', rect);
}

// Test 2: Find the Phaser canvas
const canvas = document.querySelector('canvas');
if (canvas) {
  const canvasRect = canvas.getBoundingClientRect();
  console.log('Phaser canvas:', canvasRect);
  console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
}

// Test 3: Check for overlapping elements
const allElements = document.querySelectorAll('*');
const overlappingElements = [];
allElements.forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    overlappingElements.push({
      element: el.tagName + (el.className ? '.' + el.className : ''),
      rect: rect,
      zIndex: window.getComputedStyle(el).zIndex,
      pointerEvents: window.getComputedStyle(el).pointerEvents
    });
  }
});

console.log('Potential overlapping elements:', overlappingElements.filter(el => 
  el.element.includes('absolute') || el.element.includes('fixed')
));

// Test 4: Check pointer events on canvas container
const canvasContainer = canvas?.parentElement;
if (canvasContainer) {
  const containerStyles = window.getComputedStyle(canvasContainer);
  console.log('Canvas container styles:', {
    overflow: containerStyles.overflow,
    overflowX: containerStyles.overflowX,
    overflowY: containerStyles.overflowY,
    pointerEvents: containerStyles.pointerEvents,
    position: containerStyles.position,
    zIndex: containerStyles.zIndex
  });
}
