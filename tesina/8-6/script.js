// ===== CLUB ZONE =====

let usuarioActual = null;
let fechaActual = new Date();

// ===== INICIO =====

window.onload = () => {

    document.title = "Club Zone";

    mostrarPantalla("inicio");

    renderCalendario();

};

// ===== PANTALLAS =====

function mostrarPantalla(id){

    document
        .querySelectorAll(".pantalla")
        .forEach(p => p.classList.remove("activa"));

    document
        .getElementById(id)
        .classList.add("activa");

}

// ===== LOGIN =====

function login(){

    let email =
        document.getElementById("email").value.trim();

    let password =
        document.getElementById("password").value.trim();

    if(email === "" || password === ""){

        alert("Complete email y contraseña");

        return;
    }

    fetch("http://127.0.0.1:5000/login",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            email,
            password
        })

    })

    .then(response => response.json())

    .then(data => {

        if(data.error){

            alert(data.error);
            return;
        }

        usuarioActual = data;

        alert(
            "Bienvenido a Club Zone, " +
            data.rol
        );

        if(data.rol === "admin"){

            mostrarPantalla("admin");

            cargarSocios();

            mostrarSeccionAdmin("verSocios");

        }

        if(data.rol === "entrenador"){

            mostrarPantalla("entrenador");

            cargarEntrenador();

        }

        if(data.rol === "socio"){

            mostrarPantalla("socio");

            cargarPagos();

        }

    })

    .catch(error => {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor Flask"
        );

    });

}

// ===== LOGOUT =====

function logout(){

    usuarioActual = null;

    document.getElementById("email").value = "";

    document.getElementById("password").value = "";

    alert("Sesión cerrada");

    mostrarPantalla("inicio");

}

// ===== ADMIN =====

function mostrarSeccionAdmin(id){

    document
        .querySelectorAll(".admin-seccion")
        .forEach(sec => sec.style.display = "none");

    document
        .getElementById(id)
        .style.display = "block";

}

// ===== CARGAR SOCIOS =====

function cargarSocios(){

    fetch("http://127.0.0.1:5000/socios")

    .then(response => response.json())

    .then(data => {

        let tabla =
            document.querySelector(
                "#tablaSocios tbody"
            );

        tabla.innerHTML = "";

        document
            .getElementById("totalSocios")
            .textContent = data.length;

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

    .catch(error => {

        console.error(error);

    });

}

// ===== REGISTRAR SOCIO =====

function agregarSocio(){

    let nombre =
        document.getElementById("nombreSocio").value;

    let deporte =
        document.getElementById("deporteSocio").value;

    let estado =
        document.getElementById("estadoSocio").value;

    if(nombre === "" || deporte === ""){

        alert("Complete todos los datos");

        return;
    }

    fetch("http://127.0.0.1:5000/socios",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            nombre,
            deporte,
            estado
        })

    })

    .then(response => response.json())

    .then(data => {

        alert(data.mensaje);

        document.getElementById(
            "nombreSocio"
        ).value = "";

        document.getElementById(
            "deporteSocio"
        ).value = "";

        cargarSocios();

    });

}

// ===== CREAR USUARIO =====

function crearUsuario(){

    let email =
        document.getElementById("nuevoEmail").value;

    let password =
        document.getElementById("nuevoPassword").value;

    let rol =
        document.getElementById("nuevoRol").value;

    fetch("http://127.0.0.1:5000/usuarios",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            email,
            password,
            rol
        })

    })

    .then(response => response.json())

    .then(data => {

        alert(data.mensaje);

        document.getElementById(
            "nuevoEmail"
        ).value = "";

        document.getElementById(
            "nuevoPassword"
        ).value = "";

    });

}

// ===== ENTRENADOR =====

function cargarEntrenador(){

    fetch("http://127.0.0.1:5000/socios")

    .then(response => response.json())

    .then(data => {

        let lista =
            document.getElementById(
                "listaEntrenador"
            );

        lista.innerHTML = "";

        data.forEach(socio => {

            lista.innerHTML += `

            <div class="card">
                <strong>${socio.nombre}</strong>
                <br>
                ${socio.deporte}
            </div>

            `;

        });

    });

}

// ===== PAGAR CUOTA =====

function pagar(){

    fetch("http://127.0.0.1:5000/pagar",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            socio_id:1,

            monto:5000

        })

    })

    .then(response => response.json())

    .then(data => {

        alert(data.mensaje);

        cargarPagos();

    });

}

// ===== HISTORIAL DE PAGOS =====

function cargarPagos(){

    fetch("http://127.0.0.1:5000/pagos/1")

    .then(response => response.json())

    .then(data => {

        let lista =
            document.getElementById(
                "historialPagos"
            );

        lista.innerHTML = "";

        let total = 0;

        data.forEach(pago => {

            total += pago.monto;

            lista.innerHTML += `

            <li>
                ${pago.fecha}
                - $${pago.monto}
            </li>

            `;

        });

        let ingresos =
            document.getElementById("ingresos");

        if(ingresos){

            ingresos.textContent = total;

        }

    });

}

// ===== CALENDARIO =====

function renderCalendario(){

    let grid =
        document.getElementById(
            "gridCalendario"
        );

    let mesAnio =
        document.getElementById(
            "mesAnio"
        );

    let anio =
        fechaActual.getFullYear();

    let mes =
        fechaActual.getMonth();

    let primerDia =
        new Date(
            anio,
            mes,
            1
        ).getDay();

    let diasMes =
        new Date(
            anio,
            mes + 1,
            0
        ).getDate();

    let meses = [

        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"

    ];

    mesAnio.textContent =
        meses[mes] +
        " " +
        anio;

    grid.innerHTML = "";

    for(let i=0;i<primerDia;i++){

        grid.innerHTML += "<div></div>";

    }

    for(let dia=1; dia<=diasMes; dia++){

        grid.innerHTML += `
            <div>${dia}</div>
        `;

    }

}

// ===== CAMBIAR MES =====

function cambiarMes(direccion){

    fechaActual.setMonth(
        fechaActual.getMonth() + direccion
    );

    renderCalendario();

}

// ===== MODO OSCURO =====

function toggleTheme(){

    document.body.classList.toggle("dark");

}