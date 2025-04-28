import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankStatuses as fetchBankStatuses } from '../services/bankService.ts';

/**
 * Devuelve el estado actual de todos los bancos como JSON.
 */
export async function getBankStatusesApi(ctx: Context) {
    try {
        const statuses = await fetchBankStatuses();
        ctx.response.body = statuses;
        ctx.response.type = "json";
    } catch (error) {
        console.error("Error fetching bank statuses:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Error al obtener los estados de los bancos." };
        ctx.response.type = "json";
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