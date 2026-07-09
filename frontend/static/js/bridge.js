// =============================================================================
// bridge.js
// =============================================================================
// Every page talks to Python through this one file instead of calling
// `window.pywebview.api.*` directly. Two reasons:
//
//   1. pywebview injects `window.pywebview` a moment *after* the page loads,
//      so calling the API too early just throws "pywebview is undefined".
//      `waitForPywebview()` below handles that race condition once, here,
//      instead of every page having to remember to wait for it.
//
//   2. While you're just tweaking HTML/CSS, it's much faster to open these
//      pages directly in a normal browser than to relaunch the whole .exe
//      each time. When `window.pywebview` isn't there (i.e. you're in a
//      browser, not the app), every function below silently falls back to
//      the MOCK data at the bottom of this file, so the UI still renders.
// =============================================================================

function waitForPywebview() {
  return new Promise((resolve) => {
    if (window.pywebview && window.pywebview.api) return resolve(true);
    window.addEventListener("pywebviewready", () => resolve(true), { once: true });
    // If pywebview never shows up at all (plain browser preview), stop
    // waiting after 400ms and fall back to mock data instead of hanging.
    setTimeout(() => resolve(!!(window.pywebview && window.pywebview.api)), 400);
  });
}

// Mock data used only for browser-preview mode (see note above). Shapes here
// must match exactly what api.py actually returns — see api.py's docstrings.
const MOCK = {
  get_portfolio_value: () => 2505.75,
  get_networth_history: () => [
    { date: "2026-06-08", value: 2380 },
    { date: "2026-06-09", value: 2290 },
    { date: "2026-06-10", value: 2410 },
    { date: "2026-06-11", value: 2455 },
    { date: "2026-06-12", value: 2505.75 },
  ],
  get_total_capital: () => 2200.0,
  get_profit: () => 305.75,
  get_quote: (symbol) => ({ symbol, price: 100 + Math.random() * 200, change_pct: (Math.random() - 0.4) * 5 }),
  search_stock_symbol: (query) =>
    ["AAPL", "AMZN", "NVDA", "MSFT", "GOOGL", "TSLA"]
      .filter((s) => s.toLowerCase().includes((query || "").toLowerCase()))
      .map((s) => ({ symbol: s, name: s })),
  get_stock_history: () => [
    { label: "2026-06-01", value: 148.2 },
    { label: "2026-06-02", value: 149.1 },
    { label: "2026-06-03", value: 147.8 },
    { label: "2026-06-04", value: 151.4 },
    { label: "2026-06-05", value: 154.9 },
  ],
  get_shares_owned: () => 1.42,
  create_transac: () => 1,
  get_transacs: () => [
    { id: 1, date: "2026-06-10", symbol: "NVDA", amount: 500 },
    { id: 2, date: "2026-05-02", symbol: "AAPL", amount: 300 },
  ],
  get_transac_current_value: (id) => (id === 1 ? 701.2 : 293.4),
};

async function call(method, ...args) {
  const ready = await waitForPywebview();
  if (ready && window.pywebview?.api?.[method]) {
    return window.pywebview.api[method](...args);
  }
  console.warn(`[bridge] pywebview.api.${method} unavailable — using mock data (browser preview mode)`);
  if (MOCK[method]) return MOCK[method](...args);
  throw new Error(`No bridge or mock implementation for "${method}"`);
}

// Public, camelCase API used by every page. Each of these maps 1:1 to a
// method on the Api class in api.py — see that file for exact return shapes.
export const api = {
  getPortfolioValue: () => call("get_portfolio_value"), // live total value of all positions (float)
  getNetworthHistory: (limit = null) => call("get_networth_history", limit), // [{date, value}, ...]
  getTotalCapital: () => call("get_total_capital"), // total $ ever invested (float)
  getProfit: () => call("get_profit"), // portfolio value - total invested (float, can be negative)

  getQuote: (symbol) => call("get_quote", symbol), // {symbol, price, change_pct}
  searchStockSymbol: (query) => call("search_stock_symbol", query), // [{symbol, name}, ...]
  getStockHistory: (symbol, period) => call("get_stock_history", symbol, period), // [{label, value}, ...]
  getSharesOwned: (symbol) => call("get_shares_owned", symbol), // float

  createTransac: (symbol, amount) => call("create_transac", symbol, amount), // 1 on success
  getTransacs: () => call("get_transacs"), // [{id, date, symbol, amount}, ...]
  getTransacCurrentValue: (transacId) => call("get_transac_current_value", transacId), // float, current $ value (NOT a %)
};
