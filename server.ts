import { Application, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { loadAndProcessReviews } from "./backend/services/reviewService.ts";
import { errorMiddleware } from "./backend/middleware/errorMiddleware.ts";
import { authMiddleware } from "./backend/middleware/authMiddleware.ts";
import { initializeBenefits } from "./backend/services/benefitsService.ts";
import authRouter from "./backend/routes/authRoutes.ts";
import apiRouter from "./backend/routes/apiRoutes.ts";
import pageRouter from "./backend/routes/pageRoutes.ts";

const app = new Application();
const port = 8082;
// encontrar archivo en carpeta:
// cd C:\Nicolas\Vscode codes\sprint10
// correr archivo en web local:
// deno run --allow-net --allow-write --allow-read --allow-import server.ts
// hacer test de coverage:
// deno test --coverage=./coverage --allow-write
// visualizar coverage:
// deno coverage ./coverage

// 1. Cargar datos iniciales
console.log("Cargando reseñas...");
await loadAndProcessReviews();
console.log("Reseñas cargadas.");

console.log("Cargando beneficios...");
await initializeBenefits();
console.log("Beneficios cargados.");

// 2. Middleware
// Middleware de errores (debe ser uno de los primeros)
app.use(errorMiddleware);

// Middleware para servir archivos estáticos desde frontend/public y frontend/css, frontend/js
app.use(async (ctx, next) => {
    try {
        if (ctx.request.url.pathname === '/favicon.ico') {
            // Graciously ignore favicon requests if it doesn't exist
            // To add a favicon, place `favicon.ico` in the `frontend` root
            return;
        }
        await send(ctx, ctx.request.url.pathname, {
            root: `${Deno.cwd()}/frontend`,
            index: "index.html",
        });
    } catch {
        await next();
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