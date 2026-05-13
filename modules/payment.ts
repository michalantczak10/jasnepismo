import { STORE_CONFIG } from "../config/store.js";

/**
 * Render payment instructions based on selected payment method
 */
export function renderPaymentInstructions(
  paymentMethodSelect: HTMLSelectElement | null,
  instructionsContainer: HTMLElement | null
): void {
  if (!paymentMethodSelect || !instructionsContainer) return;

  const paymentConfig = STORE_CONFIG.payment;

  if (paymentMethodSelect.value === "blik") {
    instructionsContainer.innerHTML = `
      <p><strong>Odbiorca:</strong> ${paymentConfig.accountHolder}</p>
      <p><strong>Numer telefonu:</strong> ${paymentConfig.blikPhone}</p>
      <p><small>W tytule wpisz numer zamówienia po jego utworzeniu.</small></p>
    `;
  } else {
    instructionsContainer.innerHTML = `
      <p><strong>Odbiorca:</strong> ${paymentConfig.accountHolder}</p>
      <p><strong>Numer konta:</strong> ${paymentConfig.accountNumber}</p>
      <p><small>W tytule wpisz numer zamówienia po jego utworzeniu.</small></p>
    `;
  }
}

/**
 * Setup payment method change handler
 */
export function setupPaymentMethodHandler(
  paymentMethodSelect: HTMLSelectElement | null,
  instructionsContainer: HTMLElement | null
): void {
  if (!paymentMethodSelect) return;

  paymentMethodSelect.addEventListener("change", () => {
    renderPaymentInstructions(paymentMethodSelect, instructionsContainer);
  });

  // Render initial state
  renderPaymentInstructions(paymentMethodSelect, instructionsContainer);
}
