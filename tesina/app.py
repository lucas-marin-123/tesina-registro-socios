from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__, template_folder='html', static_folder='.')
CORS(app)

# CONEXIÓN A LA BASE DE DATOS
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
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        con = conectar()
        cursor = con.cursor()

        # Seleccionamos todos los campos (incluyendo la foto)
        sql = "SELECT * FROM usuarios WHERE email=%s AND password=%s"
        cursor.execute(sql, (email, password))
        usuario = cursor.fetchone()

        cursor.close()
        con.close()

        if usuario:
            return jsonify({
                "id": usuario["id"],
                "nombre": usuario["nombre"],
                "email": usuario["email"],
                "rol": usuario["rol"],
                "foto": usuario.get("foto")  # Devolvemos la foto de perfil al frontend
            }), 200

        return jsonify({"error": "Datos incorrectos"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

    sql = "INSERT INTO socios(nombre,deporte,estado) VALUES(%s,%s,%s)"
    cursor.execute(sql, (nombre, deporte, estado))
    con.commit()

    cursor.close()
    con.close()

    return jsonify({"mensaje": "Socio agregado"})

# PAGAR
@app.route('/pagar', methods=['POST'])
def pagar():
    data = request.json
    socio_id = data['socio_id']
    monto = data['monto']

    con = conectar()
    cursor = con.cursor()

    sql = "INSERT INTO pagos(socio_id,monto,fecha) VALUES(%s,%s,NOW())"
    cursor.execute(sql, (socio_id, monto))

    sql2 = "UPDATE socios SET estado='Al día' WHERE id=%s"
    cursor.execute(sql2, (socio_id,))

    con.commit()
    cursor.close()
    con.close()

    return jsonify({"mensaje": "Pago registrado"})

# VER PAGOS (DE UN SOCIO ESPECÍFICO)
@app.route('/pagos/<int:id>', methods=['GET'])
def pagos(id):
    try:
        con = conectar()
        cursor = con.cursor()

        sql = "SELECT * FROM pagos WHERE socio_id=%s"
        cursor.execute(sql, (id,))
        datos = cursor.fetchall()

        cursor.close()
        con.close()

        return jsonify(datos)
    except Exception as e:
        print("Error en pagos:", e)
        return jsonify([]), 500

# CREAR USUARIO
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.json
    nombre = data['nombre']
    email = data['email']
    password = data['password']
    rol = data['rol']

    con = conectar()
    cursor = con.cursor()

    sql = "INSERT INTO usuarios(nombre,email,password,rol) VALUES(%s,%s,%s,%s)"
    cursor.execute(sql, (nombre, email, password, rol))

    con.commit()
    cursor.close()
    con.close()

    return jsonify({"mensaje": "Usuario creado correctamente"})

# CREAR EVENTO (ADMIN Y ENTRENADOR)
@app.route('/eventos', methods=['POST'])
def crear_evento():
    data = request.json
    titulo = data.get('titulo')
    fecha = data.get('fecha')
    descripcion = data.get('descripcion')

    con = conectar()
    cursor = con.cursor()
    sql = "INSERT INTO eventos (titulo, fecha, descripcion) VALUES (%s, %s, %s)"
    cursor.execute(sql, (titulo, fecha, descripcion))
    con.commit()
    cursor.close()
    con.close()

    return jsonify({"mensaje": "Evento publicado correctamente"})

# ENVIAR AVISO (ENTRENAMIENTO / PARTIDOS)
@app.route('/avisos', methods=['POST'])
def enviar_aviso():
    data = request.json
    mensaje = data.get('mensaje')

    con = conectar()
    cursor = con.cursor()
    sql = "INSERT INTO avisos (mensaje) VALUES (%s)"
    cursor.execute(sql, (mensaje,))
    con.commit()
    cursor.close()
    con.close()

    return jsonify({"mensaje": "Aviso enviado correctamente a los socios"})

# GUARDAR FOTO DE PERFIL (RUTA UNIFICADA)
@app.route('/foto', methods=['PUT', 'OPTIONS'])
def guardar_foto():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    foto_base64 = data.get('foto')
    user_email = data.get('email')

    if not foto_base64 or not user_email:
        return jsonify({'error': 'Faltan datos requeridos'}), 400

    try:
        con = conectar()
        cursor = con.cursor()

        sql = "UPDATE usuarios SET foto=%s WHERE email=%s"
        cursor.execute(sql, (foto_base64, user_email))
        con.commit()

        cursor.close()
        con.close()

        return jsonify({'mensaje': 'Foto actualizada correctamente', 'foto': foto_base64}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ARRANCAR SERVIDOR (AL FINAL DEL ARCHIVO)
if __name__ == '__main__':
    print("Rutas cargadas correctamente")
    print(app.url_map)
    app.run(host="0.0.0.0", port=5000, debug=True)
    
from flask import Flask, request, jsonify
# ... tus otras importaciones y configuración de DB ...

@app.route('/pagar', methods=['POST'])
def registrar_pago():
    datos = request.get_json()
    socio_id = datos.get('socio_id')
    monto = datos.get('monto')

    if not socio_id or not monto:
        return jsonify({'error': 'Faltan datos obligatorios'}), 400

    try:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO pagos (socio_id, monto) VALUES (%s, %s)", (socio_id, monto))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'mensaje': 'Pago registrado con éxito'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pagos/<int:socio_id>', methods=['GET'])
def obtener_pagos(socio_id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, monto, DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') as fecha FROM pagos WHERE socio_id = %s ORDER BY fecha DESC", (socio_id,))
        columnas = [column[0] for column in cursor.description]
        resultados = [dict(zip(columnas, row)) for row in cursor.fetchall()]
        cursor.close()
        return jsonify(resultados), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500