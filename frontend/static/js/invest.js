// Three things happen on this page:
//   1. Search bar -> api.searchStockSymbol() (Finnhub symbol_lookup) shows a
//      dropdown; picking a result calls loadSymbol().
//   2. loadSymbol() loads a quote, your current share count, and a price
//      history chart for whichever symbol is selected.
//   3. The buy form -> api.createTransac(symbol, amount), which just
//      inserts a (date, stock, capital) row — no share count is stored at
//      buy time in your schema, it's recomputed later on demand.
// =============================================================================

import { renderShell } from "./shell.js";
import { api } from "./bridge.js";
import { renderPerformanceChart } from "./charts.js";

let currentSymbol = null;
let currentPrice = 0;
let currentPeriod = "1M";
let searchDebounce = null;
// remember the "description" text from whichever search result the user actually clicked, and fall back
// to just showing the ticker symbol if we don't have one (e.g. arriving via a dashboard "Invest" link with no prior search).
let currentName = null;

function fmtMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function renderSearchResults(results) {
  const box = document.getElementById("search-results");
  if (!results.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  box.innerHTML = results
    .map(
      (r) => `
    <button data-symbol="${r.symbol}" data-name="${r.name}" class="search-result-item w-full flex items-center justify-between px-md py-sm hover:bg-white/5 transition-colors text-left">
      <span class="font-label-mono text-label-mono text-on-surface">${r.symbol}</span>
      <span class="font-body-base text-sm text-on-surface-variant/60 truncate ml-md">${r.name || ""}</span>
    </button>`
    )
    .join("");
  box.classList.remove("hidden");

  box.querySelectorAll(".search-result-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const symbol = btn.getAttribute("data-symbol");
      const name = btn.getAttribute("data-name");
      document.getElementById("symbol-search").value = symbol;
      box.classList.add("hidden");
      loadSymbol(symbol, name);
    });
  });
}

async function loadChart(symbol, period) {
  const points = await api.getStockHistory(symbol, period);
  renderPerformanceChart("performance-chart", points);
}

async function loadSymbol(symbol, name = null) {
  currentSymbol = symbol;
  currentName = name || symbol;

  // Quote, shares owned, and the chart are independent network calls —
  // fire them together instead of waiting on each one in sequence.
  const [quote, shares] = await Promise.all([
    api.getQuote(symbol),
    api.getSharesOwned(symbol),
  ]);
  currentPrice = quote.price;

  document.getElementById("quote-name").textContent = currentName;
  document.getElementById("quote-price").textContent = fmtMoney(quote.price);
  document.getElementById("quote-shares").textContent = `${shares.toFixed(4)} ${symbol}`;

  recomputeEstimatedShares();
  await loadChart(symbol, currentPeriod);
}

/**
 * Live-updates the "ESTIMATED SHARES" readout as the user types an amount.
 * This is a client-side ESTIMATE only (amount / current quote price) — the
 * actual share count your backend later computes for this transaction
 * uses the closing price ON THE TRANSACTION'S CALENDAR DATE 
 */
function recomputeEstimatedShares() {
  const amountInput = document.getElementById("invest-amount");
  const est = document.getElementById("estimated-shares");
  const value = parseFloat(amountInput.value);
  if (!isNaN(value) && currentPrice > 0) {
    est.textContent = (value / currentPrice).toFixed(4);
  } else {
    est.textContent = "0.00";
  }
}

function setActivePeriodButton(period) {
  document.querySelectorAll(".period-btn").forEach((btn) => {
    if (btn.getAttribute("data-period") === period) {
      btn.classList.add("text-primary-fixed", "border-primary-fixed");
    } else {
      btn.classList.remove("text-primary-fixed", "border-primary-fixed");
    }
  });
}

async function refreshTotalInvested() {
  const total = await api.getTotalCapital();
  document.getElementById("total-invested-line").textContent = `Total Invested: ${fmtMoney(total)}`;
  // Keep the sidebar figure (rendered by shell.js) in sync too, without a
  // full page reload.
  const sidebarEl = document.getElementById("sidebar-total-invested");
  if (sidebarEl) sidebarEl.textContent = `${fmtMoney(total)} Invested`;
}

function showFeedback(message, ok = true) {
  const el = document.getElementById("buy-feedback");
  el.textContent = message;
  el.classList.remove("hidden", "text-primary-fixed", "text-secondary");
  el.classList.add(ok ? "text-primary-fixed" : "text-secondary");
}

async function init() {
  await renderShell("invest");

  // --- Search bar -------------------------------------------------------
  const searchInput = document.getElementById("symbol-search");
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value.trim();
    if (!query) {
      renderSearchResults([]);
      return;
    }
    // Debounce so we're not firing a Finnhub symbol_lookup call on every single keystroke.
    searchDebounce = setTimeout(async () => {
      try {
        const results = await api.searchStockSymbol(query);
        renderSearchResults(results || []);
      } catch (e) {
        console.error("search_stock_symbol failed", e);
      }
    }, 250);
  });

  document.addEventListener("click", (e) => {
    const box = document.getElementById("search-results");
    if (!box.contains(e.target) && e.target !== searchInput) box.classList.add("hidden");
  });

  // --- 1D / 1W / 1M / 1Y chart period toggle -----------------------------
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      currentPeriod = btn.getAttribute("data-period");
      setActivePeriodButton(currentPeriod);
      if (currentSymbol) await loadChart(currentSymbol, currentPeriod);
    });
  });

  document.getElementById("invest-amount").addEventListener("input", recomputeEstimatedShares);

  // --- Buy order -----------------------------------------------------
  document.getElementById("execute-buy").addEventListener("click", async () => {
    const amount = parseFloat(document.getElementById("invest-amount").value);
    if (!currentSymbol) {
      showFeedback("Select a stock to invest in first.", false);
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showFeedback("Enter a valid amount to invest.", false);
      return;
    }
    try {
      await api.createTransac(currentSymbol, amount);
      showFeedback(`Order recorded: ${fmtMoney(amount)} into ${currentSymbol}.`, true);
      document.getElementById("invest-amount").value = "";
      recomputeEstimatedShares();
      // Refresh everything that just changed: total invested (sidebar +
      // this page) and the "Your Shares" figure for this symbol.
      await Promise.all([refreshTotalInvested(), loadSymbol(currentSymbol, currentName)]);
    } catch (e) {
      console.error(e);
      showFeedback("Order failed — check the terminal running main.py for details.", false);
    }
  });

  await refreshTotalInvested();

  // Pre-select a symbol if navigated here with ?symbol=NVDA (for example: from a
  // dashboard "Invest" button). We don't have a company name in that case
  // since no search happened, so loadSymbol() just falls back to the
  // ticker itself as the display name.
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get("symbol");
  if (preselect) {
    document.getElementById("symbol-search").value = preselect;
    await loadSymbol(preselect);
  }
}

init();
