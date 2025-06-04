import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";

// Rutas públicas que no requieren autenticación
const publicPaths = ['/login', '/api/login']; // Include API login path

/**
 * Middleware para verificar la autenticación del usuario mediante cookies.
 * Redirige a /login si no está autenticado y la ruta no es pública.
 */
export async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
    const path = ctx.request.url.pathname;

    // Permitir acceso a rutas públicas
    if (publicPaths.includes(path)) {
        await next();
        return;
    }

    // Permitir acceso a archivos estáticos (CSS, JS, imágenes, etc.)
    // Asumiendo que los archivos estáticos están en /css, /js, /img, etc.
    // Ajusta las rutas según tu estructura en frontend/public
    if (path.startsWith('/css/') || path.startsWith('/js/') || path.startsWith('/img/') || path.startsWith('/favicon.ico')) {
        await next();
        return;
    }

    // Verificar cookie de autenticación
    const cookies = ctx.request.headers.get('cookie');
    const isAuthenticated = cookies?.includes('authenticated=true');

    if (!isAuthenticated) {
        console.log(`Authentication required for ${path}, redirecting to /login.`);
        // Guardar la URL original para posible redirección post-login (opcional)
        // ctx.cookies.set("redirectUrl", path, { path: '/' });
        ctx.response.redirect('/login');
        return; // Importante: detener la ejecución si no está autenticado
    } else {
        // Usuario autenticado, continuar con la siguiente ruta/middleware
        await next();
    }
} 