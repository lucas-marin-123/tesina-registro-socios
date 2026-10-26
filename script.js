// =====================================================
// CLUB ZONE - JAVASCRIPT
// =====================================================

let usuarioActual = null;
let fechaActual = new Date();

// Auxiliares de usuario para la foto de perfil
function getUser() {
    if (usuarioActual) return usuarioActual;
    const local = localStorage.getItem("usuarioActual") || localStorage.getItem("campus_user");
    if (local) {
        try { return JSON.parse(local); } catch (e) { return null; }
    }
    return { nombre: "Socio", rol: "socio", email: "socio@clubzone.com" };
}

async function apiFetch(url, options = {}) {
    options.headers = options.headers || { "Content-Type": "application/json" };
    const res = await fetch("http://127.0.0.1:5000" + url, options);
    if (!res.ok) throw new Error("Error API");
    return await res.json();
}

function actualizarUsuario(email, datos) {
    let user = getUser();
    if (user) {
        Object.assign(user, datos);
        usuarioActual = user;
        localStorage.setItem("usuarioActual", JSON.stringify(user));
        localStorage.setItem("campus_user", JSON.stringify(user));
    }
}

// =====================================================
// SISTEMA DE NOTIFICACIONES TOAST (Reemplazo de alert)
// =====================================================

function mostrarNotificacion(mensaje, tipo = 'exito') {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    
    let icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'advertencia') icono = '⚠️';
    if (tipo === 'info') icono = 'ℹ️';

    toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}

function mostrarExito(mensaje) {
    mostrarNotificacion(mensaje, 'exito');
}

// =====================================================
// INICIO
// =====================================================

window.addEventListener("load", () => {
    document.title = document.title || "Club Zone";

    const storedUser = localStorage.getItem("usuarioActual");
    if (storedUser) {
        try {
            usuarioActual = JSON.parse(storedUser);
        } catch (e) {
            console.error("Error al parsear usuario local", e);
        }
    }

    initAvatar();

    if (document.getElementById("gridCalendario")) {
        renderCalendario();
    }
    if (document.getElementById("tablaSocios")) {
        cargarSocios();
    }
    if (document.getElementById("listaEntrenador")) {
        cargarEntrenador();
    }
    if (document.getElementById("historialPagos")) {
        cargarPagos();
    }

    // Cargar bienvenida dinámica si está en el panel socio
    const elNombre = document.getElementById("nombreSocioBienvenida");
    const user = getUser();
    if (elNombre && user) {
        elNombre.textContent = user.nombre || "Socio";
    }
});

// =====================================================
// HISTORIAL DE PAGOS DE SOCIO
// =====================================================

function cargarPagos() {
    const user = getUser();
    if (!user || !user.id) return;

    fetch(`http://127.0.0.1:5000/pagos/${user.id}`)
        .then(response => {
            if (!response.ok) throw new Error("Error en la red");
            return response.json();
        })
        .then(data => {
            const lista = document.getElementById("historialPagos");
            if (!lista) return;

            lista.innerHTML = "";
            let total = 0;

            if (!Array.isArray(data) || data.length === 0) {
                lista.innerHTML = "<p>No hay pagos registrados aún.</p>";
                return;
            }

            data.forEach(pago => {
                total += Number(pago.monto);
                lista.innerHTML += `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between;">
                        <span>📅 ${pago.fecha}</span>
                        <strong>$${pago.monto}</strong>
                    </div>`;
            });

            const ingresos = document.getElementById("ingresos");
            if (ingresos) ingresos.textContent = `$${total}`;
        })
        .catch(error => {
            console.error("Error cargando pagos:", error);
            const lista = document.getElementById("historialPagos");
            if (lista) lista.innerHTML = "<p>Error al cargar el historial de pagos.</p>";
        });
}

// =====================================================
// LOGIN & LOGOUT
// =====================================================

