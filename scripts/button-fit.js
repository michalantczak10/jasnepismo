/* scripts/button-fit.js
   Compute a single, shared font-size for all button labels so they look consistent.
   Strategy:
   1) Wrap text nodes into .btn-label (unless .footer-email-text exists).
   2) For each button, find the largest font-size that fits the available label space.
   3) Set all labels to the minimum of those font-sizes (but not below CSS --min-button-font-size).
   This avoids per-button size differences and keeps a single-line appearance with ellipsis fallback.
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
  const DEBOUNCE_MS = 120;
  const CSS_MIN_VAR = '--min-button-font-size';
  const CSS_LABEL_VAR = '--button-label-font-size';

  function cssMinFont() {
    const v = getComputedStyle(document.documentElement).getPropertyValue(CSS_MIN_VAR);
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 12;
  }

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

  function getAvailableWidth(container) {
    const cs = window.getComputedStyle(container);
    const paddingLeft = parseFloat(cs.paddingLeft) || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    let available = Math.max(0, container.clientWidth - paddingLeft - paddingRight);
    const icon = container.querySelector('.button-icon, .nav-emoji, .footer-emoji');
    if (icon) {
      const iconCS = window.getComputedStyle(icon);
      const iconWidth = icon.offsetWidth + (parseFloat(iconCS.marginRight) || 0);
      available = Math.max(0, available - iconWidth);
    }
    return Math.floor(available);
  }

  function findMaxFontForLabel(label, available, startPx) {
    if (!label) return cssMinFont();
    label.style.display = 'inline-block';
    label.style.whiteSpace = 'nowrap';
    label.style.maxWidth = available + 'px';
    label.style.overflow = 'visible';
    label.style.textOverflow = 'clip';

    const cs = window.getComputedStyle(label);
    if (!label.dataset.origFont) label.dataset.origFont = cs.fontSize;
    let fontPx = parseFloat(label.dataset.origFont) || startPx || 16;
    const minFont = cssMinFont();

    // Decrease until it fits or until minFont
    while (label.scrollWidth > available && fontPx > minFont) {
      fontPx = Math.max(minFont, fontPx - 1);
      label.style.fontSize = fontPx + 'px';
    }

    return Math.max(minFont, Math.round(fontPx));
  }

  function adjustAll() {
    const nodes = Array.from(document.querySelectorAll(SELECTORS.join(','))).filter(
      (n) => n && n.offsetWidth > 0
    );
    if (!nodes.length) return;

    // Ensure labels exist
    nodes.forEach(ensureLabel);

    // Compute the best font for each label
    const candidates = [];
    nodes.forEach((container) => {
      const label =
        container.querySelector('.btn-label') || container.querySelector('.footer-email-text');
      const csLabel = label ? window.getComputedStyle(label) : null;
      const startPx = csLabel
        ? parseFloat(csLabel.fontSize)
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(CSS_LABEL_VAR)) ||
          16;
      const available = getAvailableWidth(container);
      const best = findMaxFontForLabel(label, available, startPx);
      candidates.push(best);
    });

    // Choose a single font-size for all buttons (minimum of candidates)
    const globalPx = Math.max(cssMinFont(), Math.min(...candidates));

    // Apply global size and final clamp/ellipsis
    nodes.forEach((container) => {
      const label =
        container.querySelector('.btn-label') || container.querySelector('.footer-email-text');
      if (!label) return;
      const available = getAvailableWidth(container);
      label.style.fontSize = globalPx + 'px';
      label.style.maxWidth = available + 'px';
      label.style.whiteSpace = 'nowrap';
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
      // keep display as block so flex sizing works
      label.style.display = 'block';
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
    setTimeout(adjustAll, 300);
  });

  window.addEventListener('resize', debounce(adjustAll, DEBOUNCE_MS));
  const mo = new MutationObserver(debounce(adjustAll, DEBOUNCE_MS));
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
