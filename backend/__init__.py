"""
Database: wis.db, expected in the current working directory (same folder
as this project's root, matching your setup scripts). 
main.py sets the working directory explicitly before importing this module so it resolves
correctly whether you run `python main.py` or the packaged .exe.
=============================================================================
"""

import sqlite3
import finnhub
import yfinance as yf
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os

load_dotenv()

finnhub_key = os.getenv("finnhub_key")
finnhub_client = finnhub.Client(api_key=finnhub_key)

# =============================================================================
# Database set-up
# =============================================================================

def _ensure_schema():
    """
    Safety net only — to make sure the app doesn't crash with "no such table" if wis.db hasn't been initialized
    yet on a fresh machine.
    """
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS networth (id INTEGER PRIMARY KEY, nw FLOAT, date TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS transacs (id INTEGER PRIMARY KEY, date TEXT, stock TEXT, capital FLOAT)")
    c.execute("CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT)")
    conn.commit()
    conn.close()


_ensure_schema()


# =============================================================================
# Functionalities
# =============================================================================

def get_name():
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT name FROM user")
        conn.commit()
    except sqlite3.Error as e:
        print("Database error:", e)

    names=c.fetchall()
    conn.close()

    if len(names)==0:
        return "None"
    
    name=names[len(names)-1][0]

    return name


def set_user_name(name: str):
    if len(name)==0:
        return
    
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()
    # INSERT OR REPLACE with a fixed id=1 keeps this a single "current user"
    # row instead of accumulating a new row every time the name changes.
    c.execute("INSERT OR REPLACE INTO user (id, name) VALUES (1, ?)", (name,))
    conn.commit()
    conn.close()

def resetPortfolio():
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    c.execute("DELETE FROM networth")
    c.execute("DELETE FROM transacs")

    conn.commit()
    conn.close()

def get_quote(stock):
    return finnhub_client.quote(stock)["c"]


def create_transac(stock: str, capital) -> int:
    #append a transaction to the database

    # validate that capital is numeric
    try:
        capital = float(capital)
    except ValueError:
        print("Please enter a valid capital for this transaction (should be a number higher than $0.0)")

    # validate that capital is greater than 0.0
    if capital <= 0.0:
        raise Exception("Please enter a valid capital for this transaction (should be a number higher than $0.0)")

    ###Insert the transaction in the database###
    # connect
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("INSERT INTO transacs (date, stock, capital) VALUES (datetime(),?,?)", (stock, capital))
        conn.commit()
    except sqlite3.Error as e:
        print("Database error:", e)

    conn.close()

    return 1


def get_transacs():
    # get all the transactions ever done by the user

    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT * FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    transactions = c.fetchall()

    conn.close()

    return transactions


def get_transac_yield(id: int) -> float:
    # get how much a particular transaction yielded

    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT * FROM transacs WHERE id=?", (id,))
    except sqlite3.Error as e:
        print("Database error:", e)

    transaction = c.fetchall()[0]
    conn.close()

    transac_date = transaction[1]
    stock = transaction[2]
    capital = transaction[3]

    # covert db date to python dt
    transac_date = transac_date.split(" ")[0]

    ###calculate the yield###
    buying_p = yf.Ticker(stock).history(start=transac_date).iloc[0]["Close"]
    actual_p = finnhub_client.quote(stock)["c"]

    shares = capital / buying_p
    revenue = shares * actual_p

    return revenue


def get_networth() -> float:
    #get the total portfolio value

    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT * FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    transactions = c.fetchall()
    conn.close()

    networth = 0
    for transaction in transactions:
        networth += get_transac_yield(transaction[0])

    return networth


def get_yesterdays_date():
    try:
        # Get today's date
        today = datetime.now().date()
        # Subtract one day to get yesterday
        yesterday = today - timedelta(days=1)
        return yesterday
    except Exception as e:
        print(f"Error calculating yesterday's date: {e}")
        return None


def index_daily_increase(stock):
    """
    get the %age increase in price since yersterday
    """
    
    # get closing price from the previous day (OR THE LAST DAY WE HAVE DATA FOR)

    try:
        old_p = yf.Ticker(stock).history(period='2d').iloc[0]["Close"]
    except Exception as e:
        print(f"Error getting yesterday's price: {e}")
        return None

    # get current price
    try:
        current_p = finnhub_client.quote(stock)["c"]
    except Exception as e:
        print(f"Error getting today's price: {e}")
        return None

    increase = ((current_p - old_p) / old_p) * 100

    return increase


def get_capital(id: int):
    #get capital from a specific transaction
    
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT capital FROM transacs WHERE id=?", (id,))
    except sqlite3.Error as e:
        print("Database error:", e)

    capital = c.fetchall()[0][0]

    conn.close()

    return capital


def get_total_capital():
   #get total money invested ever
   
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()

    try:
        c.execute("SELECT capital FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    rows = c.fetchall()

    conn.close()

    total_capital = 0
    for row in rows:
        total_capital += row[0]

    return total_capital


def search_stock_symbol(input):
    #Using finnhub API to find a stock symbol from a search
    
    suggestions = finnhub_client.symbol_lookup(input)

    return suggestions


def get_profit():
    #Get the total profit made from all investments


    profit = get_networth() - get_total_capital()

    return profit


def fetch_stock_df(ticker, period="1mo", interval="1d"):
    """
    fetches stock history
    returns a df with columns: date and closing price. Will be used for visualizations.
    """
    
    df = yf.download(ticker, period=period, interval=interval)

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.reset_index()
    df.columns = [str(c).lower() for c in df.columns]
    return df[["date", "close"]]


def log_networth_snapshot():
    """
    Insert today's computed net worth into the networth table.
    1 row max per day
    """
    today = datetime.now().strftime("%Y-%m-%d")

    conn = sqlite3.connect("wis.db")
    c = conn.cursor()
    c.execute("SELECT id FROM networth WHERE date = ?", (today,))
    already_logged = c.fetchone()

    if not already_logged:
        nw = get_networth()
        c.execute("INSERT INTO networth (nw, date) VALUES (?, ?)", (nw, today))
        conn.commit()

    conn.close()


def get_networth_history(limit=None):
    """
    Read the networth table back as a time-ordered list, for the
    visualizations (dashboard sparkline and the analytics growth chart).

    Returns: [(id, nw, date), ...] ordered oldest -> newest.
    """
    conn = sqlite3.connect("wis.db")
    c = conn.cursor()
    c.execute("SELECT * FROM networth ORDER BY id ASC")
    rows = c.fetchall()
    conn.close()

    if limit:
        rows = rows[-limit:]
    return rows


def get_shares_owned(stock):
    """
    Sum shares owned for a particular `stock` across every transaction of that symbol,
    using the exact same "capital / closing price on the transaction date".
    """

    conn = sqlite3.connect("wis.db")
    c = conn.cursor()
    c.execute("SELECT * FROM transacs WHERE stock = ?", (stock,))
    rows = c.fetchall()
    conn.close()

    total_shares = 0.0
    for row in rows:
        transac_date = row[1].split(" ")[0]
        capital = row[3]
        try:
            buying_p = yf.Ticker(stock).history(start=transac_date).iloc[0]["Close"]
            total_shares += capital / buying_p
        except (IndexError, KeyError):
            # No price data found for that date — skip 
            continue

    return total_shares
