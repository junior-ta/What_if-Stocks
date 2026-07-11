// Shared chart builders, used by dashboard.js / invest.js / analytics.js.
// Uses the local vendor/plotly.min.js bundle so it works fully offline.
// =============================================================================

const NEON_GREEN = "#56ffa8";
const NEON_RED = "#ffb3ac";
const TRANSPARENT = "rgba(0,0,0,0)";

function glowTraces(x, y, color = NEON_GREEN, baseWidth = 2.5, withMarkers = false) {
  const passes = [
    [baseWidth + 10, 0.06],
    [baseWidth + 6, 0.1],
    [baseWidth + 3, 0.18],
    [baseWidth, 1.0],
  ];
  return passes.map(([width, opacity], i) => ({
    x,
    y,
    type: "scatter",
    mode: i === passes.length - 1 && withMarkers ? "lines+markers" : "lines",
    line: { color, width, shape: "spline", smoothing: 1.1 },
    marker: { color, size: 6 },
    opacity,
    hoverinfo: opacity < 1 ? "skip" : "x+y",
    showlegend: false,
  }));
}

/** Small KPI sparkline (dashboard hero net worth chart). */
export function renderNetWorthSparkline(divId, records) {
  const x = records.map((r) => r.label);
  const y = records.map((r) => r.value);

  const fill = {
    x,
    y,
    type: "scatter",
    mode: "lines",
    line: { width: 0, shape: "spline", smoothing: 1.1 },
    fill: "tozeroy",
    fillcolor: "rgba(86,255,168,0.15)",
    hoverinfo: "skip",
    showlegend: false,
  };

  const layout = {
    paper_bgcolor: TRANSPARENT,
    plot_bgcolor: TRANSPARENT,
    margin: { l: 0, r: 0, t: 0, b: 0 },
    xaxis: { visible: false },
    yaxis: { visible: false, range: [Math.min(...y) * 0.95, Math.max(...y) * 1.05] },
    showlegend: false,
    hovermode: "x",
  };

  Plotly.newPlot(divId, [fill, ...glowTraces(x, y)], layout, {
    displayModeBar: false,
    responsive: true,
  });
}

/** Larger performance chart (invest page: stock history for 1D/1W/1M/1Y). */
export function renderPerformanceChart(divId, points, color = NEON_GREEN) {
  const x = points.map((p) => p.label);
  const y = points.map((p) => p.value);

  const layout = {
    paper_bgcolor: TRANSPARENT,
    plot_bgcolor: TRANSPARENT,
    margin: { l: 45, r: 20, t: 10, b: 30 },
    xaxis: { showgrid: false, color: "#b9cbbc", tickfont: { size: 10, family: "JetBrains Mono" } },
    yaxis: {
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.05)",
      zeroline: false,
      color: "#b9cbbc",
      tickfont: { size: 10, family: "JetBrains Mono" },
    },
    showlegend: false,
    hovermode: "x unified",
  };

  Plotly.newPlot(divId, glowTraces(x, y, color, 2.5, true), layout, {
    displayModeBar: false,
    responsive: true,
  });
}

/** Portfolio growth chart for the Analytics page (full net worth history). */
export function renderPortfolioGrowthChart(divId, records) {
  renderPerformanceChart(divId, records, NEON_GREEN);
}

/** Profit/loss bar chart per transaction/symbol for Analytics page. */
export function renderProfitLossChart(divId, entries) {
  const x = entries.map((e) => e.label);
  const y = entries.map((e) => e.value);
  const colors = y.map((v) => (v >= 0 ? NEON_GREEN : NEON_RED));

  const trace = {
    x,
    y,
    type: "bar",
    marker: { color: colors },
    hovertemplate: "%{x}: %{y:.2f}<extra></extra>",
  };

  const layout = {
    paper_bgcolor: TRANSPARENT,
    plot_bgcolor: TRANSPARENT,
    margin: { l: 45, r: 20, t: 10, b: 40 },
    xaxis: { color: "#b9cbbc", tickfont: { size: 10, family: "JetBrains Mono" } },
    yaxis: {
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.05)",
      zeroline: true,
      zerolinecolor: "rgba(255,255,255,0.15)",
      color: "#b9cbbc",
      tickfont: { size: 10, family: "JetBrains Mono" },
    },
    showlegend: false,
  };

  Plotly.newPlot(divId, [trace], layout, { displayModeBar: false, responsive: true });
}
