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
        console.log("Iniciando procesamiento de reporte de problema...");
        
        const body = ctx.request.body();
        console.log("Tipo de body:", body.type);
        
        if (body.type !== "json") {
            console.log("Error: Body no es JSON, es:", body.type);
            ctx.response.status = 400;
            ctx.response.body = { message: "Formato de solicitud no válido. Se esperaba JSON." };
            return;
        }

        const reportData = await body.value;
        console.log("Datos del reporte recibidos:", reportData);
        
        const bankName = reportData.banco;
        console.log("Nombre del banco:", bankName);

        const bankConfig = getBankConfig(bankName);
        console.log("Configuración del banco encontrada:", bankConfig);
        
        if (!bankConfig) {
            console.log("Error: Banco no encontrado:", bankName);
            ctx.response.status = 404;
            ctx.response.body = { message: "Banco no encontrado." };
            return;
        }

        if (!reportData.problemType) {
            console.log("Error: Tipo de problema no proporcionado");
            ctx.response.status = 400;
            ctx.response.body = { message: "El tipo de problema es requerido." };
            return;
        }

        console.log("Creando nuevo reporte...");
        const newReport: ProblemReport = {
            id: crypto.randomUUID(),
            bank: bankName,
            problemType: reportData.problemType,
            description: reportData.problemDescription || '',
            date: new Date().toISOString(),
            status: 'recibido', 
        };
        console.log("Nuevo reporte creado:", newReport);

        console.log("Leyendo reportes existentes...");
        const reports = await readReports();
        console.log("Reportes existentes:", reports.length);
        
        reports.unshift(newReport); // Añadir al principio
        console.log("Reporte agregado a la lista");
        
        console.log("Escribiendo reportes al archivo...");
        await writeReports(reports);
        console.log("Reportes escritos exitosamente");

        ctx.response.status = 201; // Creado
        ctx.response.body = { message: "Reporte recibido con éxito." };
        console.log("Respuesta enviada exitosamente");

    } catch (error) {
        console.error("Error al procesar el reporte de problema:", error);
        console.error("Stack trace:", error.stack);
        ctx.response.status = 500;
        ctx.response.body = { message: "Error interno del servidor al procesar el reporte." };
    }
} 