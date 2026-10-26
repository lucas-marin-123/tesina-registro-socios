from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from datetime import datetime

app = Flask(__name__, template_folder='html', static_folder='.')
CORS(app)

# CONEXIÓN A LA BASE DE DATOS (PyMySQL)
def conectar():
    return pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="club",
        cursorclass=pymysql.cursors.DictCursor
    )

# ---------------------------------------------------------
# AUTH / LOGIN
# ---------------------------------------------------------
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
                "foto": usuario.get("foto")
            }), 200

        return jsonify({"error": "Datos incorrectos"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# USUARIOS
# ---------------------------------------------------------
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.json
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    rol = data.get('rol')

    try:
        con = conectar()
        cursor = con.cursor()
        sql = "INSERT INTO usuarios(nombre, email, password, rol) VALUES(%s, %s, %s, %s)"
        cursor.execute(sql, (nombre, email, password, rol))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"mensaje": "Usuario creado correctamente"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# SOCIOS
# ---------------------------------------------------------
@app.route('/socios', methods=['GET'])
def socios():
    try:
        con = conectar()
        cursor = con.cursor()
        cursor.execute("SELECT * FROM socios")
        datos = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(datos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/socios', methods=['POST'])
def agregar_socio():
    data = request.json
    nombre = data.get('nombre')
    deporte = data.get('deporte')
    estado = data.get('estado', 'Pendiente')

    try:
        con = conectar()
        cursor = con.cursor()
        sql = "INSERT INTO socios(nombre, deporte, estado) VALUES(%s, %s, %s)"
        cursor.execute(sql, (nombre, deporte, estado))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"mensaje": "Socio agregado correctamente"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# PAGOS (REGISTRAR Y CONSULTAR)
# ---------------------------------------------------------
@app.route('/pagar', methods=['POST'])
def pagar():
    data = request.json
    socio_id = data.get('socio_id')
    monto = data.get('monto', 5000.0)

    if not socio_id:
        return jsonify({"error": "Falta el ID del socio"}), 400

    try:
        con = conectar()
        cursor = con.cursor()

        # 1. Registrar pago
        sql_pago = "INSERT INTO pagos(socio_id, monto, fecha) VALUES(%s, %s, NOW())"
        cursor.execute(sql_pago, (socio_id, monto))

        # 2. Actualizar estado del socio
        sql_socio = "UPDATE socios SET estado='Al día' WHERE id=%s"
        cursor.execute(sql_socio, (socio_id,))

        con.commit()
        cursor.close()
        con.close()

        return jsonify({"mensaje": "Pago registrado con éxito"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/pagos/<int:id>', methods=['GET'])
def pagos(id):
    try:
        con = conectar()
        cursor = con.cursor()
        sql = "SELECT id, socio_id, monto, DATE_FORMAT(fecha, '%%d/%%m/%%Y %%H:%%i') as fecha FROM pagos WHERE socio_id=%s ORDER BY fecha DESC"
        cursor.execute(sql, (id,))
        datos = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(datos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# EVENTOS
# ---------------------------------------------------------
@app.route('/eventos', methods=['POST'])
def crear_evento():
    data = request.json
    titulo = data.get('titulo')
    fecha = data.get('fecha')
    descripcion = data.get('descripcion', '')

    if not titulo or not fecha:
        return jsonify({"error": "Título y fecha son obligatorios"}), 400

    try:
        con = conectar()
        cursor = con.cursor()
        sql = "INSERT INTO eventos (titulo, fecha, descripcion) VALUES (%s, %s, %s)"
        cursor.execute(sql, (titulo, fecha, descripcion))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"mensaje": "Evento publicado correctamente"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/eventos', methods=['GET'])
def obtener_eventos():
    try:
        con = conectar()
        cursor = con.cursor()
        cursor.execute("SELECT id, titulo, DATE_FORMAT(fecha, '%%Y-%%m-%%d') as fecha, descripcion FROM eventos ORDER BY fecha ASC")
        eventos = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(eventos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# AVISOS
# ---------------------------------------------------------
@app.route('/avisos', methods=['POST'])
def enviar_aviso():
    data = request.json
    mensaje = data.get('mensaje')

    if not mensaje:
        return jsonify({"error": "El mensaje no puede estar vacío"}), 400

    try:
        con = conectar()
        cursor = con.cursor()
        sql = "INSERT INTO avisos (mensaje) VALUES (%s)"
        cursor.execute(sql, (mensaje,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"mensaje": "Aviso enviado correctamente a los socios"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# FOTO DE PERFIL
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# INICIO DE LA APLICACIÓN
# ---------------------------------------------------------
if __name__ == '__main__':
    print("Servidor iniciado en http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)