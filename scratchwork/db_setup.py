import sqlite3

#connect
conn=sqlite3.connect("wis.db")
c= conn.cursor()

#create table
c.execute(""" CREATE TABLE IF NOT EXISTS transacs
          (id INTEGER PRIMARY KEY, date TEXT, stock TEXT, capital FLOAT)
""")

#try insert data
# c.execute("INSERT INTO transacs (date, stock, capital) VALUES (datetime(),'AAPL',500.0)")
# c.execute("DELETE FROM transacs WHERE id=1")


#save
conn.commit()
conn.close()

