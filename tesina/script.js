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
});

// =====================================================
// HISTORIAL DE PAGOS DE SOCIO
// =====================================================

function cargarPagos() {
    fetch("http://127.0.0.1:5000/pagos/1")
        .then(response => {
            if (!response.ok) throw new Error("Error en la respuesta de la red");
            return response.json();
        })
        .then(data => {
            const lista = document.getElementById("historialPagos");
            if (!lista) return;

            lista.innerHTML = "";
            let total = 0;

            if (!Array.isArray(data) || data.length === 0) {
                lista.innerHTML = "<p>Todavía no hay pagos registrados.</p>";
                return;
            }

            data.forEach(pago => {
                total += Number(pago.monto);
                lista.innerHTML += `<p>${pago.fecha} - $${pago.monto}</p>`;
            });

            const ingresos = document.getElementById("ingresos");
            if (ingresos) ingresos.textContent = total;
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
        alert("Complete email y contraseña");
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
            alert(data.error);
            return;
        }

        usuarioActual = data;
        localStorage.setItem("usuarioActual", JSON.stringify(data));
        localStorage.setItem("campus_user", JSON.stringify(data));

        if (data.foto) {
            _aplicarFotoLocal(data.foto);
        }

        const nombre = data.nombre || data.email || "Usuario";
        alert("Bienvenido a Club Zone, " + nombre);

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

        alert("Rol de usuario no reconocido");
    })
    .catch(error => {
        console.error(error);
        alert("No se pudo conectar con el servidor Flask");
    });
}

function logout() {
    usuarioActual = null;
    localStorage.removeItem("usuarioActual");
    localStorage.removeItem("campus_user");
    alert("Sesión cerrada");
    window.location.href = "index.html";
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
        alert("Complete todos los datos");
        return;
    }

    fetch("http://127.0.0.1:5000/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, deporte: deporte, estado: estado })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje || "Socio registrado correctamente");
        nombreInput.value = "";
        deporteInput.value = "";
        cargarSocios();
    })
    .catch(error => {
        console.error(error);
        alert("Error al registrar el socio");
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
        alert("Complete todos los datos");
        return;
    }

    fetch("http://127.0.0.1:5000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, email: email, password: password, rol: rol })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje || "Usuario creado correctamente");
        nombreInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";
    })
    .catch(error => {
        console.error(error);
        alert("Error al crear el usuario");
    });
}

function crearEvento() {
    const titulo = document.getElementById("tituloEvento").value.trim();
    const fecha = document.getElementById("fechaEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value.trim();

    if (!titulo || !fecha) {
        alert("⚠️ Complete el título y la fecha del evento");
        return;
    }

    fetch("http://127.0.0.1:5000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, fecha, descripcion })
    })
    .then(res => res.json())
    .then(data => {
        mostrarExito(data.mensaje);
        document.getElementById("tituloEvento").value = "";
        document.getElementById("fechaEvento").value = "";
        document.getElementById("descripcionEvento").value = "";
    })
    .catch(err => alert("❌ Error de conexión al intentar crear el evento"));
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
    alert(`Asistencia guardada: ${socio.value} - ${estado.value}`);
}

function guardarObservacion() {
    const socio = document.getElementById("socioObservacion");
    const observacion = document.getElementById("observacion");
    if (!socio || !observacion) return;
    if (observacion.value.trim() === "") {
        alert("Ingrese una observación");
        return;
    }
    alert(`Observación guardada para ${socio.value}`);
    observacion.value = "";
}

function crearActividad() {
    const actividad = document.getElementById("actividad");
    const fecha = document.getElementById("fechaActividad");
    if (!actividad || !fecha) return;
    if (actividad.value.trim() === "" || fecha.value === "") {
        alert("Complete los datos de la actividad");
        return;
    }
    alert(`Actividad "${actividad.value}" creada para la fecha ${fecha.value}`);
    actividad.value = "";
    fecha.value = "";
}

function guardarResultado() {
    const rival = document.getElementById("rival");
    const resultado = document.getElementById("resultado");
    if (!rival || !resultado) return;
    if (rival.value.trim() === "" || resultado.value.trim() === "") {
        alert("Complete los datos del partido");
        return;
    }
    alert(`Resultado guardado: Club Zone vs ${rival.value} (${resultado.value})`);
    rival.value = "";
    resultado.value = "";
}

