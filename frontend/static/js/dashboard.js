// =============================================================================
// dashboard.js — Portfolio page (frontend/dashboard.html)
// =============================================================================
// Loads and renders three independent things on this page:
//   1. Hero "$ total portfolio value" figure + sparkline chart
//      (getPortfolioValue() for the number, getNetworthHistory() for the chart)
//   2. Popular Stocks grid — a fixed watchlist, one getQuote() call each
//   3. Index Funds grid — same idea, for SPY/QQQ/DIA
//
// Every stock card needs its OWN network round-trip (Finnhub + yfinance,
// via api.getQuote), so this file fires them all in parallel with
// Promise.all() rather than one at a time — with 9 total tickers on this
// page (6 watchlist + 3 index funds), doing them sequentially would make
// the page visibly crawl.
// =============================================================================

import { renderShell } from "./shell.js";
import { hydrateIcons } from "./icons.js";
import { api } from "./bridge.js";
import { renderNetWorthSparkline } from "./charts.js";

// Fixed watchlist for the "Popular Stocks" section. `icon` refers to a key
// in icons.js — swap these out (or generate the grid from your own
// watchlist/favorites list in the DB) whenever you're ready.
const WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", icon: "apps" },
  { symbol: "NVDA", name: "NVIDIA Corp", icon: "memory" },
  { symbol: "TSLA", name: "Tesla, Inc.", icon: "electric_bolt" },
  { symbol: "AMZN", name: "Amazon.com", icon: "shopping_cart" },
  { symbol: "MSFT", name: "Microsoft", icon: "window" },
  { symbol: "GOOGL", name: "Alphabet Inc.", icon: "search" },
];

const INDEX_FUNDS = [
  { symbol: "SPY", name: "S&P 500", short: "S&P" },
  { symbol: "QQQ", name: "Nasdaq-100", short: "100" },
  { symbol: "DIA", name: "Dow Jones", short: "DOW" },
];

function fmtMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

/**
 * Renders one "Popular Stocks" card. `quote` is either null (first paint,
 * before the network call resolves — shows "—" placeholders) or the
 * {symbol, price, change_pct} object from api.getQuote().
 */
function stockCardHtml(entry, quote) {
  const price = quote ? fmtMoney(quote.price) : "—";
  // change_pct can be null if backend.index_daily_increase() couldn't get
  // a price (see api.py's get_quote docstring) — fall back to a neutral bar.
  const hasChange = quote && quote.change_pct !== null && quote.change_pct !== undefined;
  const barWidth = hasChange ? Math.min(100, Math.max(10, Math.abs(quote.change_pct) * 10 + 40)) : 40;
  const priceClass = hasChange && quote.change_pct >= 0 ? "text-primary-fixed" : "";

  return `
  <div class="glass-card rounded-xl p-md group">
    <div class="flex justify-between items-start mb-md">
      <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
        <span data-icon="${entry.icon}" data-icon-class="w-5 h-5 text-on-surface-variant"></span>
      </div>
      <div class="text-right">
        <span class="text-label-mono font-label-mono text-on-surface-variant/60">${entry.symbol}</span>
        <p class="text-data-lg font-data-lg transition-colors duration-300 ${priceClass}">${price}</p>
      </div>
    </div>
    <h3 class="text-body-base font-headline-md mb-md">${entry.name}</h3>
    <div class="flex items-center justify-between gap-sm">
      <div class="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-primary-fixed/60" style="width:${barWidth}%"></div>
      </div>
      <a href="invest.html?symbol=${entry.symbol}" class="bg-primary-container/10 text-primary-fixed text-label-mono px-md py-xs rounded-full border border-primary-fixed/20 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors">Invest</a>
    </div>
  </div>`;
}

