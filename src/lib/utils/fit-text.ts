export function applyFitText(container: HTMLElement | Document) {
  if (!container) return;
  const fitElements = container.querySelectorAll<HTMLElement>('[data-fit-text]');
  
  fitElements.forEach((el) => {
    // Reset para re-calcular
    el.style.fontSize = '';
    
    const minFontSize = parseInt(el.getAttribute('data-fit-text-min') || '12', 10);
    const maxLines = parseInt(el.getAttribute('data-fit-text-lines') || '1', 10);
    
    let currentSize = parseFloat(window.getComputedStyle(el).fontSize);
    
    const getLineHeight = () => {
      const lh = window.getComputedStyle(el).lineHeight;
      return lh === 'normal' ? currentSize * 1.2 : parseFloat(lh);
    };

    while (currentSize > minFontSize) {
      const isOverflowingVertically = maxLines > 1 && el.scrollHeight > Math.ceil(getLineHeight() * maxLines + 1);
      const isOverflowingHorizontally = el.scrollWidth > el.clientWidth + 1;
      
      if (!isOverflowingVertically && !isOverflowingHorizontally) {
        break;
      }
      
      currentSize -= 1;
      el.style.fontSize = `${currentSize}px`;
    }
  });

  const scaleElements = container.querySelectorAll<HTMLElement>('[data-scale-to-fit]');
  scaleElements.forEach((el) => {
    el.style.transform = 'none';
    const maxHeight = parseFloat(el.getAttribute('data-scale-to-fit') || '900');
    const currentHeight = el.scrollHeight;
    
    if (currentHeight > maxHeight) {
      const scale = maxHeight / currentHeight;
      el.style.transform = `scale(${scale})`;
      el.style.transformOrigin = 'top left';
    }
  });
}

export const applyFitTextScript = `
function applyFitText(container) {
  if (!container) return;
  const elements = container.querySelectorAll('[data-fit-text]');
  elements.forEach((el) => {
    el.style.fontSize = '';
    
    const minFontSize = parseInt(el.getAttribute('data-fit-text-min') || '12', 10);
    const maxLines = parseInt(el.getAttribute('data-fit-text-lines') || '1', 10);
    
    let currentSize = parseFloat(window.getComputedStyle(el).fontSize);
    
    const getLineHeight = () => {
      const lh = window.getComputedStyle(el).lineHeight;
      return lh === 'normal' ? currentSize * 1.2 : parseFloat(lh);
    };

    while (currentSize > minFontSize) {
      const isOverflowingVertically = maxLines > 1 && el.scrollHeight > Math.ceil(getLineHeight() * maxLines + 1);
      const isOverflowingHorizontally = el.scrollWidth > el.clientWidth + 1;
      
      if (!isOverflowingVertically && !isOverflowingHorizontally) {
        break;
      }
      
      currentSize -= 1;
      el.style.fontSize = currentSize + 'px';
    }
  });

  const scaleElements = container.querySelectorAll('[data-scale-to-fit]');
  scaleElements.forEach((el) => {
    el.style.transform = 'none';
    const maxHeight = parseFloat(el.getAttribute('data-scale-to-fit') || '900');
    const currentHeight = el.scrollHeight;
    
    if (currentHeight > maxHeight) {
      const scale = maxHeight / currentHeight;
      el.style.transform = 'scale(' + scale + ')';
      el.style.transformOrigin = 'top left';
    }
  });
}
`;
