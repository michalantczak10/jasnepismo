/* scripts/button-fit.js
   Wraps button text nodes into a .btn-label and shrinks the label to fit the available space.
   Accounts for icons (nav-emoji / button-icon) and uses ellipsis when minimum reached.
*/
(function () {
  'use strict';
  const SELECTORS = [
    'button',
    'a.hero-cta',
    'a.footer-cta',
    '.footer-email-link',
    'button.hero-cta',
    '.hero-cta',
    '.footer-cta',
  ];
  const MIN_FONT_PX = 12;
  const STEP_PX = 1;
  const DEBOUNCE_MS = 120;

  function ensureLabel(container) {
    if (!container) return;
    if (container.querySelector('.btn-label') || container.querySelector('.footer-email-text'))
      return;
    const nodes = Array.from(container.childNodes);
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const span = document.createElement('span');
        span.className = 'btn-label';
        span.textContent = node.textContent.trim();
        container.replaceChild(span, node);
      }
    });
  }

  function fitLabel(container) {
    if (!container || !container.offsetWidth) return;
    ensureLabel(container);
    const label =
      container.querySelector('.btn-label') ||
      container.querySelector('.footer-email-text') ||
      container;
    if (!label || !label.offsetWidth) return;

    // Compute available width inside the container (subtract paddings and icon widths)
    const containerStyle = window.getComputedStyle(container);
    const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
    let available = Math.max(0, container.clientWidth - paddingLeft - paddingRight);

    const icon = container.querySelector('.button-icon, .nav-emoji, .footer-emoji');
    if (icon) {
      const iconStyle = window.getComputedStyle(icon);
      const iconWidth = icon.offsetWidth + (parseFloat(iconStyle.marginRight) || 0);
      available = Math.max(0, available - iconWidth);
    }

    // Apply max-width to label so measurement uses the right box
    label.style.maxWidth = available + 'px';
    label.style.display = 'inline-block';

    // Save previous inline styles to restore some if needed
    const prev = {
      whiteSpace: label.style.whiteSpace,
      overflow: label.style.overflow,
      textOverflow: label.style.textOverflow,
    };

    label.style.whiteSpace = 'nowrap';
    label.style.overflow = 'visible';
    label.style.textOverflow = 'clip';

    // Save original font-size if not already
    const cs = window.getComputedStyle(label);
    if (!label.dataset.origFont) label.dataset.origFont = cs.fontSize;
    label.style.fontSize = label.dataset.origFont;

    let fontPx = parseFloat(window.getComputedStyle(label).fontSize);
    const minFont =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--min-button-font-size')
      ) || MIN_FONT_PX;

    while (label.scrollWidth > label.clientWidth && fontPx > minFont) {
      fontPx = Math.max(minFont, fontPx - STEP_PX);
      label.style.fontSize = fontPx + 'px';
    }

    if (label.scrollWidth > label.clientWidth) {
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
    } else {
      label.style.overflow = prev.overflow;
      label.style.textOverflow = prev.textOverflow;
    }

    label.style.whiteSpace = 'nowrap';
  }

  function adjustAll() {
    const els = document.querySelectorAll(SELECTORS.join(','));
    els.forEach((el) => {
      try {
        fitLabel(el);
      } catch (e) {
        /* ignore measurement errors */
      }
    });
  }

  function debounce(fn, t) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), t);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    adjustAll();
    // sometimes fonts or images load later
    setTimeout(adjustAll, 300);
  });

  window.addEventListener('resize', debounce(adjustAll, DEBOUNCE_MS));
  const mo = new MutationObserver(debounce(adjustAll, DEBOUNCE_MS));
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
