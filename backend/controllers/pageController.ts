import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { bancos } from '../config.ts';
import { obtenerTodasReseñas, agregarReseña, calcularEstadisticasReportes, calcularPromediosCalificaciones } from '../services/reviewService.ts';
import { obtenerEstadosBancos, obtenerConfigBanco } from '../services/bankService.ts';
import { renderPage } from '../utils/templateUtils.ts';
import { renderStars, obtenerImagenBanco } from '../utils/renderUtils.ts';
import type { Reseña } from '../types.ts';

/**
 * Muestra la página principal (Home/Estados).
 */
export async function showHomePage(ctx: Context) {
    const estados = await obtenerEstadosBancos();
    const reseñas = obtenerTodasReseñas();
    const promediosCalificaciones = calcularPromediosCalificaciones(bancos);

    const bodyContent = `
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Estado de los Bancos</h1>
            <div class="status-summary">
                <div class="summary-item" id="bancos-activos">
                    Bancos Activos: Calculando...
                </div>
                <div class="summary-item" id="bancos-inactivos">
                    Bancos Inactivos: Calculando...
                </div>
            </div>
        </div>

        <div class="refresh-section">
            <button class="button">
                Actualizar Estados
            </button>
            <p class="last-update" id="ultima-actualizacion">
                Última actualización: --:--:--
            </p>
        </div>

        <div class="banks-grid">
            ${estados.map((estado) => {
                const esEnLinea = estado.estado === "activo";
                const calificacion = promediosCalificaciones[estado.nombre] || { promedio: "0.0", cantidad: 0 };
                const estrellas = renderStars(calificacion.promedio);

                return `
                    <div class="bank-card">
                        <img src="${estado.icono}" alt="${estado.nombre} Logo" class="bank-logo">
                        <h2 class="bank-name">${estado.nombre}</h2>
                        <div class="status-badge ${esEnLinea ? 'status-online' : 'status-offline'}">
                            <i class="status-icon fas ${esEnLinea ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${estado.status}
                        </div>
                        <div class="bank-rating">
                            ${calificacion.promedio}
                            <div class="bank-stars">${estrellas}</div>
                        </div>
                        ${calificacion.cantidad > 0 ?
                            `<div class="reviews-count">Basado en ${calificacion.cantidad} reseña${calificacion.cantidad !== 1 ? 's' : ''}</div>` :
                            '<div class="reviews-count">Sin reseñas</div>'}
                        <a href="/evaluar/${encodeURIComponent(estado.nombre)}" class="button">Evaluar Servicio</a>
                        <a href="/reseñas/${encodeURIComponent(estado.nombre)}" class="button" style="margin-top: 0.5rem;">Ver Reseñas</a>
                    </div>
                `;
            }).join('')}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Inicio",
        bodyContent,
        styles: ['/css/estados.css'], // Specific styles for this page
        scripts: ['/js/estados.js']   // Specific script for this page
    });
}

/**
 * Muestra la página de estadísticas.
 */
export async function showEstadisticasPage(ctx: Context) {
    const reportesPorBanco = calcularEstadisticasReportes(bancos);

    const bodyContent = `
    <main class="main-content">
         <div class="page-header">
            <h1 class="page-title">Reportes Comunes por Banco</h1>
            <p>Análisis de las categorías más frecuentes en las reseñas.</p>
        </div>
        <div class="bank-reports">
            ${bancos.map(banco => {
                const reporteInfo = reportesPorBanco[banco.nombre] || { reporteComun: "Sin datos", conteo: 0, totalReseñas: 0 };
                return `
                    <div class="bank-report-card">
                        <img src="${banco.icono}" alt="${banco.nombre}" class="bank-logo">
                        <h2 class="bank-name">${banco.nombre}</h2>
                        <div class="report-common ${reporteInfo.conteo === 0 ? 'no-reports' : ''}">
                            <strong>Reporte más común:</strong> ${reporteInfo.reporteComun}
                        </div>
                        ${reporteInfo.conteo > 0 ? `
                            <div class="report-stats">
                                <span>Ocurrencias: ${reporteInfo.conteo}</span>
                                <span>Total reseñas: ${reporteInfo.totalReseñas}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Estadísticas",
        bodyContent,
        styles: ['/css/estadisticas.css']
    });
}

/**
 * Muestra la página general de reseñas (listando bancos).
 */
export function showReseñasPage(ctx: Context) {
    const reseñas = obtenerTodasReseñas();
    const reseñasPorBanco: Record<string, { reseñas: Reseña[], promedio: string, cantidad: number }> = {};

    // Inicializar y agrupar reseñas
    bancos.forEach(banco => {
        reseñasPorBanco[banco.nombre] = { reseñas: [], promedio: "0.0", cantidad: 0 };
    });
    reseñas.forEach(reseña => {
        if (reseñasPorBanco[reseña.banco]) {
            reseñasPorBanco[reseña.banco].reseñas.push(reseña);
        }
    });

    // Calcular promedios
    Object.keys(reseñasPorBanco).forEach(nombreBanco => {
        const bancoData = reseñasPorBanco[nombreBanco];
        if (bancoData.reseñas.length > 0) {
            const total = bancoData.reseñas.reduce((sum, r) => sum + parseInt(r.calificación, 10), 0);
            bancoData.promedio = (total / bancoData.reseñas.length).toFixed(1);
            bancoData.cantidad = bancoData.reseñas.length;
        }
    });

    const totalReseñasGeneral = reseñas.length;

    const bodyContent = `
    <main class="main-content">
        <a href="/estados" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="reviews-header">
            <h1>Reseñas de Usuarios</h1>
            <p>Experiencias compartidas por nuestros usuarios</p>
            ${totalReseñasGeneral > 0 ? `<p>Total de reseñas: ${totalReseñasGeneral}</p>` : ''}
        </div>

        ${totalReseñasGeneral === 0 ? `
            <div class="no-reviews card">
                <p>Aún no hay reseñas disponibles.</p>
                <a href="/estados" class="button" style="margin-top: 1rem;">Evaluar un Banco</a>
            </div>
        ` : ''}

        ${bancos.map(banco => {
            const bancoDatos = reseñasPorBanco[banco.nombre];
            // Solo mostrar bancos con reseñas en esta vista general
            if (bancoDatos.cantidad === 0) return '';
            const estrellas = renderStars(bancoDatos.promedio);

            return `
            <div class="bank-section">
                <div class="bank-header card">
                    <img src="${banco.icono}" alt="${banco.nombre} Logo" class="bank-logo">
                    <div class="bank-info">
                        <div class="bank-name">${banco.nombre}</div>
                        <div class="bank-rating">
                            ${bancoDatos.promedio}
                            <div class="bank-stars">${estrellas}</div>
                        </div>
                    </div>
                    <div class="bank-stats">
                        <span class="reviews-count">${bancoDatos.cantidad} reseña${bancoDatos.cantidad !== 1 ? 's' : ''}</span>
                        <a href="/evaluar/${encodeURIComponent(banco.nombre)}" class="button">Evaluar</a>
                        <a href="/reseñas/${encodeURIComponent(banco.nombre)}" class="button">Ver Todas</a>
                    </div>
                </div>

                <div class="reviews-grid">
                    ${bancoDatos.reseñas.slice(0, 3).map(reseña => {
                        const estrellasReseña = renderStars(reseña.calificación);
                        return `
                        <div class="review-card card">
                            <div class="review-date">${reseña.fecha}</div>
                            <div class="review-rating">${estrellasReseña}</div>
                            <div class="review-comment">
                                <p>${reseña.comentario}</p> 
                            </div>
                            <div class="review-categories">
                                ${reseña.categorías.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                            </div>
                        </div>
                        `
                    }).join('')}
                </div>
                ${bancoDatos.reseñas.length > 3 ? `
                    <div class="view-all">
                        <a href="/reseñas/${encodeURIComponent(banco.nombre)}" class="button">Ver todas las ${bancoDatos.cantidad} reseñas de ${banco.nombre}</a>
                    </div>
                ` : ''}
            </div>
            `;
        }).join('')}
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Reseñas de Usuarios",
        bodyContent,
        styles: ['/css/reseñas.css']
    });
}

/**
 * Muestra la página de reseñas para un banco específico.
 */
export function showReseñasBancoPage(ctx: Context) {
    const { banco: bancoNombreEncoded } = helpers.getQuery(ctx, { mergeParams: true });
    const bancoNombre = decodeURIComponent(bancoNombreEncoded || '');

    const bancoConfig = obtenerConfigBanco(bancoNombre);
    if (!bancoConfig) {
        ctx.response.status = 404;
        ctx.response.body = renderPage({ title: "Error 404", bodyContent: "<main class='main-content'><h1>Banco no encontrado</h1></main>" });
        return;
    }

    const todasReseñas = obtenerTodasReseñas();
    const reseñasBanco = todasReseñas.filter(reseña => reseña.banco === bancoNombre);
    const { promedio, cantidad } = calcularPromediosCalificaciones([bancoConfig])[bancoNombre] || { promedio: "0.0", cantidad: 0 };
    const estrellasPromedio = renderStars(promedio);

    const bodyContent = `
    <main class="main-content">
        <a href="/reseñas" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Todas las Reseñas
        </a>

        <div class="bank-header card">
            <img src="${bancoConfig.icono}" alt="${bancoConfig.nombre} Logo" class="bank-logo">
            <div class="bank-info">
                <h1 class="bank-name">Reseñas de ${bancoConfig.nombre}</h1>
                <div class="bank-rating">
                    ${promedio}
                    <div class="bank-stars">${estrellasPromedio}</div>
                </div>
            </div>
            <div class="bank-stats">
                <span class="reviews-count">${cantidad} reseña${cantidad !== 1 ? 's' : ''}</span>
                <a href="/evaluar/${encodeURIComponent(bancoConfig.nombre)}" class="button">Evaluar Servicio</a>
            </div>
        </div>

        <div class="reviews-grid">
            ${reseñasBanco.length > 0 ? reseñasBanco.map(reseña => {
                const estrellasReseña = renderStars(reseña.calificación);
                return `
                <div class="review-card card">
                    <div class="review-date">${reseña.fecha}</div>
                    <div class="review-rating">${estrellasReseña}</div>
                    <div class="review-comment">
                         <p>${reseña.comentario}</p> 
                    </div>
                    <div class="review-categories">
                        ${reseña.categorías.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                    </div>
                </div>
            `}).join('') : `
                <div class="no-reviews card">
                    <p>Aún no hay reseñas para ${bancoConfig.nombre}.</p>
                    <a href="/evaluar/${encodeURIComponent(bancoConfig.nombre)}" class="button" style="margin-top: 1rem;">Sé el primero en evaluar</a>
                </div>
            `}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: `Reseñas de ${bancoConfig.nombre}`,
        bodyContent,
        styles: ['/css/reseñas-banco.css']
    });
}

