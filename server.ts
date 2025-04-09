import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Función para verificar el estado de los bancos
async function verificarBanco(nombre, url) {
    try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        return {
            nombre,
            status: respuesta.ok ? "✅ En línea" : `❌ Caído (Código: ${respuesta.status})`,
            icono: `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`
        };
    } catch (error) {
        return {
            nombre,
            status: `❌ Caído (Error: ${error.message})`,
            icono: "https://via.placeholder.com/64" // Icono por defecto en caso de error
        };
    }
}

// Lista de bancos ampliada con el logo oficial actualizado para Banco de Chile
const bancos = [
    { nombre: "Santander", url: "https://banco.santander.cl/personas" },
    { nombre: "Banco de Chile", url: "https://sitiospublicos.bancochile.cl/personas", icono: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_Banco_de_Chile.svg/120px-Logo_Banco_de_Chile.svg.png" },
    { nombre: "BCI", url: "https://www.bci.cl/personas" },
    { nombre: "Banco Estado", url: "https://www.bancoestado.cl" },
    { nombre: "Scotiabank", url: "https://www.scotiabank.cl" },
    { nombre: "Banco Itaú", url: "https://www.itau.cl" },
    { nombre: "Banco Falabella", url: "https://www.bancofalabella.cl" },
    { nombre: "Banco Security", url: "https://www.security.cl" },
];

// Función para obtener el estado de todos los bancos
async function obtenerEstados() {
    return await Promise.all(bancos.map(banco => verificarBanco(banco.nombre, banco.url)));
}

// Configuración del router
const router = new Router();

// Ruta para la página principal (índice)
router.get("/", async (ctx) => {
    let htmlContent = `
    <html>
        <head>
            <title>Estado de los Bancos</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fc;
                    text-align: center;
                }
                h1 {
                    font-size: 2.5rem;
                    margin-top: 50px;
                    color: #3a3a3a;
                }
                .container {
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    gap: 50px;
                }
                .card {
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    width: 250px;
                    transition: transform 0.3s;
                }
                .card:hover {
                    transform: scale(1.05);
                    background-color: #e7f4fb;
                }
                .card img {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                }
                .button {
                    background-color: #4C6B9F;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 12px;
                    text-decoration: none;
                    font-size: 1rem;
                    margin-top: 20px;
                    display: block;
                    width: 100%;
                    text-align: center;
                }
                .button:hover {
                    background-color: #365d80;
                }
            </style>
        </head>
        <body>
            <h1>Bienvenido al Monitor de Bancos</h1>
            <div class="container">
                <div class="card">
                    <h2>Ver Estado</h2>
                    <a href="/estados" class="button">Ver Estados de Bancos</a>
                </div>
                <div class="card">
                    <h2>Reportar Error</h2>
                    <a href="/reportar" class="button">Reportar un Problema</a>
                </div>
            </div>
        </body>
    </html>
    `;
    ctx.response.body = htmlContent;
});

// Ruta para mostrar los estados de los bancos
router.get("/estados", async (ctx) => {
    const estados = await obtenerEstados();
    let htmlContent = `
    <html>
        <head>
            <title>Estado de los Bancos</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fc;
                    text-align: center;
                }
                h1 {
                    color: #3a3a3a;
                    padding: 20px;
                    background-color: #fff;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    font-size: 2rem;
                    border-radius: 8px;
                }
                .container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    padding: 20px;
                    gap: 30px;
                }
                .banco {
                    width: 280px;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    transition: transform 0.3s, background-color 0.3s;
                }
                .banco:hover {
                    transform: scale(1.05);
                    background-color: #e7f4fb;
                }
                .estado {
                    font-weight: bold;
                    font-size: 18px;
                    margin-top: 12px;
                }
                .en-linea {
                    color: #2d9b45;
                }
                .caido {
                    color: #e74c3c;
                }
                img {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 15px;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <h1>Estados de los Bancos</h1>
            <div class="container">
    `;
    estados.forEach((estado) => {
        htmlContent += `
        <div class="banco">
            <img src="${estado.icono}" alt="${estado.nombre} Logo">
            <h2>${estado.nombre}</h2>
            <p class="estado ${estado.status.includes("En línea") ? "en-linea" : "caido"}">${estado.status}</p>
            <a href="/evaluar/${estado.nombre}" class="button">Evaluar Servicio</a>
        </div>
        `;
    });

    htmlContent += `
            </div>
        </body>
    </html>
    `;
    ctx.response.body = htmlContent;
});

// Ruta para la evaluación de los bancos
router.get("/evaluar/:banco", async (ctx) => {
    const { banco } = ctx.params;
    // Aquí puedes implementar la lógica para obtener la evaluación de cada banco.
    let htmlContent = `
    <html>
        <head>
            <title>Evaluación de ${banco}</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fc;
                    text-align: center;
                }
                h1 {
                    color: #3a3a3a;
                    padding: 20px;
                    background-color: #fff;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    font-size: 2rem;
                    border-radius: 8px;
                }
                .evaluation {
                    margin-top: 50px;
                }
                .rating {
                    font-size: 1.5rem;
                    color: #2d9b45;
                }
                .back-button {
                    margin-top: 20px;
                    background-color: #4C6B9F;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-size: 1rem;
                }
                .back-button:hover {
                    background-color: #365d80;
                }
            </style>
        </head>
        <body>
            <h1>Evaluación de la experiencia de usuario en ${banco}</h1>
            <div class="evaluation">
                <h2>Facilidad de Uso: 8/10</h2>
                <h2>Accesibilidad: 7/10</h2>
                <p class="rating">Puntuación Total: 7.5/10</p>
                <a href="/" class="back-button">Volver al Inicio</a>
            </div>
        </body>
    </html>
    `;
    ctx.response.body = htmlContent;
});

// Ruta para reportar errores
router.get("/reportar", async (ctx) => {
    let htmlContent = `
    <html>
        <head>
            <title>Reportar Error</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fc;
                    text-align: center;
                }
                form {
                    margin-top: 30px;
                    padding: 30px;
                    background-color: #fff;
                    border-radius: 15px;
                    box-shadow: 0 0 25px rgba(0, 0, 0, 0.1);
                    width: 45%;
                    margin: 30px auto;
                    text-align: left;
                }
                input, textarea {
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 1px solid #ccc;
                    border-radius: 12px;
                    font-size: 1rem;
                    background-color: #f9f9f9;
                    box-sizing: border-box;
                }
                button {
                    background-color: #4C6B9F;
                    color: white;
                    padding: 15px 25px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #365d80;
                }
            </style>
        </head>
        <body>
            <h1>Reportar un Error</h1>
            <form action="/reportar" method="POST">
                <label for="banco">Nombre del Banco:</label>
                <input type="text" id="banco" name="banco" required>
                
                <label for="url">URL de la página del banco:</label>
                <input type="url" id="url" name="url" required>
                
                <label for="error">Descripción del error:</label>
                <textarea id="error" name="error" rows="4" required></textarea>
                
                <button type="submit">Reportar Error</button>
            </form>
        </body>
    </html>
    `;
    ctx.response.body = htmlContent;
});

// Ruta para recibir los reportes de errores
router.post("/reportar", async (ctx) => {
    const body = await ctx.request.body().value;
    const banco = body.get("banco");
    const url = body.get("url");
    const error = body.get("error");

    console.log(`Reporte de error recibido:
    Banco: ${banco}
    URL: ${url}
    Error: ${error}`);

    ctx.response.body = `
    <html>
        <head>
            <title>Gracias por Reportar</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fc;
                    text-align: center;
                }
                .thank-you {
                    padding: 50px;
                    background-color: #f4f7fb;
                    text-align: center;
                    border-radius: 15px;
                    margin-top: 50px;
                }
                .thank-you h1 {
                    color: #2d9b45;
                    font-size: 3rem;
                    margin-bottom: 20px;
                }
                .thank-you p {
                    font-size: 1.3rem;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="thank-you">
                <h1>Gracias por reportar el error</h1>
                <p>Hemos recibido tu reporte y lo revisaremos lo antes posible.</p>
                <a href="/" class="back-button">Volver al Inicio</a>
            </div>
        </body>
    </html>
    `;
});

// Creación de la aplicación y configuración del servidor
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Servidor corriendo en http://localhost:8000");
await app.listen({ port: 8000 });
