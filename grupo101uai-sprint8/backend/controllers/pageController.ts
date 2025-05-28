import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { banks } from '../config.ts';
import { getAllReviews, addReview, calculateReportStatistics, calculateAverageRatings } from '../services/reviewService.ts';
import { getBankStatuses, getBankConfig } from '../services/bankService.ts';
import { renderPage } from '../utils/templateUtils.ts';
import { renderStars, getBankImage } from '../utils/renderUtils.ts';
import type { Review, BankInfo, BankConfig } from '../types.ts';

/**
 * Muestra la página principal (Home/Estados).
 */
export async function showHomePage(ctx: Context) {
    const bankStatuses = await getBankStatuses();
    const averageRatings = calculateAverageRatings(banks);
    const reportsByBank = calculateReportStatistics(banks);
    const reviews = getAllReviews();
    
    // Organizar reseñas por banco para la sección de reseñas
    const reviewsByBank: Record<string, { reviews: Review[], average: string, count: number }> = {};
    
    banks.forEach(bank => {
        reviewsByBank[bank.name] = { reviews: [], average: "0.0", count: 0 };
    });
    
    reviews.forEach(review => {
        if (reviewsByBank[review.bank]) {
            reviewsByBank[review.bank].reviews.push(review);
        }
    });
    
    Object.keys(reviewsByBank).forEach(bankName => {
        const bankData = reviewsByBank[bankName];
        if (bankData.reviews.length > 0) {
            const total = bankData.reviews.reduce((sum, r) => sum + parseInt(r.rating, 10), 0);
            bankData.average = (total / bankData.reviews.length).toFixed(1);
            bankData.count = bankData.reviews.length;
        }
    });

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
            ${bankStatuses.map((status) => {
                const isOnline = status.state === "active";
                const ratingInfo = averageRatings[status.name] || { average: "0.0", count: 0 };
                const stars = renderStars(ratingInfo.average);
                const reportInfo = reportsByBank[status.name] || { commonReport: "Sin datos", count: 0, totalReviews: 0 };
                const bankReviews = reviewsByBank[status.name]?.reviews || [];

                return `
                    <div class="bank-card" id="bank-${encodeURIComponent(status.name)}">
                        <div class="bank-header">
                        <img src="${status.icon}" alt="${status.name} Logo" class="bank-logo">
                        <h2 class="bank-name">${status.name}</h2>
                        <div class="status-badge ${isOnline ? 'status-online' : 'status-offline'}">
                            <i class="status-icon fas ${isOnline ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${status.statusText}
                        </div>
                        </div>

                        <div class="bank-tabs">
                            <button class="tab-btn active" data-tab="info-${encodeURIComponent(status.name)}">Información</button>
                            <button class="tab-btn" data-tab="stats-${encodeURIComponent(status.name)}">Estadísticas</button>
                            <button class="tab-btn" data-tab="reviews-${encodeURIComponent(status.name)}">Reseñas</button>
                        </div>

                        <div class="tab-content active" id="info-${encodeURIComponent(status.name)}">
                        <div class="bank-rating">
                            ${ratingInfo.average}
                            <div class="bank-stars">${stars}</div>
                        </div>
                        ${ratingInfo.count > 0 ?
                            `<div class="reviews-count">Basado en ${ratingInfo.count} reseña${ratingInfo.count !== 1 ? 's' : ''}</div>` :
                            '<div class="reviews-count">Sin reseñas</div>'}
                        <a href="/evaluate/${encodeURIComponent(status.name)}" class="button">Evaluar Servicio</a>
                            <div class="card-last-update">Estado actualizado</div>
                        </div>

                        <div class="tab-content" id="stats-${encodeURIComponent(status.name)}">
                            <div class="bank-stats-content">
                                <h3>Reportes Comunes</h3>
                                <div class="report-common ${reportInfo.count === 0 ? 'no-reports' : ''}">
                                    <strong>Reporte más común:</strong> ${reportInfo.commonReport}
                                </div>
                                ${reportInfo.count > 0 ? `
                                    <div class="report-stats">
                                        <span>Ocurrencias: ${reportInfo.count}</span>
                                        <span>Total reseñas: ${reportInfo.totalReviews}</span>
                                    </div>
                                ` : '<div class="no-stats">No hay estadísticas disponibles</div>'}
                            </div>
                        </div>

                        <div class="tab-content" id="reviews-${encodeURIComponent(status.name)}">
                            <div class="bank-reviews-content">
                                ${bankReviews.length > 0 ? `
                                    <div class="reviews-mini-grid">
                                        ${bankReviews.slice(0, 2).map(review => {
                                            const reviewStars = renderStars(review.rating);
                                            return `
                                            <div class="review-mini-card">
                                                <div class="review-date">${review.date}</div>
                                                <div class="review-rating">${reviewStars}</div>
                                                <div class="review-comment">
                                                    <p>${review.comment.length > 100 ? review.comment.substring(0, 100) + '...' : review.comment}</p> 
                                                </div>
                                                <div class="review-categories">
                                                    ${review.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                                                </div>
                                            </div>
                                            `
                                        }).join('')}
                                    </div>
                                    ${bankReviews.length > 2 ? `
                                        <a href="/reviews/${encodeURIComponent(status.name)}" class="button view-all-btn">
                                            Ver todas las ${bankReviews.length} reseñas
                                        </a>
                                    ` : ''}
                                ` : `
                                    <div class="no-reviews-message">
                                        <p>Aún no hay reseñas para este banco.</p>
                                        <a href="/evaluate/${encodeURIComponent(status.name)}" class="button">Sé el primero en evaluar</a>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Monitor de Bancos",
        bodyContent,
        styles: ['/css/status.css', '/css/bank-card.css'],
        scripts: ['/js/status.js', '/js/bank-tabs.js']
    });
}

/**
 * Muestra la página de estadísticas.
 */
export async function showStatisticsPage(ctx: Context) {
    const reportsByBank = calculateReportStatistics(banks);

    const bodyContent = `
    <main class="main-content">
         <div class="page-header">
            <h1 class="page-title">Reportes Comunes por Banco</h1>
            <p>Análisis de las categorías más frecuentes en las reseñas.</p>
        </div>
        <div class="bank-reports">
            ${banks.map(bank => {
                const reportInfo = reportsByBank[bank.name] || { commonReport: "Sin datos", count: 0, totalReviews: 0 };
                return `
                    <div class="bank-report-card">
                        <img src="${bank.icon}" alt="${bank.name}" class="bank-logo">
                        <h2 class="bank-name">${bank.name}</h2>
                        <div class="report-common ${reportInfo.count === 0 ? 'no-reports' : ''}">
                            <strong>Reporte más común:</strong> ${reportInfo.commonReport}
                        </div>
                        ${reportInfo.count > 0 ? `
                            <div class="report-stats">
                                <span>Ocurrencias: ${reportInfo.count}</span>
                                <span>Total reseñas: ${reportInfo.totalReviews}</span>
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
        styles: ['/css/statistics.css']
    });
}

/**
 * Muestra la página general de reseñas (listando bancos).
 */
export function showReviewsPage(ctx: Context) {
    const reviews = getAllReviews();
    const reviewsByBank: Record<string, { reviews: Review[], average: string, count: number }> = {};

    banks.forEach(bank => {
        reviewsByBank[bank.name] = { reviews: [], average: "0.0", count: 0 };
    });
    reviews.forEach(review => {
        if (reviewsByBank[review.bank]) {
            reviewsByBank[review.bank].reviews.push(review);
        }
    });

    Object.keys(reviewsByBank).forEach(bankName => {
        const bankData = reviewsByBank[bankName];
        if (bankData.reviews.length > 0) {
            const total = bankData.reviews.reduce((sum, r) => sum + parseInt(r.rating, 10), 0);
            bankData.average = (total / bankData.reviews.length).toFixed(1);
            bankData.count = bankData.reviews.length;
        }
    });

    const totalReviewsOverall = reviews.length;

    const bodyContent = `
    <main class="main-content">
        <a href="/status" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="reviews-header">
            <h1>Reseñas de Usuarios</h1>
            <p>Experiencias compartidas por nuestros usuarios</p>
            ${totalReviewsOverall > 0 ? `<p>Total de reseñas: ${totalReviewsOverall}</p>` : ''}
        </div>

        ${totalReviewsOverall === 0 ? `
            <div class="no-reviews card">
                <p>Aún no hay reseñas disponibles.</p>
                <a href="/estados" class="button" style="margin-top: 1rem;">Evaluar un Banco</a>
            </div>
        ` : ''}

        ${banks.map(bank => {
            const bankData = reviewsByBank[bank.name];
            if (bankData.count === 0) return '';
            const stars = renderStars(bankData.average);

            return `
            <div class="bank-section">
                <div class="bank-header card">
                    <img src="${bank.icon}" alt="${bank.name} Logo" class="bank-logo">
                    <div class="bank-info">
                        <div class="bank-name">${bank.name}</div>
                        <div class="bank-rating">
                            ${bankData.average}
                            <div class="bank-stars">${stars}</div>
                        </div>
                    </div>
                    <div class="bank-stats">
                        <span class="reviews-count">${bankData.count} reseña${bankData.count !== 1 ? 's' : ''}</span>
                        <a href="/evaluate/${encodeURIComponent(bank.name)}" class="button">Evaluar</a>
                        <a href="/reviews/${encodeURIComponent(bank.name)}" class="button">Ver Todas</a>
                    </div>
                </div>

                <div class="reviews-grid">
                    ${bankData.reviews.slice(0, 3).map(review => {
                        const reviewStars = renderStars(review.rating);
                        return `
                        <div class="review-card card">
                            <div class="review-date">${review.date}</div>
                            <div class="review-rating">${reviewStars}</div>
                            <div class="review-comment">
                                <p>${review.comment}</p> 
                            </div>
                            <div class="review-categories">
                                ${review.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                            </div>
                        </div>
                        `
                    }).join('')}
                </div>
                ${bankData.reviews.length > 3 ? `
                    <div class="view-all">
                        <a href="/reviews/${encodeURIComponent(bank.name)}" class="button">Ver todas las ${bankData.count} reseñas de ${bank.name}</a>
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
        styles: ['/css/reviews.css']
    });
}

/**
 * Muestra la página de reseñas para un banco específico.
 */
export function showBankReviewsPage(ctx: Context) {
    const { banco: encodedBankName } = helpers.getQuery(ctx, { mergeParams: true });
    const bankName = decodeURIComponent(encodedBankName || '');

    const bankConfig = getBankConfig(bankName);
    if (!bankConfig) {
        ctx.response.status = 404;
        ctx.response.body = renderPage({ title: "Error 404", bodyContent: "<main class='main-content'><h1>Banco no encontrado</h1></main>" });
        return;
    }

    const allReviews = getAllReviews();
    const bankReviews = allReviews.filter(review => review.bank === bankName);
    const { average, count } = calculateAverageRatings([bankConfig])[bankName] || { average: "0.0", count: 0 };
    const averageStars = renderStars(average);

    const bodyContent = `
    <main class="main-content">
        <a href="/reviews" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Todas las Reseñas
        </a>

        <div class="bank-header card">
            <img src="${bankConfig.icon}" alt="${bankConfig.name} Logo" class="bank-logo">
            <div class="bank-info">
                <h1 class="bank-name">Reseñas de ${bankConfig.name}</h1>
                <div class="bank-rating">
                    ${average}
                    <div class="bank-stars">${averageStars}</div>
                </div>
            </div>
            <div class="bank-stats">
                <span class="reviews-count">${count} reseña${count !== 1 ? 's' : ''}</span>
                <a href="/evaluate/${encodeURIComponent(bankConfig.name)}" class="button">Evaluar Servicio</a>
            </div>
        </div>

        <div class="reviews-grid">
            ${count === 0 ? `
                <div class="no-reviews card">
                    <p>Aún no hay reseñas para ${bankName}. ¡Sé el primero!</p>
                    <a href="/evaluate/${encodeURIComponent(bankConfig.name)}" class="button" style="margin-top: 1rem;">Sé el primero en evaluar</a>
                </div>
            ` : bankReviews.map(review => {
                const reviewStars = renderStars(review.rating);
                return `
                <div class="review-card card">
                    <div class="review-date">${review.date}</div>
                    <div class="review-rating">${reviewStars}</div>
                    <div class="review-comment">
                         <p>${review.comment}</p> 
                    </div>
                    <div class="review-categories">
                        ${review.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                    </div>
                </div>
            `}).join('')}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: `Reseñas de ${bankName}`,
        bodyContent,
        styles: ['/css/bank-reviews.css']
    });
}

/**
 * Muestra la página para evaluar un banco específico.
 */
export function showEvaluatePage(ctx: Context) {
    const { banco: encodedBankName } = helpers.getQuery(ctx, { mergeParams: true });
    const bankName = decodeURIComponent(encodedBankName || '');

    const bankConfig = getBankConfig(bankName);
    if (!bankConfig) {
        ctx.response.status = 404;
        ctx.response.body = renderPage({ title: "Error 404", bodyContent: "<main class='main-content'><h1>Banco no encontrado</h1></main>" });
        return;
    }

    const bankImage = bankConfig.icon;

    const bodyContent = `
    <main class="main-content">
        <a href="/status" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="evaluation-card card">
            <div class="bank-header">
                <img src="${bankImage}" alt="${bankName} Logo" class="bank-logo">
                <div class="bank-info">
                    <h1>Evaluar ${bankName}</h1>
                    <p>Comparte tu experiencia con el servicio</p>
                </div>
            </div>

            <form class="evaluation-form" id="evaluationForm" action="/evaluate/${encodeURIComponent(bankName)}" method="POST">
                <div class="form-group">
                    <label>¿Cómo calificarías tu experiencia?</label>
                    <div class="star-rating">
                        <div class="stars">
                            ${[1, 2, 3, 4, 5].map(n => `
                                <input type="radio" name="calificacion" value="${n}" id="rating${n}" required hidden>
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
                            <input type="checkbox" name="categorias" value="${cat.value}" id="cat${cat.value}" hidden>
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
        title: `Evaluar ${bankName}`,
        bodyContent,
        styles: ['/css/evaluate.css'],
        scripts: ['/js/evaluate.js']
    });
}

/**
 * Muestra la página para reportar un error.
 */
export function showReportPage(ctx: Context) {
    const bodyContent = `
    <main class="main-content">
         <a href="/status" class="back-link">
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
                        ${banks.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
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
        styles: ['/css/report.css'],
        scripts: ['/js/report.js']
    });
}

/**
 * Procesa el envío del formulario de evaluación.
 */
export async function handleEvaluateSubmit(ctx: Context) {
    try {
        const { banco: encodedBankName } = helpers.getQuery(ctx, { mergeParams: true });
        const bankName = decodeURIComponent(encodedBankName || '');

        if (!getBankConfig(bankName)) {
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
        const ratingValue = formData.get("calificacion");
        const commentValue = formData.get("comentario");
        const categoryValues = formData.getAll("categorias");

        if (!ratingValue || !commentValue) {
            ctx.response.status = 400;
            ctx.response.body = { message: "La calificación y el comentario son requeridos" };
            return;
        }

        const reviewData = {
            banco: bankName,
            calificación: ratingValue,
            comentario: commentValue,
            categorías: categoryValues
        };

        await addReview(reviewData);

        ctx.response.redirect(`/thank-you?banco=${encodeURIComponent(bankName)}`);

    } catch (error) {
        console.error("Error processing evaluation submission:", error);
        ctx.response.status = 500;
        ctx.response.body = renderPage({
             title: "Error",
             bodyContent: `<main class='main-content'><h1>Error al procesar la evaluación</h1><p>${error.message}</p></main>`,
             styles: ['/css/error.css']
         });
    }
}

/**
 * Muestra la página de agradecimiento.
 */
export function showThankYouPage(ctx: Context) {
    const { banco: encodedBankName } = helpers.getQuery(ctx, { mergeParams: true });
    const bankName = decodeURIComponent(encodedBankName || 'este banco');

    const bodyContent = `
    <main class="main-content success-card">
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="success-title">¡Gracias por tu evaluación!</h1>
        <p class="success-message">
            Tu opinión sobre ${bankName} ha sido registrada. Ayuda a otros usuarios a tomar decisiones informadas.
        </p>
        <a href="/status" class="button">Volver a Estados</a>
        <p class="redirect-text">
            Serás redirigido automáticamente en <span id="countdown" class="countdown">5</span> segundos...
        </p>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Evaluación Enviada",
        bodyContent,
        styles: ['/css/thank-you.css'],
        scripts: ['/js/thank-you.js']
    });
}

/**
 * Muestra la página del leaderboard.
 */
export function showLeaderboardPage(ctx: Context) {
    // Los datos del leaderboard se obtendrán mediante una solicitud fetch desde el frontend.
    // Aquí solo servimos la estructura HTML básica.
    const bodyContent = `
    <main class="main-content" id="leaderboard-container">
        <section id="leaderboard-header">
            <h1>Ranking de Bancos</h1>
            <p class="leaderboard-description">
                Comparativa de bancos según las calificaciones de los usuarios en diferentes categorías.
            </p>
        </section>
        
        <section id="leaderboard-controls">
            <div class="controls-container card">
                <h3>Filtrar por Categoría</h3>
                <div class="category-selector" id="category-selector">
                    <!-- Las categorías se generarán dinámicamente desde JavaScript -->
                    <button class="category-btn active" data-category="overall">General</button>
                    <button class="category-btn" data-category="accessibility">Accesibilidad</button>
                    <button class="category-btn" data-category="usability">Usabilidad</button>
                    <button class="category-btn" data-category="performance">Rendimiento</button>
                    <button class="category-btn" data-category="support">Soporte</button>
                    <button class="category-btn" data-category="security">Seguridad</button>
                </div>
            </div>
        </section>
        
        <section id="leaderboard-section">
            <div class="leaderboard-table-container card">
                <h2>Ranking por <span id="current-category">Calificación General</span></h2>
                <table id="leaderboard-table" class="leaderboard-table">
                <thead>
                    <tr>
                            <th class="rank-col">Posición</th>
                            <th class="bank-col">Banco</th>
                            <th class="score-col">Calificación</th>
                            <th class="detail-col">Detalles</th>
                    </tr>
                </thead>
                <tbody>
                        <tr><td colspan="4" class="loading-row">Cargando leaderboard...</td></tr>
                </tbody>
            </table>
            </div>
        </section>
        
        <section id="detailed-scores" class="detailed-scores hidden">
            <div class="detailed-scores-container card">
                <div class="detailed-scores-header">
                    <h3>Puntuaciones Detalladas: <span id="detailed-bank-name">Banco</span></h3>
                    <button id="close-details" class="close-btn">×</button>
                </div>
                <div class="scores-grid" id="scores-grid">
                    <!-- Aquí se mostrarán las puntuaciones detalladas -->
                </div>
            </div>
        </section>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Leaderboard de Bancos",
        bodyContent,
        styles: ['/css/leaderboard.css'],
        scripts: ['/js/leaderboard.js']
    });
}

/**
 * Muestra la página de beneficios mensuales.
 */
export function showBenefitsPage(ctx: Context) {
    const bodyContent = `
    <main class="main-content" id="benefits-page-container">
        <section id="benefits-header">
            <h1>Beneficios Bancarios - Mayo 2024</h1>
            <p class="benefits-description">
                Descubre todos los beneficios que ofrecen los bancos este mes. Aprovecha descuentos y promociones exclusivas.
            </p>
        </section>
        
        <section id="benefits-filter">
            <div class="filter-container card">
                <h3>Filtrar Beneficios</h3>
                <div class="filter-controls">
                    <div class="filter-group">
                        <label for="bank-filter">Banco:</label>
                        <select id="bank-filter">
                            <option value="all">Todos los bancos</option>
                            ${banks.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="category-filter">Categoría:</label>
                        <select id="category-filter">
                            <option value="all">Todas las categorías</option>
                            <option value="Comida" class="option-Comida">🍽️ Comida</option>
                            <option value="Viajes" class="option-Viajes">✈️ Viajes</option>
                            <option value="Entretenimiento" class="option-Entretenimiento">🎭 Entretenimiento</option>
                            <option value="Compras" class="option-Compras">🛍️ Compras</option>
                            <option value="Transporte" class="option-Transporte">🚗 Transporte</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="day-filter">Día:</label>
                        <select id="day-filter">
                            <option value="all">Todos los días</option>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Área donde se mostrarán los beneficios -->
        <section id="benefits-display">
            <div id="benefits-list" class="benefits-container">
                <p class="loading-message">Cargando beneficios...</p>
            </div>
        </section>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Beneficios Bancarios",
        bodyContent,
        styles: ['/css/benefits.css', '/css/forms.css'],
        scripts: ['/js/benefits.js']
    });
} 