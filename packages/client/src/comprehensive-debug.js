// Comprehensive debug script to identify the grid interaction issue
console.log('=== COMPREHENSIVE GRID INTERACTION DEBUG ===');

// Test 1: Find all elements and check for overlays
function findOverlappingElements() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  
  const canvasRect = canvas.getBoundingClientRect();
  console.log('Canvas rect:', canvasRect);
  
  // Define the top 4 rows area
  const topArea = {
    left: canvasRect.left,
    top: canvasRect.top,
    right: canvasRect.right,
    bottom: canvasRect.top + (4 * 32) // 4 rows × 32px
  };
  
  console.log('Top 4 rows area:', topArea);
  
  // Find all elements
  const allElements = document.querySelectorAll('*');
  const problematicElements = [];
  
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    
    // Check if element overlaps the top area
    if (rect.left < topArea.right && rect.right > topArea.left &&
        rect.top < topArea.bottom && rect.bottom > topArea.top) {
      
      // Check if element could block interaction
      const couldBlock = (
        styles.position !== 'static' ||
        styles.zIndex !== 'auto' ||
        styles.pointerEvents === 'none' ||
        styles.opacity !== '1' ||
        styles.visibility !== 'visible'
      );
      
      if (couldBlock || el.tagName === 'DIV') {
        problematicElements.push({
          element: el,
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          rect: rect,
          zIndex: styles.zIndex,
          pointerEvents: styles.pointerEvents,
          position: styles.position,
          opacity: styles.opacity,
          visibility: styles.visibility,
          display: styles.display
        });
      }
    }
  });
  
  console.log('Elements overlapping top 4 rows:', problematicElements);
  return problematicElements;
}

// Test 2: Check canvas coordinate mapping
function testCoordinateMapping() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  const canvasRect = canvas.getBoundingClientRect();
  console.log('Testing coordinate mapping...');
  
  // Simulate clicks on top 4 rows
  for (let row = 0; row < 4; row++) {
    const gameY = row * 32; // Game coordinate
    const screenY = canvasRect.top + gameY; // Screen coordinate
    
    // Test center of each row
    const testX = canvasRect.left + (23 * 32) / 2; // Center of grid
    const testY = screenY + 16; // Center of cell
    
    console.log(`Row ${row} test:`, {
      gameY: gameY,
      screenY: testY,
      inViewport: testY >= window.scrollY && testY <= window.scrollY + window.innerHeight
    });
  }
}

// Test 3: Check for pointer events issues
function checkPointerEvents() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  const canvasContainer = canvas.parentElement;
  const gameBoard = canvasContainer?.parentElement;
  
  if (canvasContainer) {
    const containerStyles = window.getComputedStyle(canvasContainer);
    console.log('Canvas container pointer events:', {
      pointerEvents: containerStyles.pointerEvents,
      overflow: containerStyles.overflow,
      position: containerStyles.position
    });
  }
  
  if (gameBoard) {
    const boardStyles = window.getComputedStyle(gameBoard);
    console.log('GameBoard container styles:', {
      pointerEvents: boardStyles.pointerEvents,
      overflow: boardStyles.overflow,
      position: boardStyles.position,
      className: gameBoard.className
    });
  }
}

// Test 4: Check for CSS transforms
function checkTransforms() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  // Check transform chain
  let element = canvas;
  let depth = 0;
  
  while (element && depth < 10) {
    const styles = window.getComputedStyle(element);
    const transform = styles.transform;
    
    if (transform && transform !== 'none') {
      console.log(`Transform found at depth ${depth}:`, {
        element: element.tagName + (element.className ? '.' + element.className : ''),
        transform: transform
      });
    }
    
    element = element.parentElement;
    depth++;
  }
}

// Run all tests
findOverlappingElements();
testCoordinateMapping();
checkPointerEvents();
checkTransforms();

// Test 5: Try to temporarily disable potential blocking elements
function testDisablingElements() {
  console.log('Testing with potentially blocking elements disabled...');
  
  const overlappingElements = findOverlappingElements();
  
  overlappingElements.forEach((el, index) => {
    const originalPointerEvents = window.getComputedStyle(el.element).pointerEvents;
    
    // Temporarily disable pointer events
    el.element.style.pointerEvents = 'none';
    
    console.log(`Disabled element ${index}:`, el.element.tagName + (el.element.className ? '.' + el.element.className : ''));
    
    // Re-enable after 3 seconds
    setTimeout(() => {
      el.element.style.pointerEvents = originalPointerEvents;
      console.log(`Re-enabled element ${index}`);
    }, 3000);
  });
}

// Uncomment to test disabling elements
// testDisablingElements();
