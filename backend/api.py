import sqlite3



def create_transac(stock:str, capital):
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


def get_networth():return
def get_transac():return