import { Application, Router, Context } from "https://deno.land/x/oak@v10.0.0/mod.ts";

// Función para verificar el estado de los bancos
async function verificarBanco(nombre: string, url: string) {
    try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        return {
            nombre,
            status: respuesta.ok ? "✅ En línea" : `❌ Caído (Código: ${respuesta.status})`,
        };
    } catch (error) {
        return {
            nombre,
            status: `❌ Caído (Error: ${error.message})`,
        };
    }
}

// Función para obtener el estado de todos los bancos
async function obtenerEstados() {
    const bancos = [
        { nombre: "Santander", url: "https://banco.santander.cl/personas" },
        { nombre: "Banco de Chile", url: "https://sitiospublicos.bancochile.cl/personas" },
        { nombre: "BCI", url: "https://www.bci.cl/personas" },
        { nombre: "Banco Estado", url: "https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/home.html#/" },
    ];

    return await Promise.all(bancos.map(banco => verificarBanco(banco.nombre, banco.url)));
}

// Configuración del router
const router = new Router();

// Ruta para mostrar los estados en formato JSON
router.get("/api/bancos", async (ctx) => {
    ctx.response.body = await obtenerEstados();
});

// Ruta para servir la página HTML con los resultados
router.get("/", async (ctx: Context) => {
    const estados = await obtenerEstados();
    let htmlContent = `
    <html>
        <head>
            <title>Estado de los Bancos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                h1 { text-align: center; color: #333; }
                .banco { margin: 20px auto; width: 80%; max-width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                .banco h2 { color: #0077b5; }
                .estado { font-weight: bold; font-size: 16px; }
                .en-linea { color: green; }
                .caido { color: red; }
            </style>
        </head>
        <body>
            <h1>Estado de los Bancos</h1>
            <div>
    `;

    estados.forEach((estado) => {
        htmlContent += `
        <div class="banco">
            <h2>${estado.nombre}</h2>
            <p class="estado ${estado.status.includes("En línea") ? "en-linea" : "caido"}">${estado.status}</p>
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

// Creación de la aplicación y configuración del servidor
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Servidor corriendo en http://localhost:8000");
await app.listen({ port: 8000 });
