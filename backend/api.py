import sqlite3
import finnhub
import yfinance as yf
from dotenv import load_dotenv
import os
load_dotenv()

finnhub_key=os.getenv("finnhub_key")
finnhub_client = finnhub.Client(api_key=finnhub_key)


def get_price(stock):
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

# print(get_networth())