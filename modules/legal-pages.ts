/**
 * Setup table of contents links for legal pages (terms, privacy)
 */
export function setupLegalPageNavigation(): void {
  const legalTocLinks = document.querySelectorAll(
    'nav[aria-label="Spis treści"] a[href^="#"]'
  ) as NodeListOf<HTMLAnchorElement>;

  const LEGAL_SCROLL_OFFSET = 24;

  const scrollToLegalHash = (hash: string, pushHash = false) => {
    if (!hash || !hash.startsWith("#")) return;
    const target = document.querySelector(hash) as HTMLElement | null;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - LEGAL_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    if (pushHash) {
      history.replaceState(null, "", hash);
    }
  };

  if (legalTocLinks.length > 0) {
    legalTocLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href") || "";
        if (!hash.startsWith("#")) return;
        event.preventDefault();
        scrollToLegalHash(hash, true);
      });
    });

    // Handle initial hash if present
    if (window.location.hash) {
      setTimeout(() => scrollToLegalHash(window.location.hash), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}
