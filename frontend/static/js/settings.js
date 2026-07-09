import { renderShell } from "./shell.js";

async function init() {
  await renderShell("settings");

  document.getElementById("reset-portfolio-btn").addEventListener("click", () => {
    if (!confirm("This will wipe all transactions and reset your starting capital. Continue?")) return;
    // Wire this up: e.g. call an api.resetPortfolio() bridge method once
    // you add a matching function to backend/ (not in your original list,
    // so it's left as a manual hook).
    console.log("reset portfolio requested — wire this to your backend");
  });
}

init();