/**
 * Muestra el formulario para evaluar un banco.
 */
export function showEvaluarPage(ctx: Context) {
    const { banco: bancoNombreEncoded } = helpers.getQuery(ctx, { mergeParams: true });
    const bancoNombre = decodeURIComponent(bancoNombreEncoded || '');

    const bancoConfig = obtenerConfigBanco(bancoNombre);
    if (!bancoConfig) {
        ctx.response.status = 404;
        ctx.response.body = renderPage({ title: "Error 404", bodyContent: "<main class='main-content'><h1>Banco no encontrado</h1></main>" });
        return;
    }

    const imagenBanco = bancoConfig.icono;

    const bodyContent = `
    <main class="main-content">
        <a href="/estados" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="evaluation-card card">
            <div class="bank-header">
                <img src="${imagenBanco}" alt="${bancoNombre} Logo" class="bank-logo">
                <div class="bank-info">
                    <h1>Evaluar ${bancoNombre}</h1>
                    <p>Comparte tu experiencia con el servicio</p>
                </div>
            </div>

            <form class="evaluation-form" id="evaluationForm" action="/evaluar/${encodeURIComponent(bancoNombre)}" method="POST">
                <div class="form-group">
                    <label>¿Cómo calificarías tu experiencia?</label>
                    <div class="star-rating">
                        <div class="stars">
                            ${[1, 2, 3, 4, 5].map(n => `
                                <input type="radio" name="calificación" value="${n}" id="rating${n}" required hidden>
                                <label for="rating${n}" class="star" data-rating="${n}">
                                    <i class="fas fa-star"></i>
                                </label>
                            `).join('')}
                        </div>
                        <div class="rating-text">Selecciona una calificación</div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Categorías (opcional)</label>
                    <div class="category-tags">
                        ${[
                            { value: 'acceso', text: 'Problemas de Acceso' },
                            { value: 'lentitud', text: 'Lentitud' },
                            { value: 'error', text: 'Error en Transacción' },
                            { value: 'seguridad', text: 'Seguridad' },
                            { value: 'otro', text: 'Otro' }
                        ].map(cat => `
                            <input type="checkbox" name="categorías" value="${cat.value}" id="cat${cat.value}" hidden>
                            <label for="cat${cat.value}" class="category-tag">${cat.text}</label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label for="comentario">Describe tu experiencia</label>
                    <textarea
                        id="comentario"
                        name="comentario"
                        class="form-control"
                        placeholder="Cuéntanos más sobre tu experiencia con el servicio..."
                        required
                    ></textarea>
                </div>

                <div class="buttons-container">
                    <button type="submit" class="button">Enviar Evaluación</button>
                    <a href="/estados" class="button button-secondary">Cancelar</a>
                </div>
            </form>
            <div class="success-message" id="successMessage" style="display: none;">
                ¡Evaluación enviada con éxito!
            </div>
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: `Evaluar ${bancoNombre}`,
        bodyContent,
        styles: ['/css/evaluar.css'],
        scripts: ['/js/evaluar.js']
    });
}

