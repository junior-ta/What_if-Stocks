import sqlite3

#connect
conn=sqlite3.connect("wis.db")
c= conn.cursor()

#create table
c.execute(""" CREATE TABLE IF NOT EXISTS networth
          (id INTEGER PRIMARY KEY, nw FLOAT, date TEXT)
""")

# c.execute("INSERT INTO networth (nw, date) VALUES (9867, '2026-06-08')")
# c.execute("INSERT INTO networth (nw, date) VALUES (9100, '2026-06-09')")
# c.execute("INSERT INTO networth (nw, date) VALUES (10000, '2026-06-10')")
# c.execute("INSERT INTO networth (nw, date) VALUES (10198, '2026-06-11')")
# c.execute("INSERT INTO networth (nw, date) VALUES (12000, '2026-06-15')")



#save
conn.commit()
conn.close()