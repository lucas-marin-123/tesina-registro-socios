from flask import Flask, request, jsonify

from flask_cors import CORS

import pymysql

app = Flask(__name__)

CORS(app)

# MYSQL

def conectar():
    return pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="club",
        cursorclass=pymysql.cursors.DictCursor
    )

# LOGIN

@app.route('/login', methods=['POST'])

def login():

    data = request.json

    email = data['email']

    password = data['password']

    con = conectar()

    cursor = con.cursor()

    sql = """
    SELECT * FROM usuarios
    WHERE email=%s AND password=%s
    """

    cursor.execute(sql, (email, password))

    usuario = cursor.fetchone()

    cursor.close()

    con.close()

    if usuario:

      return jsonify({
        "id": usuario[0],
        "email": usuario[1],
        "rol": usuario[3],
        "nombre": usuario[4]
    })
      return jsonify({
     "error": "Datos incorrectos"
    })
# VER SOCIOS

@app.route('/socios', methods=['GET'])

def socios():

    con = conectar()

    cursor = con.cursor()

    cursor.execute("SELECT * FROM socios")

    datos = cursor.fetchall()

    cursor.close()

    con.close()

    return jsonify(datos)

# AGREGAR SOCIO

@app.route('/socios', methods=['POST'])

def agregar_socio():

    data = request.json

    nombre = data['nombre']

    deporte = data['deporte']

    estado = data['estado']

    con = conectar()

    cursor = con.cursor()

    sql = """
    INSERT INTO socios(nombre,deporte,estado)
    VALUES(%s,%s,%s)
    """

    cursor.execute(sql, (
        nombre,
        deporte,
        estado
    ))

    con.commit()

    cursor.close()

    con.close()

    return jsonify({
        "mensaje":"Socio agregado"
    })

# PAGAR

@app.route('/pagar', methods=['POST'])

def pagar():

    data = request.json

    socio_id = data['socio_id']

    monto = data['monto']

    con = conectar()

    cursor = con.cursor()

    sql = """
    INSERT INTO pagos(socio_id,monto,fecha)
    VALUES(%s,%s,NOW())
    """

    cursor.execute(sql, (
        socio_id,
        monto
    ))

    sql2 = """
    UPDATE socios
    SET estado='Al día'
    WHERE id=%s
    """

    cursor.execute(sql2, (
        socio_id,
    ))

    con.commit()

    cursor.close()

    con.close()

    return jsonify({
        "mensaje":"Pago registrado"
    })

# VER PAGOS

@app.route('/pagos/<int:id>', methods=['GET'])

def pagos(id):

    con = conectar()

    con.cursor()

    sql = """
    SELECT * FROM pagos
    WHERE socio_id=%s
    """


# SERVIDOR
print("Rutas cargadas correctamente")
print(app.url_map)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)