/**
 * Muestra la página para reportar un error.
 */
export function showReportarPage(ctx: Context) {
    const bodyContent = `
    <main class="main-content">
         <a href="/estados" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="report-card card">
            <div class="report-header">
                <h1>Reportar un Error</h1>
                <p>Ayúdanos a mejorar el servicio reportando los problemas que encuentres.</p>
            </div>

            <form class="report-form" id="reportForm">
                <div class="form-group">
                    <label for="banco">Selecciona el Banco</label>
                    <select id="banco" name="banco" class="form-control" required>
                        <option value="">Selecciona un banco...</option>
                        ${bancos.map(b => `<option value="${b.nombre}">${b.nombre}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Prioridad del Error</label>
                    <input type="hidden" id="prioridad" name="prioridad" value="">
                    <div class="priority-selector">
                        <div class="priority-option" data-priority="baja">Baja</div>
                        <div class="priority-option" data-priority="media">Media</div>
                        <div class="priority-option" data-priority="alta">Alta</div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="tipo">Tipo de Error</label>
                    <select id="tipo" name="tipo" class="form-control" required>
                        <option value="">Selecciona el tipo de error...</option>
                        <option value="acceso">Problemas de Acceso</option>
                        <option value="lentitud">Lentitud en el Servicio</option>
                        <option value="transaccion">Error en Transacción</option>
                        <option value="seguridad">Problema de Seguridad</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="descripcion">Descripción del Error</label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        class="form-control"
                        placeholder="Describe detalladamente el error que has encontrado..."
                        required
                    ></textarea>
                </div>

                <div class="buttons-container">
                    <button type="submit" class="button">Enviar Reporte</button>
                    <a href="/estados" class="button button-secondary">Cancelar</a>
                </div>

                <div class="success-message" id="successMessage">
                    ¡Gracias por tu reporte! Lo revisaremos lo antes posible.
                </div>
            </form>
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Reportar Error",
        bodyContent,
        styles: ['/css/reportar.css'],
        scripts: ['/js/reportar.js']
    });
}

