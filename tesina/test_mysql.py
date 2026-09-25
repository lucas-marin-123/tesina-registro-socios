import mysql.connector

try:
    print("Conectando...")
    con = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="club",
        connection_timeout=5
    )
    print("Conexion OK")
    con.close()
except Exception as e:
    print("ERROR:")
    print(repr(e))