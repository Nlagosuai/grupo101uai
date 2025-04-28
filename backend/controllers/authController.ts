import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { renderPage } from '../utils/templateUtils.ts';

// Credenciales hardcodeadas (solo para demostración)
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin";

/**
 * Muestra la página de inicio de sesión.
 */
export function showLoginPage(ctx: Context) {
    // Si ya está autenticado, redirigir al inicio
    const cookies = ctx.request.headers.get('cookie');
    const isAuthenticated = cookies?.includes('authenticated=true');

    if (isAuthenticated) {
        ctx.response.redirect('/');
        return;
    }

    // Obtener mensaje de error de los query params
    const { error } = helpers.getQuery(ctx, { mergeParams: true });
    let errorMessage = "";
    if (error === 'invalid') {
        errorMessage = "Usuario o contraseña incorrectos.";
    }

    const bodyContent = `
    <div class="login-container">
        <div class="app-logo">
            <h1 class="app-name">Monitor de Bancos</h1>
            <p class="app-description">Inicia sesión para monitorear el estado de los bancos</p>
        </div>

        ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}

        <form class="login-form" action="/api/login" method="post">
            <div class="form-group">
                <label for="username">Usuario</label>
                <input type="text" id="username" name="username" required placeholder="Ingresa tu usuario" class="form-control">
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required placeholder="Ingresa tu contraseña" class="form-control">
            </div>

            <button type="submit" class="button">Iniciar Sesión</button>
        </form>
    </div>
    `;

    // Renderizar la página sin navbar
    ctx.response.body = `
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Iniciar Sesión - Monitor de Bancos</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/css/variables.css">
            <link rel="stylesheet" href="/css/base-styles.css">
            <link rel="stylesheet" href="/css/login.css">
        </head>
        <body class="login-page">
            ${bodyContent}
        </body>
    </html>
    `;
}

/**
 * Procesa el intento de inicio de sesión.
 */
export async function handleLogin(ctx: Context) {
    try {
        const body = ctx.request.body();
        if (body.type !== "form") {
            ctx.response.status = 400;
            ctx.response.body = { message: "Formato de solicitud no válido" };
            return;
        }

        const formData = await body.value;
        const username = formData.get("username");
        const password = formData.get("password");

        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // Establecer cookie de autenticación
            ctx.cookies.set("authenticated", "true", {
                httpOnly: true,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000, // 1 día en milisegundos
                path: '/' // Asegurar que la cookie sea válida para todas las rutas
            });
            console.log('Login successful, setting cookie.'); // Log para depuración
            ctx.response.redirect("/");
        } else {
            console.log('Login failed: Invalid credentials.'); // Log para depuración
            // Redirigir a login con error
            ctx.response.redirect("/login?error=invalid");
        }
    } catch (error) {
        console.error("Error during login process:", error);
        ctx.response.redirect("/login?error=server"); // Redirigir con un error genérico
    }
}

/**
 * Cierra la sesión del usuario eliminando la cookie.
 */
export function handleLogout(ctx: Context) {
    ctx.cookies.delete("authenticated", { path: '/' }); // Asegurar que se borra la cookie correcta
    console.log('Logout successful, deleting cookie.'); // Log para depuración
    ctx.response.redirect("/login");
} 