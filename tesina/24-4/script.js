// ===== INICIO =====
window.onload = () => {
  mostrarPantalla("inicio");
  renderCalendario();
};

let usuarioActual = null;
let eventos = [];
let fechaActual = new Date();

// ===== PANTALLAS =====
function mostrarPantalla(id){
  document.querySelectorAll(".pantalla").forEach(p=>p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");

  if(id === "login"){
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  }
}

// ===== LOGIN =====
function login(){
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(user => {

    if(user.error){
      alert(user.error);
      return;
    }

    usuarioActual = user;

    if(user.rol === "admin") mostrarPantalla("admin");

    if(user.rol === "entrenador"){
      cargarEntrenador();
      mostrarPantalla("entrenador");
    }

    if(user.rol === "socio"){
      cargarPagos();
      mostrarPantalla("socio");
    }

  })
  .catch(() => {
    alert("Error al conectar con el servidor");
  });
}

// ===== LOGOUT =====
function logout(){
  usuarioActual = null;
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  mostrarPantalla("inicio");
}

// ===== ENTRENADOR =====
function cargarEntrenador(){
  let lista = document.getElementById("listaEntrenador");
  lista.innerHTML = "<div class='card'>Socios cargados</div>";
}

// ===== PAGOS =====
function pagar(){
  fetch("http://127.0.0.1:5000/pagar", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      socio_id: 1,
      monto: 5000
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.mensaje);
    cargarPagos();
  });
}

function cargarPagos(){
  fetch("http://127.0.0.1:5000/pagos/1")
    .then(res => res.json())
    .then(data => {
      let lista = document.getElementById("historialPagos");
      lista.innerHTML = "";

      data.forEach(p => {
        lista.innerHTML += `<li>${p.fecha} - $${p.monto}</li>`;
      });
    });
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

  for(let i=0;i<primerDia;i++) grid.innerHTML += "<div></div>";

  for(let d=1; d<=diasMes; d++){
    grid.innerHTML += `<div>${d}</div>`;
  }
}

function cambiarMes(dir){
  fechaActual.setMonth(fechaActual.getMonth() + dir);
  renderCalendario();
}

// ===== TEMA =====
function toggleTheme(){
  document.body.classList.toggle("dark");
}