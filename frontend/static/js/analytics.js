// Four independent sections, all fed from the same set of backend calls:
//   1. Stat cards: Total Invested (cost basis), Total P/L, Win Rate
//   2. Portfolio growth chart: full `networth` table history (one point
//      per login — see log_networth_snapshot() in backend/__init__.py)
//   3. Profit/Loss by Position: one bar per transaction, dollar profit
//      (current value - amount invested)
//   4. Recent Transactions: last 5 transactions with their P/L
// =============================================================================

import { renderShell } from "./shell.js";
import { api } from "./bridge.js";
import { renderPortfolioGrowthChart, renderProfitLossChart } from "./charts.js";

function fmtMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

/** Fetches current value + profit ($) for every transaction */
async function loadTransactionProfits(transacs) {
  return Promise.all(
    transacs.map(async (t) => {
      let currentValue;
      try {
        currentValue = await api.getTransacCurrentValue(t.id);
      } catch {
        currentValue = t.amount;
      }
      return { ...t, currentValue, profitDollars: currentValue - t.amount };
    })
  );
}

async function loadSummaryStats(enrichedTransacs) {
  try {
    const totalCapital = await api.getTotalCapital();
    document.getElementById("stat-total-capital").textContent = fmtMoney(totalCapital);
  } catch (e) {
    console.warn("get_total_capital failed", e);
  }

  try {
    const totalProfit = await api.getProfit();
    const el = document.getElementById("stat-total-profit");
    el.textContent = `${totalProfit >= 0 ? "+" : ""}${fmtMoney(totalProfit)}`;
    if (totalProfit < 0) el.classList.replace("text-primary-fixed", "text-secondary");
  } catch (e) {
    console.warn("get_profit failed", e);
  }

  if (enrichedTransacs.length) {
    const wins = enrichedTransacs.filter((t) => t.profitDollars > 0).length;
    document.getElementById("stat-win-rate").textContent = `${((wins / enrichedTransacs.length) * 100).toFixed(0)}%`;
  }
}

async function loadGrowthChart() {
  // No limit passed -> full history (see api.py's get_networth_history docstring).
  const history = await api.getNetworthHistory();
  if (history.length < 2) {
    // Not enough logins yet to draw a meaningful line — show a friendly
    // note instead of an empty/broken chart.
    document.getElementById("growth-chart").innerHTML =
      '<p class="text-on-surface-variant/50 font-label-mono text-sm p-md">Not enough login history yet — check back after a few more logins.</p>';
    return;
  }
  const points = history.map((r) => ({ label: r.date, value: r.value }));
  renderPortfolioGrowthChart("growth-chart", points);
}

function loadProfitLossChart(enrichedTransacs) {
  if (!enrichedTransacs.length) return;
  const entries = enrichedTransacs.map((t) => ({
    label: `${t.symbol} (${String(t.date).slice(0, 10)})`,
    value: t.profitDollars,
  }));
  renderProfitLossChart("pl-chart", entries);
}

function txRowHtml(t) {
  const isGain = t.profitDollars >= 0;
  const profitPct = t.amount ? (t.profitDollars / t.amount) * 100 : 0;
  return `
  <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
    <td class="px-md py-sm font-label-mono text-label-mono text-primary-fixed">${t.symbol}</td>
    <td class="px-md py-sm font-label-mono text-label-mono text-on-surface-variant/70">${String(t.date).slice(0, 10)}</td>
    <td class="px-md py-sm font-data-lg text-sm">${fmtMoney(t.amount)}</td>
    <td class="px-md py-sm">
      <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full text-label-mono font-label-mono ${
        isGain ? "badge-gain" : "badge-loss"
      }">${isGain ? "▲" : "▼"} ${Math.abs(profitPct).toFixed(1)}%</span>
    </td>
  </tr>`;
}

function loadTransactionsTable(enrichedTransacs) {
  const tbody = document.getElementById("analytics-tbody");
  if (!enrichedTransacs.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-md py-lg text-center text-on-surface-variant/50 font-label-mono">No transactions yet.</td></tr>`;
    return;
  }
  const recent = enrichedTransacs.slice(-5).reverse();
  tbody.innerHTML = recent.map(txRowHtml).join("");
}

async function init() {
  await renderShell("analytics");

  let transacs = [];
  try {
    transacs = await api.getTransacs();
  } catch (e) {
    console.warn("get_transacs failed", e);
  }

  // Fetch each transaction's current value ONCE, then reuse it across the stat cards, the P/L chart, and the recent-transactions table below — 
  // avoids tripling the number of slow backend calls.
  const enrichedTransacs = transacs.length ? await loadTransactionProfits(transacs) : [];

  await Promise.all([
    loadGrowthChart(),
    loadSummaryStats(enrichedTransacs),
    Promise.resolve(loadProfitLossChart(enrichedTransacs)),
    Promise.resolve(loadTransactionsTable(enrichedTransacs)),
  ]);
}

init();
