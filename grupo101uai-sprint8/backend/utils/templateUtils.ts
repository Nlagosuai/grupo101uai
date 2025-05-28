/**
 * Genera el HTML de la barra de navegación.
 */
export function renderNavbar(): string {
    // Incluye el script de navbar.js
    return `
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">Monitor de Bancos</a>

            <div class="hamburger-menu" aria-label="Toggle menu" role="button" aria-expanded="false">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>

            <div class="nav-links">
                <a href="/">Inicio</a>
                <a href="/status">Estados</a>
                <a href="/leaderboard">Leaderboard</a>
                <a href="/benefits">Beneficios</a>
                <a href="/logout" class="logout-link">Cerrar Sesión</a>
            </div>
        </div>
    </nav>
    <script src="/js/navbar.js" defer></script>
    `;
}

interface PageOptions {
    title: string;
    bodyClass?: string;
    headContent?: string;
    bodyContent: string;
    scripts?: string[]; // Array of script URLs (e.g., /js/main.js)
    styles?: string[]; // Array of CSS URLs (e.g., /css/style.css)
}

/**
 * Genera la estructura HTML base para una página.
 */
export function renderPage({ title, bodyClass = '', headContent = '', bodyContent, scripts = [], styles = [] }: PageOptions): string {
    const defaultStyles = [
        '/css/variables.css',
        '/css/base-styles.css',
        '/css/navbar.css'
    ];
    const allStyles = [...defaultStyles, ...styles];
    const defaultScripts = ['/js/navbar.js']; // Navbar script is almost always needed
    const allScripts = [...defaultScripts, ...scripts];

    return `
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} - Monitor de Bancos</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            ${allStyles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n            ')}
            ${headContent}
        </head>
        <body class="${bodyClass}">
            ${renderNavbar()} 
            ${bodyContent}
            ${allScripts.map(src => `<script src="${src}" defer></script>`).join('\n            ')}
        </body>
    </html>
    `;
}

/**
 * Genera el HTML para la página de error genérica.
 */
export function renderErrorPage(message: string = "Estamos trabajando para solucionarlo. Por favor, intenta nuevamente."): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Monitor de Bancos</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/css/variables.css">
            <link rel="stylesheet" href="/css/error.css">
        </head>
        <body class="error-page">
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h1>Oops! Ha ocurrido un error</h1>
                <p>${message}</p>
                <a href="/" class="button">Volver al inicio</a>
            </div>
        </body>
    </html>
    `;
} 