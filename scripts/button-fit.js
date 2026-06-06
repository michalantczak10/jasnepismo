/* scripts/button-fit.js
   Small helper to shrink button text so it stays on a single line.
   Runs on DOMContentLoaded and on resize. Falls back to ellipsis when minimum reached.
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

  function fitElement(el) {
    if (!el || !el.offsetWidth) return;
    const text = el.textContent.trim();
    if (!text) return;

    const cs = window.getComputedStyle(el);
    // Save original font-size once
    if (!el.dataset.origFont) el.dataset.origFont = cs.fontSize;

    // Reset to original before measuring
    el.style.fontSize = el.dataset.origFont;

    // Temporarily force single-line for measurement
    const prev = {
      whiteSpace: el.style.whiteSpace,
      overflow: el.style.overflow,
      textOverflow: el.style.textOverflow,
    };
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'visible';
    el.style.textOverflow = 'clip';

    let fontPx = parseFloat(window.getComputedStyle(el).fontSize);
    const minFont =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--min-button-font-size')
      ) || MIN_FONT_PX;

    while (el.scrollWidth > el.clientWidth && fontPx > minFont) {
      fontPx = Math.max(minFont, fontPx - STEP_PX);
      el.style.fontSize = fontPx + 'px';
    }

    if (el.scrollWidth > el.clientWidth) {
      // fallback to ellipsis if it still doesn't fit
      el.style.overflow = 'hidden';
      el.style.textOverflow = 'ellipsis';
    } else {
      el.style.overflow = prev.overflow;
      el.style.textOverflow = prev.textOverflow;
    }

    // keep single-line appearance
    el.style.whiteSpace = 'nowrap';
  }

  function adjustAll() {
    const els = document.querySelectorAll(SELECTORS.join(','));
    els.forEach((el) => {
      try {
        fitElement(el);
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
