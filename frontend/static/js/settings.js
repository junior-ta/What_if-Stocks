import { renderShell } from "./shell.js";
import { api } from "./bridge.js";

async function saveName(input) {
  const name = input.value.trim();
  if (!name) return;
  await api.setUserName(name);
  await renderShell("settings"); // re-runs your getUserName() logic, refreshing the sidebar
}

async function init() {
  await renderShell("settings");

  document.getElementById("reset-portfolio-btn").addEventListener("click", () => {
    if (!confirm("This will wipe all transactions and reset your starting capital. Continue?")) api.resetPortfolio();
  });

  const nameInput = document.getElementById("trader-name-input");
  nameInput.addEventListener("blur", () => saveName(nameInput));
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") nameInput.blur(); // triggers the blur handler above
  });

}

init();
