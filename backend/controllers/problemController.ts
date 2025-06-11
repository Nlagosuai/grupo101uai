import { Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankConfig } from '../services/bankService.ts';
import type { ProblemReport } from '../types.ts';

const REPORTS_FILE = 'problem-reports.json';

async function readReports(): Promise<ProblemReport[]> {
    try {
        const content = await Deno.readTextFile(REPORTS_FILE);
        return JSON.parse(content);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return []; // Si el archivo no existe, empezar con un array vacío
        }
        console.error(`Error al leer los reportes desde ${REPORTS_FILE}:`, error);
        throw error;
    }
}

async function writeReports(reports: ProblemReport[]): Promise<void> {
    try {
        await Deno.writeTextFile(REPORTS_FILE, JSON.stringify(reports, null, 2));
    } catch (error) {
        console.error(`Error al escribir los reportes en ${REPORTS_FILE}:`, error);
        throw error;
    }
}

export async function handleProblemReportSubmit(ctx: Context) {
    try {
        const body = ctx.request.body();
        if (body.type !== "json") {
            ctx.response.status = 400;
            ctx.response.body = { message: "Formato de solicitud no válido. Se esperaba JSON." };
            return;
        }

        const reportData = await body.value;
        const bankName = reportData.banco;

        if (!getBankConfig(bankName)) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Banco no encontrado." };
            return;
        }

        if (!reportData.problemType) {
            ctx.response.status = 400;
            ctx.response.body = { message: "El tipo de problema es requerido." };
            return;
        }

        const newReport: ProblemReport = {
            id: crypto.randomUUID(),
            bank: bankName,
            problemType: reportData.problemType,
            description: reportData.problemDescription || '',
            date: new Date().toISOString(),
            status: 'recibido', 
        };

        const reports = await readReports();
        reports.unshift(newReport); // Añadir al principio
        await writeReports(reports);

        ctx.response.status = 201; // Creado
        ctx.response.body = { message: "Reporte recibido con éxito." };

    } catch (error) {
        console.error("Error al procesar el reporte de problema:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Error interno del servidor al procesar el reporte." };
    }
} 