function login() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === "" || password === "") {
        mostrarNotificacion("Complete email y contraseña", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarNotificacion(data.error, "error");
            return;
        }

        usuarioActual = data;
        localStorage.setItem("usuarioActual", JSON.stringify(data));
        localStorage.setItem("campus_user", JSON.stringify(data));

        if (data.foto) {
            _aplicarFotoLocal(data.foto);
        }

        const nombre = data.nombre || data.email || "Usuario";
        mostrarNotificacion(`¡Bienvenido a Club Zone, ${nombre}!`, "exito");

        setTimeout(() => {
            if (data.rol === "admin") {
                window.location.href = "administrador.html";
                return;
            }
            if (data.rol === "entrenador") {
                window.location.href = "entrenador.html";
                return;
            }
            if (data.rol === "socio") {
                window.location.href = "socio.html";
                return;
            }

            mostrarNotificacion("Rol de usuario no reconocido", "error");
        }, 1200);
    })
    .catch(error => {
        console.error(error);
        mostrarNotificacion("No se pudo conectar con el servidor Flask", "error");
    });
}

function logout() {
    usuarioActual = null;
    localStorage.removeItem("usuarioActual");
    localStorage.removeItem("campus_user");
    mostrarNotificacion("Sesión cerrada correctamente", "info");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

// =====================================================
// NAVEGACIÓN Y PESTAÑAS
// =====================================================

function mostrarSeccionAdmin(id) {
    const secciones = document.querySelectorAll(".admin-seccion");
    secciones.forEach(sec => sec.style.display = "none");
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = "block";
}

function mostrarSeccionEntrenador(id) {
    const secciones = document.querySelectorAll(".entrenador-seccion");
    secciones.forEach(sec => sec.style.display = "none");
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = "block";
}

function mostrarSeccionSocio(id) {
    const secciones = document.querySelectorAll(".socio-seccion");
    secciones.forEach(sec => sec.style.display = "none");
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = "block";
}

// =====================================================
// ADMINISTRADOR
// =====================================================

function cargarSocios() {
    fetch("http://127.0.0.1:5000/socios")
        .then(response => response.json())
        .then(data => {
            const tabla = document.querySelector("#tablaSocios tbody");
            const totalSocios = document.getElementById("totalSocios");

            if (!tabla) return;
            tabla.innerHTML = "";

            if (totalSocios) totalSocios.textContent = data.length;

            data.forEach(socio => {
                tabla.innerHTML += `
                    <tr>
                        <td>${socio.nombre}</td>
                        <td>${socio.deporte}</td>
                        <td>${socio.estado}</td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Error cargando socios:", error));
}

function agregarSocio() {
    const nombreInput = document.getElementById("nombreSocio");
    const deporteInput = document.getElementById("deporteSocio");
    const estadoInput = document.getElementById("estadoSocio");

    if (!nombreInput || !deporteInput || !estadoInput) return;

    const nombre = nombreInput.value.trim();
    const deporte = deporteInput.value.trim();
    const estado = estadoInput.value;

    if (nombre === "" || deporte === "") {
        mostrarNotificacion("Complete todos los datos requeridos", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, deporte: deporte, estado: estado })
    })
    .then(response => response.json())
    .then(data => {
        mostrarNotificacion(data.mensaje || "Socio registrado correctamente", "exito");
        nombreInput.value = "";
        deporteInput.value = "";
        cargarSocios();
    })
    .catch(error => {
        console.error(error);
        mostrarNotificacion("Error al registrar el socio", "error");
    });
}

function crearUsuario() {
    const nombreInput = document.getElementById("nuevoNombre");
    const emailInput = document.getElementById("nuevoEmail");
    const passwordInput = document.getElementById("nuevoPassword");
    const rolInput = document.getElementById("nuevoRol");

    if (!nombreInput || !emailInput || !passwordInput || !rolInput) return;

    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rol = rolInput.value;

    if (nombre === "" || email === "" || password === "") {
        mostrarNotificacion("Complete todos los datos del nuevo usuario", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, email: email, password: password, rol: rol })
    })
    .then(response => response.json())
    .then(data => {
        mostrarNotificacion(data.mensaje || "Usuario creado correctamente", "exito");
        nombreInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";
    })
    .catch(error => {
        console.error(error);
        mostrarNotificacion("Error al crear el usuario", "error");
    });
}

function crearEventoAdmin() {
    const titulo = document.getElementById("tituloEventoAdmin").value.trim();
    const fecha = document.getElementById("fechaEventoAdmin").value;
    const descripcion = document.getElementById("descripcionEventoAdmin").value.trim();

    if (!titulo || !fecha) {
        mostrarNotificacion("Complete el título y la fecha del evento", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, fecha, descripcion })
    })
    .then(res => res.json())
    .then(data => {
        mostrarNotificacion(data.mensaje || "Evento publicado correctamente", "exito");
        document.getElementById("tituloEventoAdmin").value = "";
        document.getElementById("fechaEventoAdmin").value = "";
        document.getElementById("descripcionEventoAdmin").value = "";
    })
    .catch(err => mostrarNotificacion("Error de conexión al intentar crear el evento", "error"));
}

// =====================================================
// ENTRENADOR
// =====================================================

function cargarEntrenador() {
    fetch("http://127.0.0.1:5000/socios")
        .then(response => response.json())
        .then(data => {
            const lista = document.getElementById("listaEntrenador");
            if (!lista) return;

            lista.innerHTML = "";
            data.forEach(socio => {
                lista.innerHTML += `
                    <div class="card">
                        <strong>${socio.nombre}</strong><br>
                        ${socio.deporte}
                    </div>
                `;
            });
        })
        .catch(error => console.error("Error cargando socios:", error));
}

function guardarAsistencia() {
    const socio = document.getElementById("socioAsistencia");
    const estado = document.getElementById("estadoAsistencia");
    if (!socio || !estado) return;
    mostrarNotificacion(`Asistencia guardada: ${socio.value} - ${estado.value}`, "exito");
}

function guardarObservacion() {
    const socio = document.getElementById("socioObservacion");
    const observacion = document.getElementById("observacion");
    if (!socio || !observacion) return;
    if (observacion.value.trim() === "") {
        mostrarNotificacion("Ingrese una observación válida", "advertencia");
        return;
    }
    mostrarNotificacion(`Observación guardada para ${socio.value}`, "exito");
    observacion.value = "";
}

function crearActividad() {
    const actividad = document.getElementById("actividad");
    const fecha = document.getElementById("fechaActividad");
    if (!actividad || !fecha) return;
    if (actividad.value.trim() === "" || fecha.value === "") {
        mostrarNotificacion("Complete los datos de la actividad", "advertencia");
        return;
    }
    mostrarNotificacion(`Actividad "${actividad.value}" creada correctamente`, "exito");
    actividad.value = "";
    fecha.value = "";
}

function guardarResultado() {
    const rival = document.getElementById("rival");
    const resultado = document.getElementById("resultado");
    if (!rival || !resultado) return;
    if (rival.value.trim() === "" || resultado.value.trim() === "") {
        mostrarNotificacion("Complete los datos del partido", "advertencia");
        return;
    }
    mostrarNotificacion(`Resultado guardado: Club Zone vs ${rival.value} (${resultado.value})`, "exito");
    rival.value = "";
    resultado.value = "";
}

function enviarAviso() {
    const mensaje = document.getElementById("aviso").value.trim();

    if (!mensaje) {
        mostrarNotificacion("Escriba un aviso antes de enviar", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje })
    })
    .then(res => res.json())
    .then(data => {
        mostrarNotificacion("Aviso enviado a todos los socios", "exito");
        document.getElementById("aviso").value = "";
    })
    .catch(err => mostrarNotificacion("Error de conexión al registrar el aviso", "error"));
}

function solicitarMaterial() {
    const material = document.getElementById("material");
    if (!material) return;
    if (material.value.trim() === "") {
        mostrarNotificacion("Indique el material solicitado", "advertencia");
        return;
    }
    mostrarNotificacion("Solicitud de material enviada a administración", "exito");
    material.value = "";
}

function crearEventoEntrenador() {
    const titulo = document.getElementById("tituloEventoEntrenador").value.trim();
    const fecha = document.getElementById("fechaEventoEntrenador").value;
    const descripcion = document.getElementById("descripcionEventoEntrenador").value.trim();

    if (!titulo || !fecha) {
        mostrarNotificacion("Complete el título y la fecha del evento", "advertencia");
        return;
    }

    fetch("http://127.0.0.1:5000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, fecha, descripcion })
    })
    .then(res => res.json())
    .then(data => {
        mostrarNotificacion(data.mensaje || "Evento publicado con éxito", "exito");
        document.getElementById("tituloEventoEntrenador").value = "";
        document.getElementById("fechaEventoEntrenador").value = "";
        document.getElementById("descripcionEventoEntrenador").value = "";
    })
    .catch(err => mostrarNotificacion("Error de conexión al intentar crear el evento", "error"));
}

// =====================================================
// FUNCIONES DE PAGOS Y ACCIONES DE SOCIO
// =====================================================

function pagar() {
    const user = getUser();
    
    if (!user || !user.id) {
        mostrarNotificacion("Debe iniciar sesión para realizar un pago", "advertencia");
        return;
    }

    const numTarjeta = document.getElementById("numeroTarjeta")?.value.trim();
    const titular = document.getElementById("nombreTitular")?.value.trim();

    if (!numTarjeta || !titular) {
        mostrarNotificacion("Complete los datos de la tarjeta antes de pagar", "advertencia");
        return;
    }

    const montoCuota = 5000;

    fetch("http://127.0.0.1:5000/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            socio_id: user.id, 
            monto: montoCuota 
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al procesar el pago");
        return res.json();
    })
    .then(data => {
        mostrarNotificacion("¡Pago de cuota realizado con éxito!", "exito");
        
        if (document.getElementById("numeroTarjeta")) document.getElementById("numeroTarjeta").value = "";
        if (document.getElementById("nombreTitular")) document.getElementById("nombreTitular").value = "";
        if (document.getElementById("fechaVencimiento")) document.getElementById("fechaVencimiento").value = "";
        if (document.getElementById("aliasPago")) document.getElementById("aliasPago").value = "";

        cargarPagos();
    })
    .catch(err => {
        console.error(err);
        mostrarNotificacion("Ocurrió un error al registrar el pago", "error");
    });
}

function descargarComprobantePDF() {
    if (!window.jspdf) {
        mostrarNotificacion("Cargando librería PDF, reintente en un momento", "info");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const nombreSocio = usuarioActual ? usuarioActual.nombre : "Socio Club Zone";
    const fechaActualStr = new Date().toLocaleDateString();
    const numComprobante = "REC-" + Math.floor(100000 + Math.random() * 900000);

    doc.setFontSize(20);
    doc.text("CLUB ZONE - Comprobante de Pago", 20, 20);
    doc.setFontSize(12);
    doc.text(`Nº Comprobante: ${numComprobante}`, 20, 40);
    doc.text(`Socio: ${nombreSocio}`, 20, 50);
    doc.text(`Concepto: Cuota Mensual`, 20, 60);
    doc.text(`Monto: $5000`, 20, 70);
    doc.text(`Fecha de emisión: ${fechaActualStr}`, 20, 80);
    doc.text(`Estado: PAGADO`, 20, 90);

    doc.save(`Comprobante_${nombreSocio}.pdf`);
    mostrarNotificacion("Comprobante descargado en PDF", "exito");
}

function inscribirTorneo() {
    const torneo = prompt("Ingresá el nombre del torneo:");
    if (!torneo) {
        mostrarNotificacion("Inscripción cancelada", "info");
        return;
    }
    mostrarNotificacion(`Inscripto al torneo "${torneo}"`, "exito");
}

function inscribirActividad() {
    const actividad = prompt("Ingresá la actividad a la que querés anotarte:", "Vóley los Miércoles");
    if (!actividad) return;
    mostrarNotificacion(`Inscripto correctamente a: ${actividad}`, "exito");
}

function actualizarDatosSocio() {
    const nuevoNombre = prompt("Nuevo nombre:", usuarioActual ? usuarioActual.nombre : "");
    const nuevoEmail = prompt("Nuevo correo electrónico:", usuarioActual ? usuarioActual.email : "");

    if (!nuevoNombre || !nuevoEmail) {
        mostrarNotificacion("Campos incompletos. No se realizaron cambios", "advertencia");
        return;
    }

    if (usuarioActual) {
        usuarioActual.nombre = nuevoNombre;
        usuarioActual.email = nuevoEmail;
    }

    mostrarNotificacion("Datos personales actualizados", "exito");
}

function enviarMensajeEntrenador() {
    const textarea = document.querySelector("#socioContacto textarea");
    if (textarea && textarea.value.trim() !== "") {
        mostrarNotificacion("Mensaje enviado al entrenador", "exito");
        textarea.value = "";
    } else {
        mostrarNotificacion("Escribe un mensaje antes de enviar", "advertencia");
    }
}

// =====================================================
// 📸 FOTO DE PERFIL
// =====================================================

function renderAvatar(user) {
    const avatarEl = document.getElementById('avatarInitial');
    if (!avatarEl) return;

    if (user && user.foto) {
        avatarEl.style.cssText += `
            background-image: url('${user.foto}');
            background-size: cover;
            background-position: center;
            font-size: 0;
        `;
    } else if (user) {
        avatarEl.style.backgroundImage = 'none';
        avatarEl.textContent = user.nombre ? user.nombre[0].toUpperCase() : '?';
    }

    avatarEl.style.cursor = 'pointer';
    avatarEl.title = 'Ver perfil';
    avatarEl.onclick = () => abrirModalPerfil();
}

function abrirModalPerfil() {
    const user = getUser();
    if (!user) return;

    if (document.getElementById('perfilModal')) return;

    const fotoActual = user.foto
        ? `<img src="${user.foto}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #38bdf8;" />`
        : `<div style="width:90px;height:90px;border-radius:50%;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:700;border:3px solid #38bdf8;">${user.nombre ? user.nombre[0].toUpperCase() : '?'}</div>`;

    const overlay = document.createElement('div');
    overlay.id = 'perfilModal';
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,.65);
        display:flex; align-items:center; justify-content:center;
        z-index:9999; font-family:'Segoe UI',sans-serif;
    `;

    overlay.innerHTML = `
        <div style="background:#1e293b; border-radius:18px; padding:32px; max-width:400px; width:92%; box-shadow:0 20px 60px rgba(0,0,0,.4); position:relative; color:#f8fafc;">
            <button onclick="cerrarModalPerfil()" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#9ca3af;">✕</button>

            <div style="text-align:center; margin-bottom:20px;">
                <div id="previewFotoWrap" style="display:inline-block; margin-bottom:12px;">
                    ${fotoActual}
                </div>
                <div style="font-size:1.2rem; color:#f8fafc; font-weight:700;">${user.nombre || 'Usuario'}</div>
                <div style="font-size:.82rem; color:#38bdf8; margin-top:2px; text-transform:uppercase; letter-spacing:1px;">${user.rol || 'socio'}</div>
                <div style="font-size:.82rem; color:#9ca3af; margin-top:2px;">${user.email || ''}</div>
            </div>

            <div style="border-top:1px solid #334155; padding-top:18px;">
                <p style="font-size:.83rem; color:#9ca3af; margin-bottom:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px;">Cambiar foto de perfil</p>

                <label for="fotoInput" style="
                    display:block; border:2px dashed #475569; border-radius:10px;
                    padding:16px; text-align:center; cursor:pointer; color:#9ca3af;
                    font-size:.88rem; transition:border .2s; margin-bottom:12px;
                " id="fotoLabel">
                    📷 Seleccioná una imagen<br>
                    <span style="font-size:.75rem; color:#64748b;">JPG, PNG — máx. 2MB</span>
                </label>
                <input type="file" id="fotoInput" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="previsualizarFoto(event)" />

                <div id="fotoError" style="color:#ef4444;font-size:.82rem;display:none;margin-bottom:8px;"></div>

                <button id="btnGuardarFoto" onclick="guardarFoto()" style="
                    width:100%; background:linear-gradient(135deg,#38bdf8,#2563eb); color:#fff; border:none;
                    padding:12px; border-radius:9px; font-size:.93rem; font-weight:600; cursor:pointer; display:none;
                ">💾 Guardar foto</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarModalPerfil();
    });
}

function cerrarModalPerfil() {
    const modal = document.getElementById('perfilModal');
    if (modal) modal.remove();
}

function previsualizarFoto(event) {
    const file = event.target.files[0];
    const errEl = document.getElementById('fotoError');
    if (errEl) errEl.style.display = 'none';

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        if (errEl) {
            errEl.textContent = 'La imagen supera los 2MB. Elegí una más pequeña.';
            errEl.style.display = 'block';
        }
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        document.getElementById('previewFotoWrap').innerHTML =
            `<img src="${base64}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #38bdf8;" />`;
        document.getElementById('btnGuardarFoto').style.display = 'block';
        document.getElementById('fotoLabel').style.borderColor = '#38bdf8';
        document.getElementById('fotoLabel').innerHTML = `✅ ${file.name}<br><span style="font-size:.75rem;color:#9ca3af;">Listo para guardar</span>`;

        window._fotoBase64Pendiente = base64;
    };
    reader.readAsDataURL(file);
}

async function guardarFoto() {
    const base64 = window._fotoBase64Pendiente;
    const user = getUser();

    if (!base64 || !user || !user.email) return;

    const btn = document.getElementById('btnGuardarFoto');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando...';
    }

    try {
        const res = await apiFetch('/foto', {
            method: 'PUT',
            body: JSON.stringify({ 
                foto: base64,
                email: user.email 
            })
        });

        if (res && res.foto) {
            _aplicarFotoLocal(res.foto);
            cerrarModalPerfil();
            mostrarNotificacion("Foto actualizada correctamente", "exito");
            return;
        }
    } catch (err) {
        console.error("Error al conectar con la API:", err);
    }

    _aplicarFotoLocal(base64);
    cerrarModalPerfil();
}

function _aplicarFotoLocal(base64) {
    const user = getUser();
    if (!user) return;
    const updated = { ...user, foto: base64 };
    localStorage.setItem('campus_user', JSON.stringify(updated));
    localStorage.setItem('usuarioActual', JSON.stringify(updated));
    if (typeof actualizarUsuario === 'function') {
        actualizarUsuario(user.email, { foto: base64 });
    }
    renderAvatar(updated);
    window._fotoBase64Pendiente = null;
}

function initAvatar() {
    const user = getUser();
    if (user) renderAvatar(user);
}

// =====================================================
// CALENDARIO
// =====================================================

function renderCalendario() {
    const grid = document.getElementById("gridCalendario");
    const mesAnio = document.getElementById("mesAnio");

    if (!grid || !mesAnio) return;

    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasMes = new Date(anio, mes + 1, 0).getDate();

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    mesAnio.textContent = meses[mes] + " " + anio;
    grid.innerHTML = "";

    for (let i = 0; i < primerDia; i++) {
        grid.innerHTML += "<div></div>";
    }

    for (let dia = 1; dia <= diasMes; dia++) {
        grid.innerHTML += `<div>${dia}</div>`;
    }
}

function cambiarMes(direccion) {
    fechaActual.setMonth(fechaActual.getMonth() + direccion);
    renderCalendario();
}

// =====================================================
// TEMA OSCURO
// =====================================================

function toggleTheme() {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
        localStorage.setItem("tema", "dark");
    } else {
        localStorage.setItem("tema", "light");
    }
}

function cargarTema() {
    const tema = localStorage.getItem("tema");
    if (tema === "dark") {
        document.body.classList.add("dark");
    }
}

// =====================================================
// DOM CONTENT LOADED & EVENTOS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    cargarTema();

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (email && password) {
        email.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                password.focus();
            }
        });

        password.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                login();
            }
        });
    }

    const socioInicio = document.getElementById("socioInicio");
    if (socioInicio) {
        mostrarSeccionSocio("socioInicio");
    }
});

document.addEventListener("input", e => {
    if (e.target.id === "numeroTarjeta") {
        const valor = e.target.value;
        const numeroVista = document.getElementById("numeroVista");
        const marcaTarjeta = document.getElementById("marcaTarjeta");
        const tarjeta = document.querySelector(".tarjeta-3d");

        if (numeroVista) numeroVista.textContent = valor || "0000 0000 0000 0000";

        if (valor.startsWith("4")) {
            if (marcaTarjeta) marcaTarjeta.textContent = "VISA";
            if (tarjeta) tarjeta.style.background = "linear-gradient(135deg,#1e3a8a,#2563eb,#38bdf8)";
        } else if (valor.startsWith("5")) {
            if (marcaTarjeta) marcaTarjeta.textContent = "MASTERCARD";
            if (tarjeta) tarjeta.style.background = "linear-gradient(135deg,#7f1d1d,#dc2626,#f59e0b)";
        } else {
            if (marcaTarjeta) marcaTarjeta.textContent = "TARJETA";
        }
    }

    if (e.target.id === "nombreTitular") {
        const nombreVista = document.getElementById("nombreVista");
        if (nombreVista) nombreVista.textContent = e.target.value || "TITULAR";
    }

    if (e.target.id === "fechaVencimiento") {
        const fechaVista = document.getElementById("fechaVista");
        if (fechaVista) fechaVista.textContent = e.target.value || "MM/AA";
    }
});

async function pagar() {
    // Captura de campos
    const numeroTarjeta = document.getElementById('numeroTarjeta').value.trim();
    const nombreTitular = document.getElementById('nombreTitular').value.trim();
    const fechaVencimiento = document.getElementById('fechaVencimiento').value.trim();
    const aliasPago = document.getElementById('aliasPago').value.trim();

    // Validar datos mínimos
    if (!numeroTarjeta || !nombreTitular || !fechaVencimiento) {
        alert('Por favor, completa todos los campos de la tarjeta.');
        return;
    }

    // Obtener ID del socio almacenado en sesión
    const socioId = localStorage.getItem('userId') || 1; 

    try {
        const respuesta = await fetch('/pagar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                socio_id: socioId,
                monto: 5000, // Monto de la cuota
                metodo: aliasPago ? 'Alias/Transferencia' : 'Tarjeta de Crédito/Débito'
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.status === 'ok') {
            alert('💳 ' + resultado.mensaje);
            
            // Limpiar formulario
            document.getElementById('numeroTarjeta').value = '';
            document.getElementById('nombreTitular').value = '';
            document.getElementById('fechaVencimiento').value = '';
            document.getElementById('aliasPago').value = '';

            // Actualizar vista o historial
            if (typeof cargarHistorialPagos === 'function') {
                cargarHistorialPagos();
            }
            mostrarSeccionSocio('socioHistorial');
        } else {
            alert('Error al procesar el pago: ' + (resultado.mensaje || 'Intente nuevamente'));
        }
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        alert('Ocurrió un error al conectar con el backend.');
    }
}