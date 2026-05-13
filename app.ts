// Core imports
import { initCookieConsentBanner } from "./modules/cookie-consent.js";
import { CartManager } from "./modules/cart-manager.js";
import { showToast, showConfirmModal } from "./modules/utils.js";

// Feature modules
import { applyCategoryConfiguration, setupCategoryCardToggles, setupCartItemHandlers, applyStoreConfiguration } from "./modules/products.js";
import { renderCheckoutSummary } from "./modules/checkout-summary.js";
import { showOrderConfirmationModal } from "./modules/order-confirmation.js";
import { setupPaymentMethodHandler } from "./modules/payment.js";
import { setupLegalPageNavigation } from "./modules/legal-pages.js";
import { setupLegalDrawer } from "./modules/legal-drawer.js";
import {
  validateName,
  validateEmail,
  validatePhone,
  formatPhoneInput,
  validateOrderNotes,
  handleNotesInput,
} from "./modules/form-validation.js";
import {
  getFormElements,
  buildOrderData,
  submitOrder,
  setSubmitButtonLoading,
  setCheckoutMessage,
} from "./modules/form-handlers.js";

const cartManager = new CartManager();

window.addEventListener("DOMContentLoaded", () => {
  initCookieConsentBanner();
  applyStoreConfiguration();
  applyCategoryConfiguration();
  setupLegalPageNavigation();
  setupLegalDrawer();
  setupCategoryCardToggles(cartManager);
  setupCartItemHandlers(cartManager);
  renderCheckoutSummary(cartManager);

  const {
    checkoutForm,
    submitButton,
    checkoutMessage,
    paymentMethod,
    paymentInstructions,
    customerName,
    customerEmail,
    customerPhone,
    customerNotes,
  } = getFormElements();

  if (!checkoutForm || !customerName || !customerEmail || !customerPhone) {
    console.warn("Missing critical form elements");
    return;
  }

  // Payment method
  setupPaymentMethodHandler(paymentMethod, paymentInstructions);

  // Clear cart button (event delegation — button may be re-created on each render)
  document.getElementById("checkoutSummary")?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.id === "clearCartBtn" || target.closest("#clearCartBtn")) {
      void (async () => {
        const confirmed = await showConfirmModal("Wyczyść koszyk", "Na pewno chcesz wyczyścić całe zamówienie?");
        if (confirmed) {
          cartManager.clear();
          renderCheckoutSummary(cartManager);
          showToast("Podsumowanie licencji zostało wyczyszczone.");
        }
      })();
    }
  });

  // Validation listeners
  customerName.addEventListener("blur", () => validateName(customerName, true));
  customerEmail.addEventListener("blur", () => validateEmail(customerEmail, true));
  customerPhone.addEventListener("input", formatPhoneInput);
  customerPhone.addEventListener("blur", () => validatePhone(customerPhone, true));
  customerNotes?.addEventListener("input", handleNotesInput);

  // Form submission
  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (cartManager.isEmpty()) {
      showToast("Podsumowanie nie zawiera wybranego produktu. Dodaj licencje przed złożeniem zamówienia.", {
        sticky: true,
      });
      document.getElementById("checkoutSummary")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const nameValid = validateName(customerName, true);
    const emailValid = validateEmail(customerEmail, true);
    const phoneValid = validatePhone(customerPhone, true);
    const notesValid = !customerNotes || validateOrderNotes(customerNotes, true);

    if (!nameValid || !emailValid || !phoneValid || !notesValid) {
      setCheckoutMessage(checkoutMessage, "Popraw zaznaczone pola formularza.");
      showToast("Popraw zaznaczone pola formularza.", { sticky: true });
      if (!nameValid) customerName.focus();
      else if (!emailValid) customerEmail.focus();
      else if (!phoneValid) customerPhone.focus();
      else customerNotes?.focus();
      return;
    }

    setSubmitButtonLoading(submitButton, true);
    setCheckoutMessage(checkoutMessage, "Wysyłanie zamówienia nauczyciela...");

    const response = await submitOrder(
      buildOrderData(
        cartManager,
        customerName.value.trim(),
        customerEmail.value.trim(),
        customerPhone.value.replace(/\D/g, ""),
        paymentMethod?.value ?? "bank_transfer",
        customerNotes?.value.trim() ?? ""
      )
    );

    setSubmitButtonLoading(submitButton, false);

    if (response) {
      setCheckoutMessage(checkoutMessage, "");
      showOrderConfirmationModal(response, cartManager);
      cartManager.clear();
      renderCheckoutSummary(cartManager);
      checkoutForm.reset();
    } else {
      setCheckoutMessage(checkoutMessage, "Błąd podczas wysyłania zamówienia nauczyciela.");
    }
  });
});

