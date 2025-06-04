import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getAllBenefits, getBenefitsByBank } from "../services/benefitsService.ts";
import { getBankStatuses } from "../services/bankService.ts";
import { getActiveBanks } from "../config/banks.ts";
import { banks } from '../config.ts';
import { getAllReviews, calculateAverageRatings } from "../services/reviewService.ts";

/**
 * Endpoint para obtener los estados actuales de los bancos
 */
export async function getBankStatusesApi(ctx: Context) {
    try {
        // Usar getBankStatuses() que realmente verifica si los sitios están en línea
        const bankStatusesInfo = await getBankStatuses();
        
        // Convertir la respuesta al formato que espera el frontend
        const bankStatuses = bankStatusesInfo.map(bankInfo => ({
            name: bankInfo.name,
            status: bankInfo.state === "active" ? "online" : "issues",
            state: bankInfo.state,
            statusText: bankInfo.state === "active" ? "Operativo" : "Con Problemas",
            icon: bankInfo.icon,
            lastUpdated: new Date().toISOString()
        }));

        ctx.response.body = {
            timestamp: new Date().toISOString(),
            statuses: bankStatuses
        };
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = {
            error: "Error al obtener estados de bancos",
            message: error.message
        };
    }
}

/**
 * Endpoint para obtener el leaderboard de bancos
 */
export async function getLeaderboard(ctx: Context) {
    try {
        // Obtener todas las reseñas
        const allReviews = getAllReviews();
        
        // Mapeo de categorías en inglés a español (en la BD están en inglés)
        const categoryMapping = {
            'access': 'accessibility', // accesibilidad
            'slow': 'performance',     // rendimiento
            'error': 'usability',      // usabilidad
            'security': 'security',    // seguridad
            'other': 'support'         // soporte
        };
        
        // Categorías de evaluación
        const categories = [
            { id: "overall", name: "General" },
            { id: "accessibility", name: "Accesibilidad" },
            { id: "usability", name: "Usabilidad" },
            { id: "performance", name: "Rendimiento" },
            { id: "support", name: "Soporte" },
            { id: "security", name: "Seguridad" }
        ];
        
        const leaderboardData = banks.map(bank => {
            // Obtener reseñas específicas de este banco
            const bankReviews = allReviews.filter(review => review.bank === bank.name);
            const reviewCount = bankReviews.length;
            
            // Inicializar objeto para acumular calificaciones por categoría
            const categoryRatings = {};
            const categoryCounts = {};
            
            // Inicializar con todas las categorías en 0
            categories.forEach(category => {
                if (category.id !== "overall") { // Excluimos "overall" que se calcula después
                    categoryRatings[category.id] = 0;
                    categoryCounts[category.id] = 0;
                }
            });
            
            // Calcular puntuaciones para cada categoría basadas en las reseñas
            bankReviews.forEach(review => {
                // Cada reseña tiene un rating y categorías asociadas
                const rating = parseFloat(review.rating);
                
                if (!isNaN(rating)) {
                    review.categories.forEach(category => {
                        // Mapear la categoría de la reseña a la categoría del leaderboard
                        const leaderboardCategory = categoryMapping[category];
                        
                        if (leaderboardCategory) {
                            categoryRatings[leaderboardCategory] += rating;
                            categoryCounts[leaderboardCategory]++;
                        }
                    });
                }
            });
            
            // Calcular promedios por categoría
            const categoryScores = {};
            let validCategoryCount = 0;
            let totalCategoryScore = 0;
            
            categories.forEach(category => {
                if (category.id !== "overall") {
                    const count = categoryCounts[category.id];
                    if (count > 0) {
                        const avgScore = categoryRatings[category.id] / count;
                        categoryScores[category.id] = parseFloat(avgScore.toFixed(1));
                        totalCategoryScore += categoryScores[category.id];
                        validCategoryCount++;
                    } else {
                        // Sin calificación para esta categoría
                        categoryScores[category.id] = 0;
                    }
                }
            });
            
            // Calcular puntuación general como promedio de los promedios de categorías
            let overall = 0;
            if (validCategoryCount > 0) {
                overall = parseFloat((totalCategoryScore / validCategoryCount).toFixed(1));
            }
            categoryScores["overall"] = overall;
            
            return {
                name: bank.name,
                overall: overall,
                scores: categoryScores,
                reviewCount: reviewCount
            };
        });

        // Ordenar por calificación general promedio de mayor a menor
        leaderboardData.sort((a, b) => b.overall - a.overall);

        // Agregar posición en el ranking
        const rankedData = leaderboardData.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        ctx.response.body = {
            timestamp: new Date().toISOString(),
            categories: categories,
            leaderboard: rankedData
        };
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = {
            error: "Error al obtener leaderboard",
            message: error.message
        };
    }
}

/**
 * Endpoint para obtener todos los beneficios del mes actual
 */
export async function getBenefitsApi(ctx: Context) {
    try {
        const benefits = await getAllBenefits();
        
        ctx.response.body = {
            timestamp: new Date().toISOString(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            benefits: benefits
        };
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = {
            error: "Error al obtener beneficios",
            message: error.message
        };
    }
}

/**
 * Endpoint para obtener los beneficios de un banco específico
 */
export async function getBankBenefitsApi(ctx: Context) {
    try {
        const { banco } = helpers.getQuery(ctx, { mergeParams: true });
        if (!banco) {
            ctx.response.status = 400;
            ctx.response.body = {
                error: "Parámetro 'banco' requerido"
            };
            return;
        }

        const bankName = decodeURIComponent(banco);
        const benefits = await getBenefitsByBank(bankName);
        
        ctx.response.body = {
            timestamp: new Date().toISOString(),
            bank: bankName,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            benefits: benefits
        };
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = {
            error: "Error al obtener beneficios del banco",
            message: error.message
        };
    }
}

// Si hubiera más endpoints API, se añadirían aquí.
// Por ejemplo, un endpoint para obtener todas las reseñas:
/*
import { getAllReviews as fetchAllReviews } from '../services/reviewService.ts';

export function getAllReviewsApi(ctx: Context) {
    try {
        const reviews = fetchAllReviews();
        ctx.response.body = reviews;
        ctx.response.type = "json";
    } catch (error) {
        console.error("Error fetching all reviews:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Error al obtener todas las reseñas." };
        ctx.response.type = "json";
    }
}
*/ 