from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def conectar_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # ⚠️ CAMBIAR SI TENÉS PASSWORD
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

    cursor.execute(
        "SELECT * FROM usuarios WHERE email=%s AND password=%s",
        (email, password)
    )

    user = cursor.fetchone()

    cursor.close()
    con.close()

    if user:
        return jsonify(user)
    else:
        return jsonify({"error": "Datos incorrectos"}), 401

# ===== PAGAR =====
@app.route('/pagar', methods=['POST'])
def pagar():
    data = request.json
    socio_id = data.get("socio_id")
    monto = data.get("monto")

    con = conectar_db()
    cursor = con.cursor()

    cursor.execute(
        "INSERT INTO pagos (socio_id, monto, fecha) VALUES (%s, %s, NOW())",
        (socio_id, monto)
    )

    cursor.execute(
        "UPDATE socios SET estado='Al día' WHERE id=%s",
        (socio_id,)
    )

    con.commit()
    cursor.close()
    con.close()

    return jsonify({"mensaje": "Pago registrado"})

# ===== VER PAGOS =====
@app.route('/pagos/<int:socio_id>')
def ver_pagos(socio_id):
    con = conectar_db()
    cursor = con.cursor(dictionary=True)

    cursor.execute(
        "SELECT fecha, monto FROM pagos WHERE socio_id=%s",
        (socio_id,)
    )

    pagos = cursor.fetchall()

    cursor.close()
    con.close()

    return jsonify(pagos)

if __name__ == "__main__":
    app.run(debug=True)