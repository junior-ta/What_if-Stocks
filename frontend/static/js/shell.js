// =============================================================================
// shell.js
// =============================================================================
// Renders the top nav bar + left sidebar + mobile bottom nav that's
// identical on every page, so we only have to write/fix it once. Each
// page's HTML just has three empty placeholder divs
// (#app-topnav, #app-sidebar, #app-mobilenav) — renderShell() replaces
// them with the real markup and wires up their click handlers.
// =============================================================================

import { hydrateIcons } from "./icons.js";
import { api } from "./bridge.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "Portfolio", icon: "pie_chart", href: "dashboard.html" },
  { key: "invest", label: "Check Quotes", icon: "query_stats", href: "invest.html" },
  { key: "history", label: "History", icon: "history", href: "history.html" },
  { key: "analytics", label: "Analytics", icon: "show_chart", href: "analytics.html" },
  { key: "settings", label: "Settings", icon: "settings", href: "settings.html" },
];

const TOP_LINKS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
  { key: "invest", label: "Invest", href: "invest.html" },
  { key: "analytics", label: "Analytics", href: "analytics.html" },
];

function topNavHtml(active) {
  const links = TOP_LINKS.map(
    (l) => `<a class="text-label-mono font-label-mono pb-1 transition-colors duration-300 ${
      l.key === active
        ? "text-primary-fixed border-b-2 border-primary-fixed"
        : "text-on-surface-variant/70 hover:text-primary-fixed"
    }" href="${l.href}">${l.label}</a>`
  ).join("");

  return `
  <nav id="app-topnav" class="fixed top-0 w-full z-50 flex justify-between items-center px-md py-sm bg-surface-variant/10 backdrop-blur-[24px] border-b border-white/10">
    <div class="flex items-center gap-md">
      <span class="text-headline-md font-headline-md tracking-tighter text-primary-fixed">What if - Trading</span>
      <div class="hidden md:flex items-center gap-md ml-lg">${links}</div>
    </div>
  </nav>`;
}

function sidebarHtml(active, traderName, totalInvestedLabel) {
  const items = NAV_ITEMS.map((item) => {
    const activeClass =
      item.key === active
        ? "bg-primary-container/20 text-primary-fixed border-l-4 border-primary-fixed"
        : "text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5 border-l-4 border-transparent";
    return `
    <a class="flex items-center gap-sm px-md py-sm rounded-lg group transition-all duration-200 ${activeClass}" href="${item.href}">
      <span data-icon="${item.icon}" data-icon-class="w-5 h-5"></span>
      <span class="text-label-mono font-label-mono">${item.label}</span>
    </a>`;
  }).join("");

  return `
  <aside id="app-sidebar" class="fixed left-0 top-0 h-full z-40 w-64 pt-xl hidden md:flex flex-col justify-between bg-surface-container/10 backdrop-blur-[40px] border-r border-white/10">
    <div class="px-md mt-md">
      <div class="flex items-center gap-sm mb-lg">
        <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
          <span data-icon="person" data-icon-class="w-5 h-5 text-primary-fixed"></span>
        </div>
        <div>
          <p id="sidebar-trader-name" class="text-body-base font-headline-md text-primary-fixed">${traderName}</p>
          <p id="sidebar-total-invested" class="text-label-mono font-label-mono text-on-surface-variant/60">${totalInvestedLabel} Invested</p>
        </div>
      </div>
      <nav class="space-y-base">${items}</nav>
      <button id="invest-now-btn" class="w-full mt-lg py-sm bg-primary-fixed text-on-primary-fixed font-label-mono rounded-lg hover:brightness-110 active:scale-95 transition-all">
        Invest Now
      </button>
    </div>

  </aside>`;
}

function mobileNavHtml(active) {
  const mobileItems = [
    { key: "dashboard", icon: "pie_chart", label: "Portfolio", href: "dashboard.html" },
    { key: "invest", icon: "query_stats", label: "Market", href: "invest.html" },
    { key: "history", icon: "history", label: "History", href: "history.html" },
    { key: "settings", icon: "settings", label: "Settings", href: "settings.html" },
  ];
  const items = mobileItems
    .map(
      (i) => `
    <a href="${i.href}" class="flex flex-col items-center gap-xs ${
        i.key === active ? "text-primary-fixed" : "text-on-surface-variant/60"
      }">
      <span data-icon="${i.icon}" data-icon-class="w-5 h-5"></span>
      <span class="text-[10px] font-label-mono">${i.label}</span>
    </a>`
    )
    .join("");

  return `
  <div id="app-mobilenav" class="fixed bottom-0 w-full z-50 md:hidden bg-surface-container/20 backdrop-blur-xl border-t border-white/5 px-md py-sm flex justify-around">
    ${items}
  </div>`;
}

/**
 * Renders the shared shell into the page's placeholder containers and
 * wires up its buttons/links. Every page's <script type="module"> should
 * `await renderShell("<page-key>")` before doing anything else, so the
 * nav highlights the right active link.
 */
export async function renderShell(activePage) {
  const topnavEl = document.getElementById("app-topnav");
  const sidebarEl = document.getElementById("app-sidebar");
  const mobilenavEl = document.getElementById("app-mobilenav");

  let totalInvestedLabel = "$--";
  try {
    const totalCapital = await api.getTotalCapital();
    totalInvestedLabel = `$${Number(totalCapital).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  } catch (e) {
    console.warn("Could not load total invested capital", e);
  }

  //trying to get a username
  const tempname= await api.getname();
  if (tempname=="None"){name= "Trader One"} else {name=tempname}


  if (topnavEl) topnavEl.outerHTML = topNavHtml(activePage);
  if (sidebarEl) sidebarEl.outerHTML = sidebarHtml(activePage, name, totalInvestedLabel);
  if (mobilenavEl) mobilenavEl.outerHTML = mobileNavHtml(activePage);

  // Icons are inserted as data-icon="name" placeholders in the markup
  // above; hydrateIcons() swaps each one for real inline SVG (see icons.js).
  hydrateIcons(document);

  const investBtn = document.getElementById("invest-now-btn");
  if (investBtn) investBtn.addEventListener("click", () => (window.location.href = "invest.html"));

  // const logoutLink = document.getElementById("logout-link");
  // if (logoutLink)
  //   logoutLink.addEventListener("click", (e) => {
  //     e.preventDefault();
  //     // No auth/session system in the current backend — wire this up if
  //     // you add one later.
  //     console.log("logout clicked");
  //   });
}