/**
 * Procesa el envío del formulario de evaluación.
 */
export async function handleEvaluarSubmit(ctx: Context) {
    try {
        const { banco: bancoNombreEncoded } = helpers.getQuery(ctx, { mergeParams: true });
        const bancoNombre = decodeURIComponent(bancoNombreEncoded || '');

        if (!obtenerConfigBanco(bancoNombre)) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Banco no encontrado" };
            return;
        }

        const body = ctx.request.body();
        if (body.type !== "form") {
            ctx.response.status = 400;
            ctx.response.body = { message: "Formato de solicitud no válido" };
            return;
        }
        const formData = await body.value;
        const calificación = formData.get("calificación");
        const comentario = formData.get("comentario");
        const categorías = formData.getAll("categorías"); // Puede ser un array vacío

        // Validar datos básicos
        if (!calificación || !comentario) {
            ctx.response.status = 400;
            ctx.response.body = { message: "La calificación y el comentario son requeridos" };
            return;
        }

        const nuevaReseña: Omit<Reseña, 'fecha'> = {
            banco: bancoNombre,
            calificación: calificación.toString(),
            comentario: comentario.toString(),
            categorías: categorías.length > 0 ? categorías.map(String) : ['otro'] // Asegurar 'otro' si no se seleccionan categorías
        };

        await agregarReseña(nuevaReseña);

        // Mostrar página de agradecimiento con redirección
        const bodyContent = `
        <div class="success-card">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1 class="success-title">¡Gracias por tu evaluación!</h1>
            <p class="success-message">Hemos registrado correctamente tu evaluación del servicio de ${bancoNombre}. Tu opinión es muy importante.</p>
            <p class="redirect-text">Serás redirigido a la página principal en <span class="countdown">3</span> segundos...</p>
        </div>
        `;

        const headContent = `<meta http-equiv="refresh" content="3;url=/">`;

        ctx.response.status = 200;
        // Renderizar página de agradecimiento sin navbar
         ctx.response.body = `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Evaluación Enviada - Monitor de Bancos</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <link rel="stylesheet" href="/css/variables.css">
                <link rel="stylesheet" href="/css/agradecimiento.css">
                ${headContent}
            </head>
            <body class="agradecimiento-page">
                ${bodyContent}
                <script src="/js/agradecimiento.js" defer></script>
            </body>
        </html>
        `;

    } catch (error) {
        console.error("Error al procesar la evaluación:", error);
        ctx.response.status = 500;
        // Podríamos mostrar una página de error específica
        ctx.response.body = { message: "Error interno al procesar la evaluación." };
    }
} 