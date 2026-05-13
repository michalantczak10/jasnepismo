import type { CartItem, OrderConfirmationData } from "../types.js";
import { CartManager } from "./cart-manager.js";

/**
 * Show order confirmation modal after successful order submission
 */
export function showOrderConfirmationModal(
  data: OrderConfirmationData,
  cartManager: CartManager
): void {
  const existing = document.getElementById("order-confirm-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "order-confirm-modal";
  overlay.className = "order-confirm-modal-overlay";
  overlay.setAttribute("data-testid", "order-confirm-modal");

  const modal = document.createElement("div");
  modal.className = "order-confirm-modal";

  const body = document.createElement("div");
  body.className = "order-confirm-modal-body";

  const orderNum = (data.orderRef || data.orderId || "").toString();

  let paymentDetailsHTML = "";
  if (data.paymentTarget) {
    if (data.paymentTarget.includes("BLIK")) {
      const blikPhone = data.paymentTarget
        .replace(/^BLIK na telefon:\s*/i, "")
        .trim();
      paymentDetailsHTML = `
        <div class="order-confirm-modal-summary-row"><b>Odbiorca:</b><br><span class="order-confirm-modal-payment">Szkolne gazetki</span></div>
        <div class="order-confirm-modal-summary-row"><b>Numer telefonu:</b><br><span class="order-confirm-modal-payment">${blikPhone}</span></div>
      `;
    } else {
      paymentDetailsHTML = `
        <div class="order-confirm-modal-summary-row"><b>Odbiorca:</b><br><span class="order-confirm-modal-payment">Szkolne gazetki</span></div>
        <div class="order-confirm-modal-summary-row"><b>Numer konta:</b><br><span class="order-confirm-modal-payment">${data.paymentTarget}</span></div>
      `;
    }
  }

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:18px;">
      <span style="font-size:2.7em;line-height:1;">🎉</span>
      <div class="order-confirm-modal-thankyou">Dziękujemy. Twoje zamówienie nauczyciela zostało przyjęte.</div>
      <div style="font-size:1.13em;color:#1d4ed8;font-weight:700;">Dziękujemy za zakup materiałów do gazetki szkolnej.</div>
    </div>
    <div class="order-confirm-modal-summary-row"><b>Numer zamówienia:</b><br><span class="order-confirm-modal-ref">${orderNum}</span></div>
    <div class="order-confirm-modal-summary-row"><b>Do zapłaty:</b><br><span class="order-confirm-modal-total">${data.total || 0} zł</span></div>
    <div class="order-confirm-modal-summary-row"><b>Tytuł przelewu:</b><br><span class="order-confirm-modal-transfer">${data.transferTitle || `Zamówienie ${orderNum}`}</span></div>
    ${paymentDetailsHTML}
    <div class="order-confirm-modal-info">Link do pobrania produktu wyślemy ręcznie po zaksięgowaniu płatności.</div>
  `;
  modal.appendChild(body);

  const productsList = document.createElement("div");
  productsList.className = "checkout-summary-products";
  cartManager.getAll().forEach((item: CartItem) => {
    const row = document.createElement("div");
    row.className = "checkout-summary-product-row";
    let qtyLabel = "licencji";
    if (item.qty === 1) qtyLabel = "licencja";
    let imgHtml = "";
    if (item.image) {
      imgHtml = `<img src="${item.image}" alt="${item.name}" class="checkout-summary-product-img">`;
    }
    row.innerHTML = `${imgHtml}<span class="checkout-summary-product-name">${item.name}</span> — <span class="checkout-summary-product-qty">${item.qty} ${qtyLabel}</span> × <span class="checkout-summary-product-price">${item.price} zł</span>`;
    productsList.appendChild(row);
  });
  modal.appendChild(productsList);

  const actions = document.createElement("div");
  actions.className = "order-confirm-modal-actions";
  const okBtn = document.createElement("button");
  okBtn.className = "browse-products-btn clear-cart-btn";
  okBtn.textContent = "OK";

  const closeModal = () => {
    overlay.remove();
    document.removeEventListener("keydown", escHandler);
    const form = document.getElementById("checkoutForm") as HTMLFormElement | null;
    if (form) form.reset();
    const msg = document.getElementById("checkoutMessage");
    if (msg) msg.innerHTML = "";
  };

  function escHandler(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      closeModal();
    }
  }

  okBtn.addEventListener("click", closeModal);
  actions.appendChild(okBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.addEventListener("keydown", escHandler);
}
