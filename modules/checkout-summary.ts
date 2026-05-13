import { CartManager } from "./cart-manager.js";

/**
 * Render checkout summary including product list and totals
 */
export function renderCheckoutSummary(cartManager: CartManager): void {
  const summaryEl = document.getElementById("checkoutSummary");
  if (!summaryEl) return;
  summaryEl.innerHTML = "";

  const cart = cartManager.getAll();

  // Empty cart state
  if (cart.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "checkout-summary-empty";
    emptyMsg.innerHTML = `
      <div class="emoji">🛒</div>
      <div class="message">Koszyk jest pusty.</div>
      <div class="submessage">Dodaj grafikę i ustaw liczbę licencji dla szkół, aby kontynuować.</div>
    `;

    const browseBtn = document.createElement("button");
    browseBtn.type = "button";
    browseBtn.textContent = "Przeglądaj ofertę";
    browseBtn.className = "browse-products-btn";
    browseBtn.setAttribute("data-testid", "btn-browse-offer");
    browseBtn.addEventListener("click", () => {
      const section =
        document.getElementById("products") ||
        document.querySelector(".products-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
    emptyMsg.appendChild(browseBtn);
    summaryEl.appendChild(emptyMsg);

    const clearBtn = document.getElementById("clearCartBtn") as
      | HTMLButtonElement
      | null;
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

  const productsTotal = cartManager.getTotalPrice();
  const itemsCount = cartManager.getTotalItemsCount();

  const productsList = document.createElement("div");
  productsList.className = "checkout-summary-products";
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "checkout-summary-product-row";

    let qtyLabel = "licencji";
    if (item.qty === 1) qtyLabel = "licencja";

    let imgHtml = "";
    if (item.image) {
      imgHtml = `<img src="${item.image}" alt="${item.name}" class="checkout-summary-product-img">`;
    }

    row.innerHTML = `
      <div class="checkout-summary-product-main">
        ${imgHtml}
        <div class="checkout-summary-product-meta">
          <span class="checkout-summary-product-name">${item.categoryName ? `${item.categoryName} – ${item.name}` : item.name}</span>
          <span class="checkout-summary-product-unit">${item.qty} ${qtyLabel} × ${item.price} zł</span>
        </div>
        <div class="checkout-summary-product-actions">
          <button class="cart-btn cart-btn-decrease" data-product-key="${item.key}" data-testid="btn-cart-decrease" title="Zmniejsz ilość">-</button>
          <span class="checkout-summary-product-qty">${item.qty}</span>
          <button class="cart-btn cart-btn-increase" data-product-key="${item.key}" data-testid="btn-cart-increase" title="Zwiększ ilość">+</button>
          <button class="cart-btn cart-btn-remove" data-product-key="${item.key}" data-testid="btn-remove-from-cart" title="Usuń produkt">×</button>
        </div>
      </div>
      <div class="checkout-summary-product-total">Razem: ${item.qty * item.price} zł</div>
    `;
    productsList.appendChild(row);
  });
  summaryEl.appendChild(productsList);

  const clearBtnShow = document.getElementById("clearCartBtn") as
    | HTMLButtonElement
    | null;
  if (clearBtnShow) clearBtnShow.style.display = "";

  const hr1 = document.createElement("hr");
  hr1.className = "checkout-summary-hr";
  summaryEl.appendChild(hr1);

  const productsLine = document.createElement("div");
  productsLine.innerHTML = `<strong>Licencje w koszyku:</strong> ${productsTotal} zł`;
  productsLine.className = "checkout-summary-total-line";
  summaryEl.appendChild(productsLine);

  const itemsLine = document.createElement("div");
  itemsLine.className = "checkout-summary-delivery-line";
  itemsLine.innerHTML = `<strong>Łączna liczba licencji:</strong> ${itemsCount}`;
  summaryEl.appendChild(itemsLine);

  const hr2 = document.createElement("hr");
  hr2.className = "checkout-summary-hr";
  summaryEl.appendChild(hr2);

  const totalLine = document.createElement("div");
  totalLine.innerHTML = `<span class="checkout-summary-final-label">Do zapłaty:</span> <span class="checkout-summary-final">${productsTotal} zł</span>`;
  totalLine.className = "checkout-summary-final-line";
  summaryEl.appendChild(totalLine);

  const clearBtnEl = document.getElementById("clearCartBtn") as
    | HTMLButtonElement
    | null;
  if (!clearBtnEl) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "clearCartBtn";
    btn.className = "browse-products-btn clear-cart-btn";
    btn.setAttribute("data-testid", "btn-clear-cart");
    btn.textContent = "Wyczyść koszyk";

    const actionsRow = document.createElement("div");
    actionsRow.className = "checkout-actions-row";
    actionsRow.appendChild(btn);
    summaryEl.appendChild(actionsRow);

    updateClearButtonState(btn, cart.length);
  } else {
    updateClearButtonState(clearBtnEl, cart.length);
  }
}

function updateClearButtonState(btn: HTMLButtonElement, cartLength: number) {
  if (cartLength === 0) {
    btn.disabled = true;
    btn.classList.add("btn-disabled");
    btn.title = "Koszyk jest pusty";
  } else {
    btn.disabled = false;
    btn.classList.remove("btn-disabled");
    btn.title = "Usuń wszystkie produkty z zamówienia";
  }
}
