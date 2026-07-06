import sqlite3

#connect
conn=sqlite3.connect("wis.db")
c= conn.cursor()

#create table
c.execute(""" CREATE TABLE IF NOT EXISTS networth
          (id INTEGER PRIMARY KEY, nw FLOAT, date TEXT)
""")



#save
conn.commit()
conn.close()