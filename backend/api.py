import sqlite3
import finnhub
import yfinance as yf
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
load_dotenv()

finnhub_key=os.getenv("finnhub_key")
finnhub_client = finnhub.Client(api_key=finnhub_key)


def get_quote(stock):
    return finnhub_client.quote(stock)["c"]

def create_transac(stock:str, capital)->int: 
    #validate stock name

    #validate that capital is numeric
    try:
        capital= float(capital)
    except ValueError:
        print("Please enter a valid capital for this transaction (should be a number higher than $0.0)")

    #validate that capital is greater than 0.0
    if capital<=0.0:
        raise Exception("Please enter a valid capital for this transaction (should be a number higher than $0.0)")
    
    ###Insert the transaction in the database###
    #connect
    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("INSERT INTO transacs (date, stock, capital) VALUES (datetime(),?,?)",(stock,capital))
        conn.commit()
    except sqlite3.Error as e:
        print("Database error:", e)

    conn.close()
    
    return 1


def get_transacs():
    #get all the transactions ever done by the user

    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT * FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    transactions= c.fetchall()

    conn.close()

    return transactions

def get_transac_yield(id:int)->float:
    #get how much a particular transaction yielded

    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT * FROM transacs WHERE id=?",(id,))
    except sqlite3.Error as e:
        print("Database error:", e)    
    
    transaction=c.fetchall()[0]
    conn.close()

    
    transac_date=transaction[1]
    stock=transaction[2]
    capital=transaction[3]

    #covert db date to python dt
    transac_date= transac_date.split(" ")[0]

    ###calculate the yield###
    buying_p= yf.Ticker(stock).history(start=transac_date).iloc[0]["Close"]
    actual_p=finnhub_client.quote(stock)["c"]

    shares= capital / buying_p
    revenue= shares * actual_p

    return revenue


def get_networth()->float:
    
    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT * FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    transactions= c.fetchall()
    conn.close()

    networth=0
    for transaction in transactions:
        networth+=get_transac_yield(transaction[0])

    
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
    #get closing price from the previous day (OR THE LAST DAY WE HAVE DATA FOR)
    

    try:
        old_p= yf.Ticker(stock).history(period='2d').iloc[0]["Close"]
    except Exception as e:
        print(f"Error getting yesterday's price: {e}")
        return None

    #get current price
    try:
        current_p= finnhub_client.quote(stock)["c"]
    except Exception as e:
        print(f"Error getting today's price: {e}")
        return None

    increase=((current_p - old_p) / old_p) * 100
    
    return increase


def get_capital(id:int):
    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT capital FROM transacs WHERE id=?",(id,))
    except sqlite3.Error as e:
        print("Database error:", e)

    capital= c.fetchall()[0][0]

    conn.close()

    return capital
    

def get_total_capital():
    conn=sqlite3.connect("wis.db")
    c= conn.cursor()

    try:
        c.execute("SELECT capital FROM transacs")
    except sqlite3.Error as e:
        print("Database error:", e)

    rows= c.fetchall()

    conn.close()

    total_capital=0
    for row in rows:
        total_capital+=row[0]

    return total_capital

def search_stock_symbol(input): 
    suggestions= finnhub_client.symbol_lookup(input)
    
    return suggestions

def get_profit(): 
    
    profit= get_networth() - get_total_capital()

    return profit
#.............................................


def viz_growth_portfolio(): return

def viz_growth_stock(): return


# print(get_networth())