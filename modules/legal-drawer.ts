type LegalDocument = "terms" | "privacy";

function isLegalDocument(value: string | null): value is LegalDocument {
  return value === "terms" || value === "privacy";
}

export function setupLegalDrawer(): void {
  const drawer = document.getElementById("legalDrawer") as HTMLElement | null;
  const overlay = document.getElementById("legalDrawerOverlay") as HTMLElement | null;
  const closeBtn = document.getElementById("legalDrawerClose") as HTMLButtonElement | null;

  if (!drawer || !overlay || !closeBtn) return;

  const switchButtons = Array.from(
    drawer.querySelectorAll("[data-legal-switch]")
  ) as HTMLButtonElement[];

  const docs = Array.from(
    drawer.querySelectorAll("[data-legal-doc]")
  ) as HTMLElement[];

  let isOpen = false;
  let lastFocusedElement: HTMLElement | null = null;

  const getFocusableElements = (): HTMLElement[] => {
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];

    return Array.from(drawer.querySelectorAll<HTMLElement>(selectors.join(","))).filter(
      (el) => !el.hasAttribute("hidden")
    );
  };

  const switchDocument = (doc: LegalDocument) => {
    switchButtons.forEach((button) => {
      const active = button.dataset.legalSwitch === doc;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.tabIndex = active ? 0 : -1;
    });

    docs.forEach((panel) => {
      const active = panel.dataset.legalDoc === doc;
      panel.hidden = !active;
    });
  };

  const closeDrawer = () => {
    if (!isOpen) return;

    isOpen = false;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("open");
    document.body.classList.remove("legal-drawer-open");

    window.setTimeout(() => {
      overlay.hidden = true;
      if (!isOpen) drawer.hidden = true;
    }, 260);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  const openDrawer = (doc: LegalDocument, trigger?: HTMLElement) => {
    lastFocusedElement = trigger ?? (document.activeElement as HTMLElement | null);

    switchDocument(doc);
    drawer.hidden = false;
    overlay.hidden = false;

    // Trigger transitions after hidden attributes are removed.
    window.requestAnimationFrame(() => {
      drawer.classList.add("open");
      overlay.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("legal-drawer-open");
      isOpen = true;
      closeBtn.focus();
    });
  };

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest("[data-legal-open]") as HTMLElement | null;
    if (!trigger) return;

    const doc = trigger.getAttribute("data-legal-open");
    if (!isLegalDocument(doc)) return;

    event.preventDefault();
    openDrawer(doc, trigger);
  });

  switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const doc = button.getAttribute("data-legal-switch");
      if (!isLegalDocument(doc)) return;
      switchDocument(doc);
    });
  });

  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
