import type { OrderData, OrderConfirmationData } from "../types.js";
import { CartManager } from "./cart-manager.js";
import { API_BASE_URL, ApiHttpError, apiFetch } from "../config/api.js";
import { showToast } from "./utils.js";

export interface FormElements {
  checkoutForm: HTMLFormElement | null;
  submitButton: HTMLButtonElement | null;
  checkoutMessage: HTMLElement | null;
  paymentMethod: HTMLSelectElement | null;
  paymentInstructions: HTMLElement | null;
  customerName: HTMLInputElement | null;
  customerEmail: HTMLInputElement | null;
  customerPhone: HTMLInputElement | null;
  customerNotes: HTMLTextAreaElement | null;
}

/**
 * Get all required form elements
 */
export function getFormElements(): FormElements {
  return {
    checkoutForm: document.getElementById("checkoutForm") as HTMLFormElement | null,
    submitButton: document.getElementById("submitOrderBtn") as HTMLButtonElement | null,
    checkoutMessage: document.getElementById("checkoutMessage") as HTMLElement | null,
    paymentMethod: document.getElementById("paymentMethod") as HTMLSelectElement | null,
    paymentInstructions: document.getElementById("paymentInstructions") as HTMLElement | null,
    customerName: document.getElementById("customerName") as HTMLInputElement | null,
    customerEmail: document.getElementById("customerEmail") as HTMLInputElement | null,
    customerPhone: document.getElementById("customerPhone") as HTMLInputElement | null,
    customerNotes: document.getElementById("customerNotes") as HTMLTextAreaElement | null,
  };
}

/**
 * Build order data for submission
 */
export function buildOrderData(
  cartManager: CartManager,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  paymentMethod: string,
  notes: string
): OrderData {
  return {
    items: cartManager.getAll().map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
    customerName,
    customerEmail,
    customerPhone: customerPhone.replace(/\D/g, ""),
    paymentMethod,
    productsTotal: cartManager.getTotalPrice(),
    total: cartManager.getTotalPrice(),
    notes,
  };
}

/**
 * Submit order to backend
 */
export async function submitOrder(
  orderData: OrderData
): Promise<OrderConfirmationData | null> {
  try {
    const result = await apiFetch<OrderConfirmationData>(
      "/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      },
      10000
    );

    return result;
  } catch (error) {
    const isLocalhostUi =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const pointsToLocalApi =
      API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");

    if (
      error instanceof ApiHttpError &&
      error.status === 404 &&
      isLocalhostUi
    ) {
      showToast(
        "Lokalne API zamówień nie jest uruchomione. Uruchom backend przez npm run dev:api lub npm run dev:full.",
        { sticky: true }
      );
      return null;
    }

    if (error instanceof TypeError && isLocalhostUi && pointsToLocalApi) {
      showToast(
        "Brak połączenia z lokalnym API zamówień na porcie 3000. Uruchom npm run dev:api lub npm run dev:full.",
        { sticky: true }
      );
      return null;
    }

    const message = error instanceof Error ? error.message : String(error);
    showToast(`Błąd podczas wysyłania zamówienia: ${message}`, { sticky: true });
    return null;
  }
}

/**
 * Update submit button state
 */
export function setSubmitButtonLoading(
  btn: HTMLButtonElement | null,
  isLoading: boolean,
  defaultText: string = "Zamawiam teraz"
): void {
  if (!btn) return;

  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Wysyłanie zamówienia..." : defaultText;

  if (isLoading) {
    btn.classList.add("btn-loading");
  } else {
    btn.classList.remove("btn-loading");
  }
}

/**
 * Set checkout message
 */
export function setCheckoutMessage(
  container: HTMLElement | null,
  message: string
): void {
  if (container) {
    container.innerText = message;
  }
}