function enviarAviso() {
    const mensaje = document.getElementById("aviso").value.trim();

    if (!mensaje) {
        alert("⚠️ Escriba un aviso antes de enviar");
        return;
    }

    fetch("http://127.0.0.1:5000/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje })
    })
    .then(res => res.json())
    .then(data => {
        mostrarExito("Aviso enviado a todos los socios");
        document.getElementById("aviso").value = "";
    })
    .catch(err => alert("❌ Error de conexión al registrar el aviso"));
}

function solicitarMaterial() {
    const material = document.getElementById("material");
    if (!material) return;
    if (material.value.trim() === "") {
        alert("Indique el material solicitado");
        return;
    }
    alert("Solicitud de material enviada a la administración");
    material.value = "";
}

// =====================================================
// FUNCIONES DE PAGOS Y ACCIONES DE SOCIO
// =====================================================

function pagar() {
    const socioId = usuarioActual ? usuarioActual.id : 1;
    const monto = 5000;

    fetch("http://127.0.0.1:5000/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socio_id: socioId, monto: monto })
    })
    .then(res => res.json())
    .then(data => {
        mostrarExito("Pago procesado correctamente");
        if (typeof cargarPagos === "function") cargarPagos();
    })
    .catch(err => alert("❌ Error al procesar el pago"));
}

function descargarComprobantePDF() {
    if (!window.jspdf) {
        alert("Cargando librería PDF, reintente en un momento.");
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
}

function inscribirTorneo() {
    const torneo = prompt("Ingresá el nombre del torneo:");
    if (!torneo) {
        alert("⚠️ Debes ingresar el nombre del torneo para continuar");
        return;
    }
    mostrarExito(`Inscripto al torneo "${torneo}"`);
}

function inscribirActividad() {
    const actividad = prompt("Ingresá la actividad a la que querés anotarte:", "Vóley los Miércoles");
    if (!actividad) return;
    alert(`✅ Te inscribiste correctamente a: ${actividad}`);
}

function actualizarDatosSocio() {
    const nuevoNombre = prompt("Nuevo nombre:", usuarioActual ? usuarioActual.nombre : "");
    const nuevoEmail = prompt("Nuevo correo electrónico:", usuarioActual ? usuarioActual.email : "");

    if (!nuevoNombre || !nuevoEmail) {
        alert("⚠️ Campos incompletos. No se realizaron cambios.");
        return;
    }

    if (usuarioActual) {
        usuarioActual.nombre = nuevoNombre;
        usuarioActual.email = nuevoEmail;
    }

    mostrarExito("Datos personales actualizados");
}

function enviarMensajeEntrenador() {
    const textarea = document.querySelector("#socioContacto textarea");
    if (textarea && textarea.value.trim() !== "") {
        alert("Mensaje enviado al entrenador.");
        textarea.value = "";
    } else {
        alert("Escribe un mensaje antes de enviar.");
    }
}

// =====================================================
// 📸 FOTO DE PERFIL (Subida de imagen / Base64 / phpMyAdmin)
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
        btn.textContent = 'Guardando en BD...';
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
            mostrarExito("Foto actualizada en phpMyAdmin");
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

function mostrarExito(mensaje) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    
    toast.style.backgroundColor = "#22c55e";
    toast.style.color = "#ffffff";
    toast.style.padding = "12px 20px";
    toast.style.marginTop = "10px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
    toast.style.fontWeight = "bold";
    toast.innerText = "✅ " + mensaje;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// =====================================================
// FUNCIONES DE PAGOS REVISE Y ACTUALIZADAS
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
        .catch(error => console.error("Error cargando pagos:", error));
}

function pagar() {
    const user = getUser();
    
    if (!user || !user.id) {
        alert("⚠️ Debe iniciar sesión para realizar un pago.");
        return;
    }

    const numTarjeta = document.getElementById("numeroTarjeta")?.value.trim();
    const titular = document.getElementById("nombreTitular")?.value.trim();

    if (!numTarjeta || !titular) {
        alert("⚠️ Complete los datos de la tarjeta antes de pagar.");
        return;
    }

    const montoCuota = 5000; // Puedes cambiar el monto según tu lógica

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
        mostrarExito("¡Pago de cuota realizado con éxito!");
        
        // Limpiar inputs del formulario de tarjeta
        if (document.getElementById("numeroTarjeta")) document.getElementById("numeroTarjeta").value = "";
        if (document.getElementById("nombreTitular")) document.getElementById("nombreTitular").value = "";
        if (document.getElementById("fechaVencimiento")) document.getElementById("fechaVencimiento").value = "";

        // Recargar el historial de pagos de inmediato
        cargarPagos();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Ocurrió un error al registrar el pago.");
    });
}