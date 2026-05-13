type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const CONSENT_STORAGE_KEY = "cookieConsent_v1";

function readConsent(): CookieConsent | null {
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: consent }));
}

function buildBanner(): HTMLElement {
  const container = document.createElement("section");
  container.id = "cookieConsentRoot";
  container.className = "cookie-consent";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-label", "Ustawienia cookies");
  container.setAttribute("data-testid", "cookie-banner");

  container.innerHTML = `
    <div class="cookie-consent-card">
      <h3>Ustawienia cookies</h3>
      <p>
        Używamy tylko niezbędnych plików cookies i zapisujemy koszyk w Twojej przeglądarce.
        Opcjonalne cookies możesz zaakceptować lub odrzucić.
      </p>
      <div class="cookie-consent-actions">
        <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject" data-testid="btn-cookie-reject">Odrzuć opcjonalne</button>
        <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="settings" data-testid="btn-cookie-settings">Ustawienia</button>
        <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept" data-testid="btn-cookie-accept">Akceptuj wszystkie</button>
      </div>
      <p class="cookie-consent-note">
        Szczegóły: <a href="#legal" data-legal-open="privacy">Polityka prywatności</a>
      </p>
    </div>
    <div class="cookie-settings" hidden>
      <h4>Wybierz zgody</h4>
      <label class="cookie-settings-row">
        <input type="checkbox" checked disabled />
        <span>Niezbędne (wymagane do działania sklepu)</span>
      </label>
      <label class="cookie-settings-row">
        <input type="checkbox" id="cookieAnalytics" />
        <span>Analityczne</span>
      </label>
      <label class="cookie-settings-row">
        <input type="checkbox" id="cookieMarketing" />
        <span>Marketingowe</span>
      </label>
      <div class="cookie-consent-actions">
        <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="cancel-settings" data-testid="btn-cookie-cancel-settings">Anuluj</button>
        <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save-settings" data-testid="btn-cookie-save-settings">Zapisz ustawienia</button>
      </div>
    </div>
  `;

  return container;
}

function buildManageButton(): HTMLButtonElement {
  const manageBtn = document.createElement("button");
  manageBtn.type = "button";
  manageBtn.id = "cookieManageBtn";
  manageBtn.className = "cookie-manage-btn";
  manageBtn.textContent = "Ustawienia cookies";
  manageBtn.setAttribute("aria-label", "Otwórz ustawienia cookies");
  manageBtn.setAttribute("data-testid", "btn-cookie-manage");
  return manageBtn;
}

export function initCookieConsentBanner(): void {
  if (document.getElementById("cookieConsentRoot")) return;

  const banner = buildBanner();
  const settingsPanel = banner.querySelector(".cookie-settings") as HTMLElement;
  const analyticsCheckbox = banner.querySelector("#cookieAnalytics") as HTMLInputElement;
  const marketingCheckbox = banner.querySelector("#cookieMarketing") as HTMLInputElement;

  const manageBtn = buildManageButton();

  const openBanner = () => {
    banner.removeAttribute("hidden");
    settingsPanel.hidden = true;
  };

  const closeBanner = () => {
    banner.setAttribute("hidden", "true");
    settingsPanel.hidden = true;
  };

  const setConsentAndClose = (analytics: boolean, marketing: boolean) => {
    const consent: CookieConsent = {
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
    };
    saveConsent(consent);
    closeBanner();
  };

  const applySavedConsentToControls = (consent: CookieConsent) => {
    analyticsCheckbox.checked = consent.analytics;
    marketingCheckbox.checked = consent.marketing;
  };

  banner.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.getAttribute("data-cookie-action");
    if (!action) return;

    if (action === "accept") {
      setConsentAndClose(true, true);
      return;
    }

    if (action === "reject") {
      setConsentAndClose(false, false);
      return;
    }

    if (action === "settings") {
      settingsPanel.hidden = false;
      return;
    }

    if (action === "cancel-settings") {
      settingsPanel.hidden = true;
      return;
    }

    if (action === "save-settings") {
      setConsentAndClose(analyticsCheckbox.checked, marketingCheckbox.checked);
    }
  });

  manageBtn.addEventListener("click", () => {
    const saved = readConsent();
    if (saved) {
      applySavedConsentToControls(saved);
    }
    openBanner();
  });

  document.body.appendChild(banner);
  document.body.appendChild(manageBtn);

  const savedConsent = readConsent();
  if (savedConsent) {
    applySavedConsentToControls(savedConsent);
    closeBanner();
  } else {
    openBanner();
  }
}
