"""
 The frontend uses this api to get data from the backend.
 each value returned is formatted fit for the frontend request

Every method on the `Api` class below becomes callable from the frontend
as `window.pywebview.api.<method_name>(...)`.

=============================================================================
"""

import traceback
import backend


def _safe(fn, *args, **kwargs):
    """
    Run a backend call and print the full traceback to the terminal for debugging.
    """
    try:
        return fn(*args, **kwargs)
    except Exception:
        traceback.print_exc()
        raise


class Api:

    # -----Portfolio value-----
    def get_portfolio_value(self):
        """
        Returns: float — the live total value of every position right now.
        This is the number for the dashboard's big "$" hero figure.
        """
        return float(_safe(backend.get_networth))

    def get_networth_history(self, limit=5):
        """
        Returns a llist of dict: [{"date": "2026-06-08", "value": 9867.0}, ...]
        ordered oldest -> newest.

        Powers the dashboard sparkline (limit=5)
        and the analytics growth chart (limit=None / omitted -> full
        history, called from analytics.js with no argument).
        """
        rows = _safe(backend.get_networth_history, limit)
        # each row is (id, nw, date)
        return [{"date": row[2], "value": row[1]} for row in rows]

    def get_total_capital(self):
        """
        Returns: total dollars ever invested (cost basis)
        """
        return float(_safe(backend.get_total_capital))

    def get_profit(self):
        """Returns: get_networth() - get_total_capital(); can be negative."""
        return float(_safe(backend.get_profit))



    # -----Quotes / search-----
    def get_quote(self, symbol):
        """
        Returns: {"symbol": str, "price": float, "change_pct": float|None}
        """
        price = float(_safe(backend.get_quote, symbol))
        try:
            change_pct = backend.index_daily_increase(symbol)
        except Exception:
            change_pct = None
        return {"symbol": symbol, "price": price, "change_pct": change_pct}

    def search_stock_symbol(self, query):
        """
        Returns: [{"symbol": str, "name": str}, ...] (capped at 8 results)
        for the search dropdown.
        """
        raw = _safe(backend.search_stock_symbol, query)
        results = raw.get("result", []) if isinstance(raw, dict) else []
        return [{"symbol": r["symbol"], "name": r.get("description", r["symbol"])} for r in results[:8]]

    def get_stock_history(self, symbol, period="1M"):
        """
        Returns: [{"label": "2026-06-08", "value": 301.54}, ...]
        the Invest page's big 1D/1W/1M/1Y chart needs a price series
        """
        period_map = {
            "1D": ("5d", "15m"),
            "1W": ("5d", "1d"),
            "1M": ("1mo", "1d"),
            "1Y": ("1y", "1wk"),
        }
        yf_period, yf_interval = period_map.get(period, ("1mo", "1d"))
        df = _safe(backend.fetch_stock_df, symbol, yf_period, yf_interval)
        return [
            {"label": str(row["date"])[:10], "value": float(row["close"])}
            for _, row in df.iterrows()
        ]

    def get_shares_owned(self, symbol):
        """Returns: total shares held in symbol across all transactions."""
        return float(_safe(backend.get_shares_owned, symbol))

    # Transactions
    def create_transac(self, symbol, amount):
        """
        Returns: 1 on success.
        Raises if `amount` is invalid 
        """
        return _safe(backend.create_transac, symbol, amount)

    def get_transacs(self):
        """
        Returns: [{"id": int, "date": str, "symbol": str, "amount": float}, ...]
        """
        rows = _safe(backend.get_transacs)
        return [{"id": row[0], "date": row[1], "symbol": row[2], "amount": row[3]} for row in rows]

    def get_transac_current_value(self, transac_id):
        """
        Returns:  the CURRENT DOLLAR VALUE of one transaction today
        """
        return float(_safe(backend.get_transac_yield, transac_id))
