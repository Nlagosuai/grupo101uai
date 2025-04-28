import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { obtenerEstadosBancos } from '../services/bankService.ts';

/**
 * Devuelve el estado actual de todos los bancos como JSON.
 */
export async function getBankStatuses(ctx: Context) {
    try {
        const estados = await obtenerEstadosBancos();
        ctx.response.body = estados;
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
import { obtenerTodasReseñas } from '../services/reviewService.ts';

export function getAllReviews(ctx: Context) {
    try {
        const reseñas = obtenerTodasReseñas();
        ctx.response.body = reseñas;
        ctx.response.type = "json";
    } catch (error) {
        console.error("Error fetching all reviews:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Error al obtener todas las reseñas." };
        ctx.response.type = "json";
    }
}
*/ 