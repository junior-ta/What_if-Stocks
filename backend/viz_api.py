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

def viz_growth_portfolio(): return

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

#####..........................................#####
#How to use viz_growth_stock
stock='AAPL'
stock_df = fetch_stock_df(stock)
viz_growth_stock(stock_df,stock)


#How to use viz_growth_portfolio