function indexFundCardHtml(fund, quote) {
  const price = quote ? fmtMoney(quote.price) : "—";
  const hasChange = quote && quote.change_pct !== null && quote.change_pct !== undefined;
  const changeStr = hasChange ? `${quote.change_pct >= 0 ? "+" : ""}${quote.change_pct.toFixed(1)}% Today` : "--%";

  return `
  <div class="glass-card rounded-xl p-md flex items-center gap-md hover:translate-y-[-4px]">
    <div class="w-14 h-14 rounded-lg bg-primary-fixed/5 border border-primary-fixed/20 flex items-center justify-center">
      <span class="text-label-mono font-label-mono text-primary-fixed font-bold">${fund.short}</span>
    </div>
    <div class="flex-1">
      <div class="flex justify-between items-end">
        <div>
          <h4 class="text-body-base font-headline-md">${fund.name}</h4>
          <p class="text-label-mono font-label-mono text-on-surface-variant/60">${fund.symbol}</p>
        </div>
        <div class="text-right">
          <p class="text-data-lg font-data-lg text-primary-fixed">${price}</p>
          <span class="text-label-mono text-primary-fixed/70">${changeStr}</span>
        </div>
      </div>
    </div>
  </div>`;
}

/**
 * Hero "$ total portfolio value" figure + the sparkline underneath it.
 * The BIG number comes from getPortfolioValue() (live, computed fresh on
 * every call). The sparkline comes from a SEPARATE call, getNetworthHistory()
 * — that's the login-by-login snapshot history stored in the `networth`
 * table, which is a different data source than the live total. See
 * bridge.js / api.py for why these two aren't the same call.
 */
async function loadNetWorth() {
  const [liveValue, history] = await Promise.all([
    api.getPortfolioValue(),
    api.getNetworthHistory(5), // last 5 login snapshots
  ]);

  document.getElementById("networth-value").textContent = `$ ${liveValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;

  // % change badge compares the oldest of the last 5 snapshots to the
  // live value right now. If there's no history yet (brand new install,
  // before log_networth_snapshot() has run more than once), just hide
  // the change badge instead of showing a misleading 0%/NaN.
  const badge = document.getElementById("networth-badge");
  const changeLabel = document.getElementById("networth-change");
  if (history.length >= 1) {
    const first = history[0].value;
    const changePct = first ? ((liveValue - first) / first) * 100 : 0;
    changeLabel.textContent = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`;
    if (changePct < 0) {
      badge.classList.remove("bg-primary-fixed/10", "border-primary-fixed/20");
      badge.classList.add("bg-secondary/10", "border-secondary/20");
    }
  } else {
    badge.classList.add("hidden");
  }

  // The sparkline itself needs at least 2 points to draw a line. If this
  // is a fresh DB with only today's snapshot, pad with the live value so
  // the chart still renders something instead of erroring on a 1-point series.
  const chartPoints =
    history.length >= 2
      ? history.map((r) => ({ label: r.date, value: r.value }))
      : [{ label: "Start", value: liveValue }, { label: "Now", value: liveValue }];

  renderNetWorthSparkline("networth-sparkline", chartPoints);
}

async function loadWatchlist() {
  const grid = document.getElementById("popular-stocks-grid");
  // First paint with placeholders so the page doesn't sit blank while the
  // 6 quote requests are in flight.
  grid.innerHTML = WATCHLIST.map((e) => stockCardHtml(e, null)).join("");
  hydrateIcons(grid);

  const quotes = await Promise.all(WATCHLIST.map((e) => api.getQuote(e.symbol).catch(() => null)));
  grid.innerHTML = WATCHLIST.map((e, i) => stockCardHtml(e, quotes[i])).join("");
  hydrateIcons(grid);
}

async function loadIndexFunds() {
  const grid = document.getElementById("index-funds-grid");
  const quotes = await Promise.all(INDEX_FUNDS.map((f) => api.getQuote(f.symbol).catch(() => null)));
  grid.innerHTML = INDEX_FUNDS.map((f, i) => indexFundCardHtml(f, quotes[i])).join("");
}

async function init() {
  await renderShell("dashboard");

  document.getElementById("btn-new-transaction").addEventListener("click", () => {
    window.location.href = "invest.html";
  });
  document.getElementById("btn-view-history").addEventListener("click", () => {
    window.location.href = "history.html";
  });

  // These three sections are fully independent of each other, so load
  // them all in parallel instead of one after another.
  await Promise.all([loadNetWorth(), loadWatchlist(), loadIndexFunds()]);
}

init();
