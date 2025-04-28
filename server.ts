import { Application, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { loadAndProcessReviews } from "./backend/services/reviewService.ts";
import { errorMiddleware } from "./backend/middleware/errorMiddleware.ts";
import { authMiddleware } from "./backend/middleware/authMiddleware.ts";
import authRouter from "./backend/routes/authRoutes.ts";
import apiRouter from "./backend/routes/apiRoutes.ts";
import pageRouter from "./backend/routes/pageRoutes.ts";

const app = new Application();
const port = 8082;
// cd C:\Nicolas\Vscode codes\sprint6
// deno run --allow-net --allow-write --allow-read server.ts


// 1. Cargar datos iniciales
console.log("Cargando reseñas...");
await loadAndProcessReviews();
console.log("Reseñas cargadas.");

// 2. Middleware
// Middleware de errores (debe ser uno de los primeros)
app.use(errorMiddleware);

// Middleware para servir archivos estáticos desde frontend/public y frontend/css, frontend/js
app.use(async (ctx, next) => {
    const filePath = ctx.request.url.pathname;
    // Define las carpetas desde donde servir estáticos
    const staticDirs = ['/css', '/js', '/img']; // Agrega /img si tienes imágenes

    if (staticDirs.some(dir => filePath.startsWith(dir)) || filePath === '/favicon.ico') {
        try {
            // Intenta servir desde la raíz del proyecto (donde están frontend/css, frontend/js)
            await send(ctx, filePath, {
                root: `${Deno.cwd()}/frontend`,
                index: "index.html", // Opcional: si tienes un index.html en public
            });
        } catch (e) {
             // Si no se encuentra, podría ser un 404 manejado por el errorMiddleware
             console.log(`Static file not found: ${filePath}`, e.message);
             await next(); // Deja que otros middlewares/rutas lo manejen
        }
    } else {
        await next(); // No es una ruta de archivo estático conocida, pasa al siguiente middleware
    }
});


// Middleware de autenticación (después de estáticos y errores, antes de rutas protegidas)
app.use(authMiddleware);

// 3. Rutas
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());
app.use(pageRouter.routes());
app.use(pageRouter.allowedMethods());

// 4. Listener de eventos
app.addEventListener("error", (evt) => {
    // Los errores ahora son manejados principalmente por errorMiddleware
    // Pero podemos loggear errores no capturados o específicos aquí si es necesario
    console.error("EVENTO DE ERROR GLOBAL CAPTURADO:", evt.error);
});

app.addEventListener("listen", ({ secure, hostname, port }) => {
    const protocol = secure ? "https" : "http";
    const url = `${protocol}://${hostname ?? "localhost"}:${port}`;
    console.log(`🚀 Servidor 'MonitorBancos' iniciado en ${url}`);
});

// 5. Iniciar servidor
console.log(`Iniciando servidor en el puerto ${port}...`);
await app.listen({ port });