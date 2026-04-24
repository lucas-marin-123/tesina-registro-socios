// ===== INICIO =====
window.onload = () => {
  mostrarPantalla("inicio");
  renderCalendario();
};

// ===== USUARIOS =====
let usuarios = [
  { email: "admin@club.com", password: "1234", rol: "admin" },
  { email: "profe@club.com", password: "1234", rol: "entrenador", deporte: "Fútbol" },
  { email: "socio@club.com", password: "1234", rol: "socio", nombre: "Juan Pérez" }
];

let usuarioActual = null;

// ===== DATOS =====
let socios = [
  { nombre: "Juan Pérez", deporte: "Fútbol", estado: "Al día", pagos: [] }
];

let eventos = [];
let fechaActual = new Date();

// ===== PANTALLAS =====
function mostrarPantalla(id){
  document.querySelectorAll(".pantalla").forEach(p=>p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ===== LOGIN =====
function login(){
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  let user = usuarios.find(u => u.email === email && u.password === password);

  if(!user){
    alert("Datos incorrectos");
    return;
  }

  usuarioActual = user;

  if(user.rol === "admin"){
    mostrarPantalla("admin");
  }

  if(user.rol === "entrenador"){
    cargarEntrenador();
    mostrarPantalla("entrenador");
  }

  if(user.rol === "socio"){
    cargarSocio();
    mostrarPantalla("socio");
  }
}

function logout(){
  usuarioActual = null;
  mostrarPantalla("inicio");
}

// ===== ADMIN =====
function mostrarSeccionAdmin(id){
  document.querySelectorAll(".admin-seccion").forEach(s => s.style.display="none");
  document.getElementById(id).style.display="block";
}

function agregarSocio(){
  let nombre = document.getElementById("nombreSocio").value;
  let deporte = document.getElementById("deporteSocio").value;
  let estado = document.getElementById("estadoSocio").value;

  if(!nombre || !deporte){
    alert("Completar datos");
    return;
  }

  socios.push({ nombre, deporte, estado, pagos: [] });
  renderSocios();
}

function renderSocios(){
  let tbody = document.querySelector("#tablaSocios tbody");
  tbody.innerHTML = "";

  socios.forEach((s,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${s.nombre}</td>
        <td>${s.deporte}</td>
        <td>${s.estado}</td>
      </tr>
    `;
  });

  document.getElementById("totalSocios").textContent = socios.length;
}

// ===== ENTRENADOR =====
function cargarEntrenador(){
  let lista = document.getElementById("listaEntrenador");
  lista.innerHTML = "";

  socios.forEach(s=>{
    lista.innerHTML += `<div class="card">${s.nombre}</div>`;
  });
}

function reservarCancha(){
  alert("Cancha reservada");
}

// ===== CALENDARIO =====
function renderCalendario(){
  let grid = document.getElementById("gridCalendario");
  let mesAnio = document.getElementById("mesAnio");

  let año = fechaActual.getFullYear();
  let mes = fechaActual.getMonth();

  let primerDia = new Date(año, mes, 1).getDay();
  let diasMes = new Date(año, mes+1, 0).getDate();

  let meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  mesAnio.textContent = meses[mes] + " " + año;
  grid.innerHTML = "";

  for(let i=0;i<primerDia;i++){
    grid.innerHTML += "<div></div>";
  }

  for(let d=1; d<=diasMes; d++){
    let fechaStr = `${año}-${mes+1}-${d}`;

    let tieneEvento = eventos.some(e=>e.fecha===fechaStr);

    grid.innerHTML += `
      <div class="${tieneEvento ? 'evento' : ''}">
        ${d}
      </div>
    `;
  }
}

function cambiarMes(dir){
  fechaActual.setMonth(fechaActual.getMonth() + dir);
  renderCalendario();
}

function agregarEvento(){
  let fecha = document.getElementById("fechaEvento").value;
  let texto = document.getElementById("eventoTexto").value;

  if(!fecha || !texto){
    alert("Completar datos del evento");
    return;
  }

  eventos.push({ fecha, texto });

  renderCalendario();
  alert("Evento agregado");
}

// ===== SOCIO =====
function cargarSocio(){
  let socio = socios[0];

  let estadoBox = document.getElementById("estadoSocioBox");
  let historial = document.getElementById("historialPagos");

  estadoBox.textContent = socio.estado;
  estadoBox.className = "estado " + (socio.estado === "Al día" ? "verde" : "rojo");

  historial.innerHTML = "";

  socio.pagos.forEach(p=>{
    historial.innerHTML += `<li>${p.fecha} - $${p.monto}</li>`;
  });
}

function pagar(){
  let socio = socios[0];

  socio.pagos.push({
    fecha: new Date().toLocaleDateString(),
    monto: 5000
  });

  socio.estado = "Al día";
  cargarSocio();

  document.getElementById("ingresos").textContent =
    Number(document.getElementById("ingresos").textContent) + 5000;
}

// ===== EXTRA =====
function toggleTheme(){
  document.body.classList.toggle("dark");
}