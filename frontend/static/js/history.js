// Pulls every transaction from api.getTransacs() (your `transacs` table:
// id, date, symbol, amount) and, for each one, calls
// api.getTransacCurrentValue() to find out what it's worth today.
// =============================================================================

import { renderShell } from "./shell.js";
import { api } from "./bridge.js";

function fmtMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function plChipHtml(pct) {
  const isGain = pct >= 0;
  return `<span class="inline-flex items-center gap-xs px-sm py-xs rounded-full text-label-mono font-label-mono ${
    isGain ? "badge-gain" : "badge-loss"
  }">${isGain ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%</span>`;
}

/**
 * Builds one table row for a transaction. Returns both the row's HTML and
 * its dollar profit (currentValue - amount invested), so init() can sum
 * those profits into the page's "Total P/L" figure without a second pass.
 */
async function rowHtml(t) {
  let currentValue;
  try {
    currentValue = await api.getTransacCurrentValue(t.id);
  } catch (e) {
    console.error(`get_transac_current_value(${t.id}) failed`, e);
    currentValue = t.amount; // fall back to "no change" rather than crashing the row
  }

  const profitDollars = currentValue - t.amount;
  const profitPct = t.amount ? (profitDollars / t.amount) * 100 : 0;

  return {
    html: `
    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td class="px-md py-sm font-label-mono text-label-mono text-primary-fixed">${t.symbol}</td>
      <td class="px-md py-sm font-label-mono text-label-mono text-on-surface-variant/70">${String(t.date).slice(0, 10)}</td>
      <td class="px-md py-sm font-data-lg text-sm">${fmtMoney(t.amount)}</td>
      <td class="px-md py-sm font-data-lg text-sm">${fmtMoney(currentValue)}</td>
      <td class="px-md py-sm font-data-lg text-sm ${profitDollars >= 0 ? "text-primary-fixed" : "text-secondary"}">${
        profitDollars >= 0 ? "+" : ""
      }${fmtMoney(profitDollars)}</td>
      <td class="px-md py-sm">${plChipHtml(profitPct)}</td>
    </tr>`,
    profitDollars,
  };
}

async function init() {
  await renderShell("history");

  const tbody = document.getElementById("transactions-tbody");
  try {
    const transacs = await api.getTransacs();
    if (!transacs || !transacs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-md py-lg text-center text-on-surface-variant/50 font-label-mono">No transactions yet.</td></tr>`;
      return;
    }

    //run every row in parallel instead of awaiting one at a time.
    const rows = await Promise.all(transacs.map(rowHtml));
    // Most recent transaction first.
    tbody.innerHTML = rows
      .slice()
      .reverse()
      .map((r) => r.html)
      .join("");

    const totalProfit = rows.reduce((sum, r) => sum + r.profitDollars, 0);
    const totalEl = document.getElementById("total-pl");
    totalEl.textContent = `${totalProfit >= 0 ? "+" : ""}${fmtMoney(totalProfit)}`;
    if (totalProfit < 0) totalEl.classList.replace("text-primary-fixed", "text-secondary");
  } catch (e) {
    console.error("Failed to load transactions", e);
    tbody.innerHTML = `<tr><td colspan="6" class="px-md py-lg text-center text-secondary font-label-mono">Failed to load transactions — check the terminal running main.py.</td></tr>`;
  }
}

init();
