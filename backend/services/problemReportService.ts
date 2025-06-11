import type { ProblemReport, BankConfig } from '../types.ts';

const REPORTS_FILE = 'problem-reports.json';

// Traducciones de tipos de problemas
export const problemTypeTranslations: Record<string, string> = {
    'disponibilidad': 'Disponibilidad',
    'calidad_de_servicio': 'Calidad de Servicio',
    'facilidad_de_desuscripcion': 'Facilidad de Desuscripción'
};

/**
 * Lee todos los reportes de problemas desde el archivo JSON.
 */
export async function getAllReports(): Promise<ProblemReport[]> {
    try {
        const content = await Deno.readTextFile(REPORTS_FILE);
        return JSON.parse(content);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return []; // Si el archivo no existe, devuelve un array vacío
        }
        console.error(`Error al leer los reportes desde ${REPORTS_FILE}:`, error);
        throw error;
    }
}

/**
 * Calcula las estadísticas de los problemas más comunes de los últimos 10 reportes para cada banco.
 */
export async function getRecentProblemStatistics(banksConfig: BankConfig[]): Promise<Record<string, { commonReport: string; count: number; totalReports: number }>> {
    const allReports = await getAllReports();
    const stats: Record<string, { commonReport: string; count: number; totalReports: number }> = {};

    for (const bank of banksConfig) {
        // Filtrar reportes para el banco actual
        const allBankReports = allReports.filter(r => r.bank === bank.name);
        const recentBankReports = allBankReports.slice(-10); // Tomar los últimos 10 para el "más común"

        if (allBankReports.length === 0) {
            stats[bank.name] = { commonReport: 'Sin reportes', count: 0, totalReports: 0 };
            continue;
        }

        const problemCounts: Record<string, number> = {};
        for (const report of recentBankReports) {
            problemCounts[report.problemType] = (problemCounts[report.problemType] || 0) + 1;
        }

        let mostCommonProblem = '';
        let maxCount = 0;
        for (const [problem, count] of Object.entries(problemCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonProblem = problem;
            }
        }
        
        // Traducir el tipo de problema a un formato legible
        const translatedProblem = problemTypeTranslations[mostCommonProblem] || mostCommonProblem;

        stats[bank.name] = {
            commonReport: translatedProblem,
            count: maxCount,
            totalReports: allBankReports.length // Usar el total de reportes del banco
        };
    }

    return stats;
}

/**
 * Obtiene todos los reportes para un banco específico.
 */
export async function getReportsByBank(bankName: string): Promise<ProblemReport[]> {
    const allReports = await getAllReports();
    return allReports.filter(report => report.bank === bankName);
} 