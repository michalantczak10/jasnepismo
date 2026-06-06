/* scripts/button-fit.js
   Single-line, non-truncated button labels.

   Algorithm:
   - Wrap text nodes into .btn-label when needed.
   - Try three spacing modes: normal, tight, compact (CSS classes reduce padding/icon gaps).
   - For each mode, lower font size (starting from --button-label-font-size) until every button's
     required width (label + icon + padding) fits the available space in its parent.
   - If found, set each button's inline width to the computed required width so labels never wrap
     or get clipped. If no mode succeeds, fall back to the tightest mode and set font to minimum.
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
    return Number.isFinite(parsed) ? parsed : 10;
  }

  function cssStartFont() {
    const v = getComputedStyle(document.documentElement).getPropertyValue(CSS_LABEL_VAR);
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 16;
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

  function visibleButtons() {
    return Array.from(document.querySelectorAll(SELECTORS.join(','))).filter((el) => {
      try {
        return el.offsetWidth > 0 && el.offsetHeight > 0 && getComputedStyle(el).display !== 'none';
      } catch (e) {
        return false;
      }
    });
  }

  function getIconWidth(container) {
    const icon = container.querySelector('.button-icon, .nav-emoji, .footer-emoji');
    if (!icon) return 0;
    const cs = getComputedStyle(icon);
    return Math.ceil(icon.offsetWidth + (parseFloat(cs.marginRight) || 0));
  }

  function getPaddings(button) {
    const cs = getComputedStyle(button);
    return {
      left: parseFloat(cs.paddingLeft) || 0,
      right: parseFloat(cs.paddingRight) || 0,
    };
  }

  function getAvailable(button) {
    // prefer parent's inner width, but never exceed viewport
    const parent = button.parentElement || document.documentElement;
    const parentWidth = parent.clientWidth || document.documentElement.clientWidth;
    const maxByViewport = Math.max(64, window.innerWidth - 32);
    return Math.min(parentWidth, maxByViewport);
  }

  function measureRequired(button, fontPx) {
    const label =
      button.querySelector('.btn-label') || button.querySelector('.footer-email-text') || button;
    if (!label) return 0;
    // apply font for measurement
    label.style.fontSize = fontPx + 'px';
    // ensure single-line measurement
    label.style.whiteSpace = 'nowrap';
    label.style.display = 'inline-block';
    label.style.maxWidth = 'none';
    label.style.overflow = 'visible';
    label.style.textOverflow = 'clip';

    // force reflow
    const labelWidth = Math.ceil(label.scrollWidth || label.offsetWidth || 0);
    const iconWidth = getIconWidth(button);
    const paddings = getPaddings(button);

    // small fudge so text doesn't butt against edges
    const extra = 12;
    return labelWidth + iconWidth + paddings.left + paddings.right + extra;
  }

  function applyWidths(buttons, widths, fontPx) {
    buttons.forEach((btn, i) => {
      // calculate available space and current CSS width (after inline widths were cleared)
      const available = Math.max(64, getAvailable(btn));
      const cssWidth =
        btn.clientWidth && btn.clientWidth > 0
          ? btn.clientWidth
          : parseFloat(getComputedStyle(btn).width) || 0;
      // prefer the larger of the measured required width and the CSS-defined width so we don't shrink buttons
      const desired = Math.max(widths[i], cssWidth);
      const w = Math.min(desired, available);
      btn.style.width = w + 'px';
      const label =
        btn.querySelector('.btn-label') || btn.querySelector('.footer-email-text') || btn;
      label.style.fontSize = fontPx + 'px';
      label.style.whiteSpace = 'nowrap';
      label.style.overflow = 'visible';
      label.style.textOverflow = 'clip';
      label.style.display = 'inline-block';
    });
  }

  function removeFitClasses(buttons) {
    buttons.forEach((b) => b.classList.remove('button-fit-tight', 'button-fit-compact'));
  }

  function adjustAll() {
    const buttons = visibleButtons();
    if (!buttons.length) return;

    // Clear inline widths so measurement is natural
    buttons.forEach((b) => {
      b.style.width = '';
    });

    buttons.forEach(ensureLabel);

    const modes = ['', 'button-fit-tight', 'button-fit-compact'];
    const minFont = cssMinFont();
    const startFont = cssStartFont();

    let success = false;
    for (const mode of modes) {
      removeFitClasses(buttons);
      if (mode) buttons.forEach((b) => b.classList.add(mode));

      let font = startFont;
      // Try decreasing font until all buttons' required widths fit within available space
      while (font >= minFont) {
        const required = buttons.map((b) => measureRequired(b, font));
        const fits = required.every((req, idx) => req <= getAvailable(buttons[idx]));
        if (fits) {
          applyWidths(buttons, required, font);
          success = true;
          break;
        }
        font -= 1;
      }

      if (success) break;
    }

    if (!success) {
      // Last resort: apply compact mode and set font to minFont and widths to available
      removeFitClasses(buttons);
      buttons.forEach((b) => b.classList.add('button-fit-compact'));
      const widths = buttons.map((b) => Math.min(getAvailable(b), measureRequired(b, minFont)));
      applyWidths(buttons, widths, minFont);
    }
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
    setTimeout(adjustAll, 800);
  });

  window.addEventListener('resize', debounce(adjustAll, DEBOUNCE_MS));
  const mo = new MutationObserver(debounce(adjustAll, DEBOUNCE_MS));
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
