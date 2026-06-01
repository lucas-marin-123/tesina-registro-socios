from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# ===== CONEXION MYSQL =====
def conectar_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="club"
    )

# ===== LOGIN =====
@app.route('/login', methods=['POST'])
def login():

    data = request.json

    email = data.get("email")
    password = data.get("password")

    con = conectar_db()
    cursor = con.cursor(dictionary=True)

    sql = "SELECT * FROM usuarios WHERE email=%s AND password=%s"

    cursor.execute(sql, (email, password))

    user = cursor.fetchone()

    cursor.close()
    con.close()

    if user:
        return jsonify(user)

    return jsonify({"error":"Datos incorrectos"}), 401

# ===== REGISTRAR PAGO =====
@app.route('/pagar', methods=['POST'])
def pagar():

    data = request.json

    socio_id = data.get("socio_id")
    monto = data.get("monto")

    con = conectar_db()
    cursor = con.cursor()

    sql = """
    INSERT INTO pagos (socio_id, monto, fecha)
    VALUES (%s,%s,NOW())
    """

    cursor.execute(sql, (socio_id, monto))

    sql_update = """
    UPDATE socios
    SET estado='Al día'
    WHERE id=%s
    """

    cursor.execute(sql_update, (socio_id,))

    con.commit()

    cursor.close()
    con.close()

    return jsonify({"mensaje":"Pago registrado"})

# ===== VER PAGOS =====
@app.route('/pagos/<int:socio_id>')
def ver_pagos(socio_id):

    con = conectar_db()

    cursor = con.cursor(dictionary=True)

    sql = """
    SELECT fecha, monto
    FROM pagos
    WHERE socio_id=%s
    """

    cursor.execute(sql, (socio_id,))

    pagos = cursor.fetchall()

    cursor.close()
    con.close()

    return jsonify(pagos)

# ===== INICIAR =====
if __name__ == "__main__":
    app.run(debug=True)