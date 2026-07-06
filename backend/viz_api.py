import sqlite3
import finnhub
import yfinance as yf
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import plotly.graph_objects as go
import pandas as pd
load_dotenv()

finnhub_key=os.getenv("finnhub_key")
finnhub_client = finnhub.Client(api_key=finnhub_key)
 
NEON_GREEN = "#4ef2a3"
BG = "#0a0f0d"
GRID = "rgba(255,255,255,0.04)"
MUTED = "#5b8a78"
 
 
def _glow_traces(x, y, color=NEON_GREEN, base_width=2.5):
    """Return a list of go.Scatter traces that together render a glowing line."""
    passes = [
        (base_width + 10, 0.06),
        (base_width + 6, 0.10),
        (base_width + 3, 0.18),
        (base_width, 1.0),  # crisp top line, full opacity
    ]
    traces = []
    for width, opacity in passes:
        traces.append(
            go.Scatter(
                x=x,
                y=y,
                mode="lines",
                line=dict(color=color, width=width, shape="spline", smoothing=1.1),
                opacity=opacity,
                hoverinfo="skip" if opacity < 1.0 else "x+y",
                showlegend=False,
            )
        )
    return traces

def viz_growth_stock(df, ticker):
    """
    visualize the trend of a stock, the last 30 days
    """

    x = df["date"]
    y = df["close"]
 
    fig = go.Figure()
    for trace in _glow_traces(x, y, base_width=2.5):
        fig.add_trace(trace)
 
    # marker dots at each data point
    fig.add_trace(
        go.Scatter(
            x=x,
            y=y,
            mode="markers",
            marker=dict(size=6, color=NEON_GREEN, line=dict(width=0)),
            hoverinfo="x+y",
            showlegend=False,
        )
    )
 
    fig.update_layout(
        title=dict(
            text=(
                f"<span style='font-size:11px;letter-spacing:2px;color:{MUTED}'>"
                f"{ticker} · REAL-TIME PERFORMANCE</span>"
            ),
            x=0.02,
            xanchor="left",
        ),
        paper_bgcolor=BG,
        plot_bgcolor=BG,
        font=dict(family="JetBrains Mono, monospace", color=NEON_GREEN),
        xaxis=dict(showgrid=False, color=MUTED, tickfont=dict(size=10)),
        yaxis=dict(showgrid=True, gridcolor=GRID, zeroline=False, color=MUTED, tickfont=dict(size=10)),
        margin=dict(l=40, r=20, t=60, b=30),
        height=380,
        showlegend=False,
        hovermode="x unified",
    )
    return fig.show()

def fetch_stock_df(ticker, period="1mo", interval="1d"):
    raw = yf.download(ticker, period=period, interval=interval)

    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)
        
    raw = raw.reset_index()
    raw.columns = [str(c).lower() for c in raw.columns]
    return raw[["date", "close"]]

def viz_growth_portfolio(currency="$"):
    """
    records: list of dicts like [{"label": "Login 1", "value": 2100}, ...]
    (pull these from your DB: last 5 rows for the user, ordered by timestamp ASC)
    """
    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT * FROM networth")
    except sqlite3.Error as e:
        print("Database error:", e)

    records= c.fetchall()
    # records=records[:]

    conn.close()

    x = [r[2] for r in records]
    y = [r[1] for r in records]
    latest = y[-1]
    change_pct = ((y[-1] - y[0]) / y[0] * 100) if y[0] else 0
    is_up = change_pct >= 0
 
    fig = go.Figure()
 
    # soft gradient fill under the line
    fig.add_trace(
        go.Scatter(
            x=x,
            y=y,
            mode="lines",
            line=dict(color=NEON_GREEN, width=0, shape="spline", smoothing=1.1),
            fill="tozeroy",
            fillcolor="rgba(78,242,163,0.15)",
            hoverinfo="skip",
            showlegend=False,
        )
    )
 
    for trace in _glow_traces(x, y):
        fig.add_trace(trace)
 
    fig.update_layout(
        title=dict(
            text=(
                f"<span style='font-size:12px;letter-spacing:2px;color:{MUTED}'>"
                f"TOTAL PORTFOLIO VALUE</span><br>"
                f"<span style='font-size:34px;color:{NEON_GREEN}'>{currency}{latest:,.2f}</span> "
                f"<span style='font-size:13px;color:{'#4ef2a3' if is_up else '#f24e4e'}'>"
                f"{'▲' if is_up else '▼'} {abs(change_pct):.1f}%</span>"
            ),
            x=0.02,
            xanchor="left",
        ),
        paper_bgcolor=BG,
        plot_bgcolor=BG,
        font=dict(family="JetBrains Mono, monospace", color=NEON_GREEN),
        xaxis=dict(visible=False),
        yaxis=dict(visible=False, range=[min(y) * 0.9, max(y) * 1.1]),
        margin=dict(l=20, r=20, t=90, b=20),
        height=260,
        showlegend=False,
    )
    return fig.show()


#####..........................................#####
#How to use viz_growth_stock
stock='AAPL'
stock_df = fetch_stock_df(stock)
viz_growth_stock(stock_df,stock)


#How to use viz_growth_portfolio
viz_growth_portfolio()