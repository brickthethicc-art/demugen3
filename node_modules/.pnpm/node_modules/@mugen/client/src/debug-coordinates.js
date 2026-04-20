// Debug script to check coordinate mapping and positioning
console.log('=== COORDINATE DEBUG ===');

// Get the canvas element
const canvas = document.querySelector('canvas');
if (!canvas) {
  console.error('Canvas not found');
} else {
  const canvasRect = canvas.getBoundingClientRect();
  console.log('Canvas position:', canvasRect);
  
  // Calculate where the top 4 rows should be
  const CELL_SIZE = 32;
  console.log('Cell size:', CELL_SIZE);
  
  for (let y = 0; y < 4; y++) {
    const py = y * CELL_SIZE;
    const absoluteY = canvasRect.top + py;
    console.log(`Row ${y}: pixel Y=${py}, absolute Y=${absoluteY}`);
  }
  
  // Check if there are any elements covering the top area
  const topArea = {
    left: canvasRect.left,
    top: canvasRect.top,
    right: canvasRect.right,
    bottom: canvasRect.top + (4 * CELL_SIZE)
  };
  
  console.log('Top 4 rows area:', topArea);
  
  // Find elements that might overlap this area
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
        rect: rect,
        zIndex: styles.zIndex,
        pointerEvents: styles.pointerEvents,
        position: styles.position,
        display: styles.display
      });
    }
  });
  
  console.log('Elements overlapping top 4 rows:', overlappingElements);
}
