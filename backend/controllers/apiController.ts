import { Context, helpers } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getAllBenefits, getBenefitsByBank } from "../services/benefitsService.ts";
import { getBankStatuses } from "../services/bankService.ts";
import { getActiveBanks } from "../config/banks.ts";
import { banks } from '../config.ts';
import { getAllReviews, calculateAverageRatings, getLeaderboardData } from "../services/reviewService.ts";
import { generateBankSummaryPdf } from '../services/pdfService.ts';

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
export function getLeaderboard(ctx: Context) {
    try {
        const { sortBy } = helpers.getQuery(ctx, { mergeParams: true });
        const data = getLeaderboardData(sortBy);

        ctx.response.body = {
            timestamp: new Date().toISOString(),
            leaderboard: data
        };
    } catch (error) {
        console.error("Error al obtener leaderboard:", error);
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

export async function getBankSummaryPdf(ctx: Context) {
    const bankName = helpers.getQuery(ctx, { mergeParams: true }).banco;

    if (!bankName) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Bank name is required.' };
        return;
    }

    try {
        const pdfBytes = await generateBankSummaryPdf(bankName);
        
        ctx.response.status = 200;
        ctx.response.body = pdfBytes;
        ctx.response.headers.set('Content-Type', 'application/pdf');
        ctx.response.headers.set('Content-Disposition', `attachment; filename="resumen-${bankName}.pdf"`);

    } catch (error) {
        console.error(`Error generating PDF for ${bankName}:`, error);
        ctx.response.status = 500;
        ctx.response.body = { error: 'Failed to generate PDF summary.' };
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