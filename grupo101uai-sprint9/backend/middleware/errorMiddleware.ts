import { Context, isHttpError, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { renderErrorPage } from '../utils/templateUtils.ts';

/**
 * Middleware global para capturar errores y mostrar una página de error amigable.
 */
export async function errorMiddleware(ctx: Context, next: () => Promise<unknown>) {
    try {
        await next();
    } catch (err) {
        console.error("ERROR EN RUTA:", ctx.request.url.pathname);
        console.error(err);

        let status = Status.InternalServerError;
        let message = "Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.";

        if (isHttpError(err)) {
            status = err.status;
            // Podríamos personalizar mensajes para errores HTTP comunes (404, 403, etc.)
            if (status === Status.NotFound) {
                message = "La página que buscas no existe.";
            } else if (status === Status.Unauthorized || status === Status.Forbidden) {
                message = "No tienes permiso para acceder a esta página.";
            } else {
                message = err.message || message; // Usar mensaje del error HTTP si existe
            }
        } else if (err instanceof Error) {
            // Para errores genéricos, no exponer detalles sensibles
            // message = err.message; // Evitar esto en producción
        }

        ctx.response.status = status;

        // Responder con JSON para rutas API, HTML para las demás
        if (ctx.request.url.pathname.startsWith('/api/')) {
            ctx.response.body = { message };
            ctx.response.type = 'json';
        } else {
            ctx.response.body = renderErrorPage(message); // Usa la función de renderizado
            ctx.response.type = 'html';
        }
    }
} 