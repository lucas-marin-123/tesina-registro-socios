window.onload = () => {
  mostrarPantalla("inicio");
  renderCalendario();
};

let usuarios = [
  { email: "admin@club.com", password: "1234", rol: "admin" },
  { email: "profe@club.com", password: "1234", rol: "entrenador", deporte: "Fútbol" },
  { email: "socio@club.com", password: "1234", rol: "socio", nombre: "Juan Pérez" }
];

let usuarioActual = null;
let socios = [
  { nombre: "Juan Pérez", deporte: "Fútbol", estado: "Al día", pagos: [] }
];

let eventos = [];
let fechaActual = new Date();

function mostrarPantalla(id){
  document.querySelectorAll(".pantalla").forEach(p=>p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

function login(){
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  let user = usuarios.find(u => u.email===email && u.password===password);

  if(!user){
    alert("Error");
    return;
  }

  usuarioActual = user;

  if(user.rol==="admin") mostrarPantalla("admin");
  if(user.rol==="entrenador"){
    cargarEntrenador();
    mostrarPantalla("entrenador");
  }
  if(user.rol==="socio"){
    cargarSocio();
    mostrarPantalla("socio");
  }
}

function logout(){
  usuarioActual=null;
  mostrarPantalla("inicio");
}

function toggleTheme(){
  document.body.classList.toggle("dark");
}

/* ADMIN */
function mostrarCampoDeporte(){
  deporteProfe.style.display = (nuevoRol.value==="entrenador")?"block":"none";
}

function crearUsuario(){
  let nuevo = {
    email:nuevoEmail.value,
    password:nuevoPass.value,
    rol:nuevoRol.value
  };
  usuarios.push(nuevo);
  alert("Creado");
}

function agregarSocio(){
  socios.push({
    nombre:nombreSocio.value,
    deporte:deporteSocio.value,
    estado:estadoSocio.value,
    pagos:[]
  });
  renderSocios();
}

function renderSocios(){
  let tbody = tablaSocios.querySelector("tbody");
  tbody.innerHTML="";
  socios.forEach((s,i)=>{
    tbody.innerHTML+=`
      <tr>
        <td>${s.nombre}</td>
        <td>${s.deporte}</td>
        <td>${s.estado}</td>
        <td><button onclick="socios.splice(${i},1);renderSocios()">X</button></td>
      </tr>`;
  });
}

/* ENTRENADOR */
function cargarEntrenador(){
  listaEntrenador.innerHTML="";
  socios.forEach(s=>{
    listaEntrenador.innerHTML+=<div class="card">${s.nombre}</div>;
  });
}

function reservarCancha(){
  alert("Reservado");
}

/* CALENDARIO */
function renderCalendario(){
  let grid = document.getElementById("gridCalendario");
  let mesAnio = document.getElementById("mesAnio");

  let año = fechaActual.getFullYear();
  let mes = fechaActual.getMonth();

  let primerDia = new Date(año, mes, 1).getDay();
  let diasMes = new Date(año, mes+1, 0).getDate();

  let meses=["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  mesAnio.textContent=meses[mes]+" "+año;
  grid.innerHTML="";

  for(let i=0;i<primerDia;i++) grid.innerHTML+="<div></div>";

  for(let d=1; d<=diasMes; d++){
    let fechaStr=${año}-${mes+1}-${d};
    let tieneEvento = eventos.some(e=>e.fecha===fechaStr);

    grid.innerHTML+=<div class="${tieneEvento?'evento':''}">${d}</div>;
  }
}

function cambiarMes(dir){
  fechaActual.setMonth(fechaActual.getMonth()+dir);
  renderCalendario();
}

function agregarEvento(){
  eventos.push({fecha:fechaEvento.value,texto:eventoTexto.value});
  renderCalendario();
}

/* SOCIO */
function cargarSocio(){
  let socio = socios[0];

  estadoSocioBox.textContent=socio.estado;
  estadoSocioBox.className="estado verde";

  historialPagos.innerHTML="";
}

function pagar(){
  let socio = socios[0];

  socio.pagos.push({
    fecha:new Date().toLocaleDateString(),
    monto:5000
  });

  socio.estado="Al día";
  cargarSocio();
}