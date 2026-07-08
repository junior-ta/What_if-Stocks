import sqlite3
import finnhub
import yfinance as yf
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
load_dotenv()


finnhub_key=os.getenv("finnhub_key")
finnhub_client = finnhub.Client(api_key=finnhub_key)

# current_datetime = datetime.now().date()
# print("Current Date and Time:", current_datetime)

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


def search_stock_symbol(input): 
    suggestions= finnhub_client.symbol_lookup(input)
    
    return suggestions


conn=sqlite3.connect("wis.db")
c= conn.cursor()

try:
    c.execute("SELECT * FROM networth")
except sqlite3.Error as e:
    print("Database error:", e)

records= c.fetchall()
records=records[::-1]

conn.close()
print(records)