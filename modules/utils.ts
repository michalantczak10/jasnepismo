import type { ToastVariant } from "../types.js";

const TOAST_BASE_DURATION_MS = 21000;
const TOAST_ANIMATION_MS = 180;
const TOAST_SUCCESS_DURATION_MS = 18000;
const TOAST_WARNING_DURATION_MS = 30000;
const TOAST_LONG_MESSAGE_CHARS = 90;
const TOAST_LONG_MESSAGE_BONUS_MS = 4500;

interface ToastOptions {
  durationMs?: number;
  sticky?: boolean;
}

function getToastVariant(text: string): ToastVariant {
  if (/dodano|zapisano|wysłano|gotowe|udane/i.test(text)) return "success";
  if (/usun|wyczyść|wyczyszcz|brak|popraw|błąd|nie udało|nieprawidł/i.test(text))
    return "warning";
  return "info";
}

function getToastIcon(text: string, variant: ToastVariant): string {
  if (/usun|wyczyść|wyczyszcz/i.test(text)) return "🗑️";
  if (variant === "success") return "✅";
  if (variant === "warning") return "⚠️";
  return "ℹ️";
}

function getToastDuration(message: string, variant: ToastVariant): number {
  let duration = TOAST_BASE_DURATION_MS;

  if (variant === "success") {
    duration = TOAST_SUCCESS_DURATION_MS;
  } else if (variant === "warning") {
    duration = TOAST_WARNING_DURATION_MS;
  }

  if (message.length >= TOAST_LONG_MESSAGE_CHARS) {
    duration += TOAST_LONG_MESSAGE_BONUS_MS;
  }

  return duration;
}

function clearToastTimers(toast: HTMLElement): void {
  const previousHideTimer = Number(toast.dataset.hideTimer || "0");
  if (previousHideTimer) {
    window.clearTimeout(previousHideTimer);
    toast.dataset.hideTimer = "0";
  }

  const previousFinalizeTimer = Number(toast.dataset.finalizeTimer || "0");
  if (previousFinalizeTimer) {
    window.clearTimeout(previousFinalizeTimer);
    toast.dataset.finalizeTimer = "0";
  }
}

function hideToast(toast: HTMLElement): void {
  toast.dataset.sticky = "0";
  toast.classList.remove("toast-show");
  toast.classList.add("toast-hide");

  const finalizeTimer = window.setTimeout(() => {
    toast.classList.remove("toast-hide");
    toast.dataset.finalizeTimer = "0";
  }, TOAST_ANIMATION_MS);

  toast.dataset.finalizeTimer = String(finalizeTimer);
  toast.dataset.hideTimer = "0";
}

function scheduleToastHide(toast: HTMLElement, durationMs: number): void {
  toast.dataset.remainingMs = String(durationMs);
  toast.dataset.startedAt = String(Date.now());

  const hideTimer = window.setTimeout(() => {
    hideToast(toast);
  }, durationMs);

  toast.dataset.hideTimer = String(hideTimer);
}

function ensureToastHoverPause(toast: HTMLElement): void {
  if (toast.dataset.pauseBound === "1") return;
  toast.dataset.pauseBound = "1";

  toast.addEventListener("mouseenter", () => {
    if (toast.dataset.sticky === "1") return;

    const startedAt = Number(toast.dataset.startedAt || "0");
    const remainingMs = Number(toast.dataset.remainingMs || "0");
    if (!startedAt || !remainingMs) return;

    const elapsedMs = Date.now() - startedAt;
    const nextRemainingMs = Math.max(0, remainingMs - elapsedMs);
    toast.dataset.remainingMs = String(nextRemainingMs);

    const hideTimer = Number(toast.dataset.hideTimer || "0");
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      toast.dataset.hideTimer = "0";
    }
  });

  toast.addEventListener("mouseleave", () => {
    if (toast.dataset.sticky === "1") return;
    if (!toast.classList.contains("toast-show")) return;

    const remainingMs = Number(toast.dataset.remainingMs || "0");
    if (remainingMs <= 0) {
      hideToast(toast);
      return;
    }

    scheduleToastHide(toast, remainingMs);
  });
}

/**
 * Show a toast notification
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  let toast = document.getElementById("toastMessage");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastMessage";
    toast.className = "toast";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true"></span>
      <span class="toast-text"></span>
    `;
    document.body.appendChild(toast);
  }

  ensureToastHoverPause(toast);

  const variant = getToastVariant(message);
  const icon = getToastIcon(message, variant);
  const durationMs = options.durationMs && options.durationMs > 0
    ? options.durationMs
    : getToastDuration(message, variant);
  const iconEl = toast.querySelector(".toast-icon") as HTMLElement | null;
  const textEl = toast.querySelector(".toast-text") as HTMLElement | null;

  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = message;

  toast.classList.remove("toast-success", "toast-warning", "toast-info");
  toast.classList.add(`toast-${variant}`);

  toast.classList.remove("toast-show");
  toast.classList.add("toast-hide");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      toast?.classList.remove("toast-hide");
      toast?.classList.add("toast-show");
    });
  });

  clearToastTimers(toast);

  if (options.sticky) {
    toast.dataset.sticky = "1";
    toast.dataset.hideTimer = "0";
    toast.dataset.remainingMs = "0";
    toast.dataset.startedAt = "0";
  } else {
    toast.dataset.sticky = "0";
    scheduleToastHide(toast, durationMs);
  }

  toast.onclick = () => {
    hideToast(toast as HTMLElement);
  };
}

/**
 * Show a confirmation modal and return user's choice
 */
export function showConfirmModal(
  title: string,
  message: string,
  singleButton = false
): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "confirm-modal";

    const h = document.createElement("h3");
    h.textContent = title;
    h.className = "confirm-modal-title";
    const p = document.createElement("p");
    p.textContent = message;
    p.className = "confirm-modal-message";

    const actions = document.createElement("div");
    actions.className = "confirm-actions";

    if (singleButton) {
      const btnOk = document.createElement("button");
      btnOk.className = "btn btn-confirm";
      btnOk.textContent = "OK";
      btnOk.addEventListener("click", () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      actions.appendChild(btnOk);
    } else {
      const btnCancel = document.createElement("button");
      btnCancel.className = "browse-products-btn btn-cancel";
      btnCancel.textContent = "Anuluj";
      btnCancel.addEventListener("click", () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      const btnConfirm = document.createElement("button");
      btnConfirm.className = "browse-products-btn btn-confirm";
      btnConfirm.textContent = "Tak, wyczyść";
      btnConfirm.addEventListener("click", () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      actions.appendChild(btnCancel);
      actions.appendChild(btnConfirm);
    }

    dialog.appendChild(h);
    dialog.appendChild(p);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}
