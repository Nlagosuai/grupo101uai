import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { banks } from '../config.ts';
import { getAllReviews, addReview, calculateReportStatistics, calculateAverageRatings } from '../services/reviewService.ts';
import { getBankStatuses, getBankConfig } from '../services/bankService.ts';
import { getRecentProblemStatistics, getAllReports, problemTypeTranslations, getReportsByBank } from '../services/problemReportService.ts';
import { renderPage } from '../utils/templateUtils.ts';
import { renderStars, getBankImage } from '../utils/renderUtils.ts';
import type { Review, BankInfo, BankConfig } from '../types.ts';
import { getBenefitsByBank } from "../services/benefitsService.ts";

/**
 * Muestra la página de resumen para descargar PDFs.
 */
export function showSummaryPage(ctx: Context) {
    const banksList = banks.map(bank => ({
        name: bank.name,
        icon: bank.icon,
        slug: encodeURIComponent(bank.name)
    }));

    const bodyContent = `
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Resumen de Bancos</h1>
            <p>Descarga un informe completo en PDF con toda la información relevante de cada banco.</p>
        </div>

        <div class="summary-grid">
            ${banksList.map(bank => `
                <div class="summary-card">
                    <img src="${bank.icon}" alt="Logo de ${bank.name}" class="summary-bank-logo">
                    <h2 class="summary-bank-name">${bank.name}</h2>
                    <p class="summary-description">Informe detallado sobre servicios, reseñas, reportes y beneficios.</p>
                    <a href="/api/summary/${bank.slug}/pdf" class="button button-primary" download>
                        <i class="fas fa-file-pdf"></i> Descargar PDF
                    </a>
                </div>
            `).join('')}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Resumen de Bancos",
        bodyContent,
        styles: ['/css/summary.css']
    });
}

/**
 * Muestra la página de inicio simple.
 */
export function showSimpleHomePage(ctx: Context) {
    // Servir el archivo index.html estático
    ctx.response.body = renderPage({
        title: "Inicio",
        bodyContent: `
        <main class="main-content">
            <div class="home-container">
                <div class="home-header">
                    <h1>Bienvenido a Monitor de Bancos</h1>
                    <p>Tu herramienta para monitorear el estado de los servicios bancarios</p>
                </div>
                
                <div class="feature-cards">
                    <a href="/status" class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h2>Estados</h2>
                        <p>Consulta el estado actual de los servicios bancarios</p>
                    </a>
                    
                    <a href="/leaderboard" class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <h2>Leaderboard</h2>
                        <p>Descubre los bancos mejor valorados por los usuarios</p>
                    </a>
                    
                    <a href="/benefits" class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <h2>Beneficios</h2>
                        <p>Conoce los beneficios exclusivos de cada banco</p>
                    </a>
                </div>
            </div>
        </main>
        `,
        styles: ['/css/home.css']
    });
}

/**
 * Muestra la página principal (Home/Estados).
 */
export async function showHomePage(ctx: Context) {
    const bankStatuses = await getBankStatuses();
    const averageRatings = calculateAverageRatings(banks);
    const reportsByBank = calculateReportStatistics(banks);
    const problemStats = await getRecentProblemStatistics(banks);
    const reviews = getAllReviews();
    
    // Organizar reseñas por banco para la sección de reseñas
    const reviewsByBank: Record<string, { reviews: Review[], average: number, count: number }> = {};
    
    banks.forEach(bank => {
        reviewsByBank[bank.name] = { reviews: [], average: 0.0, count: 0 };
    });
    
    reviews.forEach(review => {
        if (reviewsByBank[review.bank]) {
            reviewsByBank[review.bank].reviews.push(review);
        }
    });
    
    Object.keys(reviewsByBank).forEach(bankName => {
        const bankData = reviewsByBank[bankName];
        if (bankData.reviews.length > 0) {
            const total = bankData.reviews.reduce((sum, r) => sum + r.rating, 0);
            bankData.average = total / bankData.reviews.length;
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
                const ratingInfo = averageRatings[status.name] || { average: 0.0, count: 0 };
                const stars = renderStars(ratingInfo.average);
                const problemInfo = problemStats[status.name] || { commonReport: "Sin reportes recientes", count: 0, totalReports: 0 };
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
                                ${ratingInfo.average.toFixed(1)}
                                <div class="bank-stars">${stars}</div>
                            </div>
                            ${ratingInfo.count > 0 ?
                                `<div class="reviews-count">Basado en ${ratingInfo.count} reseña${ratingInfo.count !== 1 ? 's' : ''}</div>` :
                                '<div class="reviews-count">Sin reseñas</div>'}
                            <div class="buttons-container">
                                <a href="/evaluate/${encodeURIComponent(status.name)}" class="button">Evaluar Servicio</a>
                                <a href="/report-problem/${encodeURIComponent(status.name)}" class="button button-secondary">Reportar un Problema</a>
                            </div>
                            <div class="card-last-update">Estado actualizado</div>
                        </div>

                        <div class="tab-content" id="stats-${encodeURIComponent(status.name)}">
                            <div class="bank-stats-content">
                                <h3>Reportes de Problemas</h3>
                                ${problemInfo.totalReports > 0 ? `
                                    <div class="report-common">
                                        <strong>Problema más común:</strong> ${problemInfo.commonReport}
                                    </div>
                                    <div class="report-stats">
                                        <span>Total de reportes: ${problemInfo.totalReports}</span>
                                    </div>
                                    <a href="/reports/${encodeURIComponent(status.name)}" class="button view-all-btn">Ver todos los reportes</a>
                                ` : `
                                    <div class="no-stats">Aún no hay reportes para este banco.</div>
                                    <a href="/report-problem/${encodeURIComponent(status.name)}" class="button">Sé el primero en reportar</a>
                                `}
                            </div>
                        </div>

                        <div class="tab-content" id="reviews-${encodeURIComponent(status.name)}">
                            <div class="bank-reviews-content">
                                ${bankReviews.length > 0 ? `
                                    <div class="reviews-mini-grid">
                                        ${bankReviews.slice(0, 1).map(review => {
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
                                    ${bankReviews.length > 1 ? `
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
 * Muestra la página con todos los reportes de problemas para un banco específico.
 */
export async function showBankReportsPage(ctx: Context) {
    const bankName = helpers.getQuery(ctx, { mergeParams: true }).banco;
    const bankConfig = getBankConfig(bankName);

    if (!bankConfig) {
        ctx.response.status = 404;
        ctx.response.body = "Banco no encontrado";
        return;
    }

    const bankReports = await getReportsByBank(bankName);
    // Ordenar los reportes por fecha, de más reciente a más antiguo
    bankReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const bodyContent = `
    <main class="main-content">
        <a href="/status" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="page-header">
            <img src="${bankConfig.icon}" alt="Logo de ${bankName}" class="page-header-logo">
            <h1 class="page-title">Reportes de Problemas para ${bankName}</h1>
            <p>Aquí se listan todos los reportes de problemas enviados por los usuarios para ${bankName}.</p>
        </div>
        <div class="reports-list">
            ${bankReports.length > 0 ? bankReports.map(report => {
                const translatedProblemType = problemTypeTranslations[report.problemType] || report.problemType;
                const categoryClass = `category--${report.problemType}`;

                return `
                <div class="report-card">
                    <div class="report-body">
                        <p><strong>Categoría:</strong> <span class="report-category ${categoryClass}">${translatedProblemType}</span></p>
                        ${report.description ? `<p class="report-comment"><strong>Comentario:</strong> ${report.description}</p>` : ''}
                    </div>
                    <div class="report-footer">
                        <span class="report-timestamp">Reportado el: ${new Date(report.date).toLocaleString()}</span>
                    </div>
                </div>
                `;
            }).join('') : `
                <div class="no-reports-message">
                    <p>No hay reportes de problemas para mostrar para este banco.</p>
                </div>
            `}
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: `Reportes para ${bankName}`,
        bodyContent,
        styles: ['/css/base-styles.css', '/css/reports-list.css'],
        scripts: []
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
            const total = bankData.reviews.reduce((sum, r) => sum + r.rating, 0);
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
                    <div class="star-rating" data-rating-group="calificación">
                        <input type="hidden" name="calificación" class="rating-value" value="0">
                        <div class="stars">
                            ${[1, 2, 3, 4, 5].map(n => `
                                <span class="star" data-rating="${n}"><i class="far fa-star"></i></span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="sub-ratings-container">
                    <h3 class="sub-ratings-title">Calificaciones Detalladas</h3>
                    ${[
                        { name: 'facilidadDeUso', text: 'Facilidad de Uso' },
                        { name: 'accesibilidad', text: 'Accesibilidad' },
                        { name: 'estabilidad', text: 'Estabilidad' },
                        { name: 'precio', text: 'Precio' },
                        { name: 'serviciosAlUsuario', text: 'Servicios al Usuario' }
                    ].map(sub => `
                        <div class="form-group sub-rating-group">
                            <label>${sub.text}</label>
                            <div class="star-rating-small" data-rating-group="${sub.name}">
                                <input type="hidden" name="${sub.name}" class="rating-value" value="0">
                                <div class="stars">
                                    ${[1, 2, 3, 4, 5].map(n => `
                                        <span class="star" data-rating="${n}"><i class="far fa-star"></i></span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="form-group">
                    <label for="comentario">¿Cómo fue tu experiencia? <span class="label-optional">(Opcional)</span></label>
                    <textarea
                        id="comentario"
                        name="comentario"
                        class="form-control"
                        placeholder="Describe detalladamente tu experiencia general con el banco..."
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
        styles: ['/css/evaluate.css', '/css/forms.css'],
        scripts: ['/js/evaluate.js']
    });
}

/**
 * Muestra la página para reportar un problema.
 */
export function showReportProblemPage(ctx: Context) {
    const bankName = helpers.getQuery(ctx, { mergeParams: true }).banco;
    const bankConfig = getBankConfig(bankName);

    if (!bankConfig) {
        ctx.response.status = 404;
        ctx.response.body = "Banco no encontrado.";
        return;
    }

    const bodyContent = `
    <main class="main-content">
        <a href="/status" class="back-link">
            <i class="fas fa-arrow-left"></i> Volver a Estados
        </a>
        <div class="page-header">
            <h1 class="page-title">Reportar un Problema con ${bankConfig.name}</h1>
            <p>Describe el problema que encontraste para que otros usuarios estén al tanto.</p>
        </div>

        <div class="form-container">
            <form id="report-problem-form" action="/api/report-problem" method="POST">
                <input type="hidden" name="banco" value="${bankConfig.name}">
                
                <div class="form-group">
                    <label>Tipo de Problema</label>
                    <input type="hidden" id="problem-type" name="problemType" value="">
                    <div class="category-buttons">
                        <button type="button" class="category-btn" data-value="disponibilidad">Disponibilidad</button>
                        <button type="button" class="category-btn" data-value="calidad_de_servicio">Calidad de Servicio</button>
                        <button type="button" class="category-btn" data-value="facilidad_de_desuscripcion">Facilidad de Desuscripción</button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="problem-description">Comentario <span class="label-optional">(Opcional)</span></label>
                    <textarea id="problem-description" name="problemDescription" class="form-control" rows="6" placeholder="Describe tu experiencia..."></textarea>
                </div>

                <div class="form-group">
                    <button type="submit" class="button">Enviar Reporte</button>
                </div>
            </form>
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: `Reportar Problema - ${bankConfig.name}`,
        bodyContent,
        styles: ['/css/forms.css'],
        scripts: ['/js/report-problem.js']
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
        const ratingValue = formData.get("calificación");

        // Validar que la calificación principal exista
        if (!ratingValue || parseFloat(ratingValue) === 0) {
            ctx.response.status = 400;
            ctx.response.body = { message: "La calificación principal es requerida." };
            return;
        }
        
        const commentValue = formData.get("comentario");
        const categoryValues = formData.getAll("categorías");

        const reviewData = {
            banco: bankName,
            calificación: ratingValue,
            comentario: commentValue,
            categorías: categoryValues,
            // Sub-ratings
            facilidadDeUso: formData.get("facilidadDeUso"),
            accesibilidad: formData.get("accesibilidad"),
            estabilidad: formData.get("estabilidad"),
            precio: formData.get("precio"),
            serviciosAlUsuario: formData.get("serviciosAlUsuario")
        };

        await addReview(reviewData);

        ctx.response.redirect(`/thank-you?banco=${encodeURIComponent(bankName)}`);

    } catch (error) {
        console.error("Error procesando la evaluación:", error);
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
 * Muestra la página de leaderboard.
 */
export function showLeaderboardPage(ctx: Context) {
    const bodyContent = `
    <main class="main-content">
        <div class="page-header">
            <h1 class="page-title">Leaderboard de Bancos</h1>
            <p>Clasificación de los bancos según la opinión de los usuarios.</p>
        </div>

        <div class="leaderboard-filters">
            <button class="filter-btn active" data-category="averageRating">Calificación General</button>
            <button class="filter-btn" data-category="facilidadDeUso">Facilidad de Uso</button>
            <button class="filter-btn" data-category="accesibilidad">Accesibilidad</button>
            <button class="filter-btn" data-category="estabilidad">Estabilidad</button>
            <button class="filter-btn" data-category="precio">Precio</button>
            <button class="filter-btn" data-category="serviciosAlUsuario">Servicios al Usuario</button>
        </div>

        <div class="leaderboard-list-container">
            <div id="leaderboard-list">
                <!-- Las tarjetas del leaderboard se insertarán dinámicamente aquí -->
            </div>
            <div id="loading-indicator" class="loading-indicator">
                <div class="spinner"></div>
                <span>Cargando...</span>
            </div>
            <div id="error-indicator" class="error-indicator" style="display: none;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>No se pudo cargar el leaderboard. Inténtalo de nuevo más tarde.</span>
            </div>
        </div>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Leaderboard",
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
            <h1>Beneficios Bancarios</h1>
            <p class="benefits-description">
                Selecciona un banco para descubrir los beneficios que tiene para ti.
            </p>
        </section>

        <section id="bank-selector-container" class="card">
             <div class="bank-logos-grid">
                ${banks.map(bank => `
                    <button class="bank-logo-btn" data-bank="${bank.name}" aria-label="Beneficios de ${bank.name}">
                        <img src="${bank.icon}" alt="Logo ${bank.name}">
                        <span>${bank.name}</span>
                    </button>
                `).join('')}
            </div>
        </section>
        
        <section id="benefits-content" class="hidden">
            <div id="selected-bank-header" class="card"></div>

            <section id="benefits-filter">
                <div class="filter-container card">
                    <h3>Filtrar Beneficios</h3>
                    <div class="filter-controls">
                        <!-- El filtro de banco ahora se maneja por la selección principal -->
                        <input type="hidden" id="bank-filter" value="all">

                        <div class="filter-group">
                            <label for="category-filter">Categoría:</label>
                            <select id="category-filter">
                                <option value="all">Todas las categorías</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="day-filter">Día:</label>
                            <select id="day-filter">
                                <option value="all">Todos los días</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>
            
            <section id="benefits-display">
                <div id="benefits-list" class="benefits-container">
                    <p class="loading-message">Cargando beneficios...</p>
                </div>
            </section>
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

/**
 * Muestra la página de agradecimiento después de enviar un reporte.
 */
export function showThankYouReportPage(ctx: Context) {
    const bankName = helpers.getQuery(ctx, { mergeParams: true }).banco || 'el banco';

    const bodyContent = `
    <main class="main-content success-card">
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="success-title">¡Gracias por tu reporte!</h1>
        <p class="success-message">
            Tu reporte sobre ${bankName} ha sido recibido. La comunidad te lo agradece.
        </p>
        <a href="/status" class="button">Volver a Estados</a>
        <p class="redirect-text">
            Serás redirigido automáticamente en <span id="countdown" class="countdown">5</span> segundos...
        </p>
    </main>
    `;

    ctx.response.body = renderPage({
        title: "Reporte Enviado",
        bodyContent,
        styles: ['/css/thank-you.css'],
        scripts: ['/js/thank-you.js']
    });
} 