/* scripts/button-fit.js
   Compute a single, shared font-size for all button labels so they look consistent,
   and avoid truncation where possible.

   Strategy:
   - Wrap text nodes into .btn-label if missing.
   - For each button compute available width for label (subtract paddings and icon width).
   - Find max font that fits for each label. Pick the minimum across buttons as globalPx.
   - Verify that globalPx actually fits all labels; if not, iteratively decrease until it does
     or until --min-button-font-size is reached.
   - If at minimum font some labels still overflow, allow those labels to wrap onto multiple lines
     (white-space: normal) so the label is never cut off.
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
  const TOLERANCE = 1; // px tolerance for overflow checks

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

  function setLabelSize(label, sizePx, available, nowrap = true) {
    if (!label) return;
    label.style.fontSize = sizePx + 'px';
    label.style.maxWidth = available + 'px';
    label.style.display = 'block';
    if (nowrap) {
      label.style.whiteSpace = 'nowrap';
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
    } else {
      label.style.whiteSpace = 'normal';
      label.style.overflow = 'visible';
      label.style.textOverflow = 'clip';
    }
  }

  function adjustAll() {
    const nodes = Array.from(document.querySelectorAll(SELECTORS.join(','))).filter(
      (n) => n && n.offsetWidth > 0
    );
    if (!nodes.length) return;

    nodes.forEach(ensureLabel);

    // Compute best per-button font
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

    const minFont = cssMinFont();
    let globalPx = Math.max(minFont, Math.min(...candidates));

    // Verify and reduce until no button overflows or we hit minFont
    let iterationSafety = 0;
    while (iterationSafety < 40) {
      let anyOverflow = false;
      nodes.forEach((container) => {
        const label =
          container.querySelector('.btn-label') || container.querySelector('.footer-email-text');
        const available = getAvailableWidth(container);
        setLabelSize(label, globalPx, available, true);
        if (label.scrollWidth > label.clientWidth + TOLERANCE) anyOverflow = true;
      });
      if (!anyOverflow) break;
      if (globalPx <= minFont) break;
      globalPx = Math.max(minFont, globalPx - 1);
      iterationSafety++;
    }

    // Apply final sizes; if still overflowing (at minFont), allow wrapping for those labels
    nodes.forEach((container) => {
      const label =
        container.querySelector('.btn-label') || container.querySelector('.footer-email-text');
      const available = getAvailableWidth(container);
      // If label still overflows at globalPx, allow wrap
      setLabelSize(label, globalPx, available, true);
      if (label.scrollWidth > label.clientWidth + TOLERANCE) {
        setLabelSize(label, globalPx, available, false);
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
    setTimeout(adjustAll, 800);
  });

  window.addEventListener('resize', debounce(adjustAll, DEBOUNCE_MS));
  const mo = new MutationObserver(debounce(adjustAll, DEBOUNCE_MS));
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
