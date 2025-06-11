import { banks } from '../config.ts';
import type { BankInfo, BankConfig } from '../types.ts';

/**
 * Verifica el estado de un banco específico.
 */
async function checkBankStatus(bankConfig: BankConfig): Promise<BankInfo> {
    const { name, url, icon } = bankConfig;
    try {
        const startTime = Date.now();

        // Usar HEAD request para eficiencia, timeout de 5 segundos
        const response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        const responseTimeMs = Date.now() - startTime;

        return {
            name: name,
            url: url,
            responseTime: `${responseTimeMs}ms`,
            statusCode: response.status,
            statusText: response.ok ? "Operativo" : `Inactivo (Código: ${response.status})`,
            state: response.ok ? "active" : "inactive",
            icon: icon || "https://via.placeholder.com/100x50?text=Bank" // Fallback icon
        };
    } catch (error) {
        // Manejar errores específicos si es necesario (e.g., AbortError for timeout)
        let errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (error instanceof Error && error.name === 'TimeoutError') { // Deno uses TimeoutError
             errorMessage = 'Timeout';
        }
        console.log(`Error al verificar ${name}: ${errorMessage}`);

        return {
            name: name,
            url: url,
            responseTime: "N/A",
            statusCode: 0,
            statusText: `Inactivo (Error: ${errorMessage})`,
            state: "inactive",
            icon: icon || "https://via.placeholder.com/100x50?text=Bank" // Fallback icon
        };
    }
}

/**
 * Obtiene el estado de todos los bancos configurados.
 */
export async function getBankStatuses(): Promise<BankInfo[]> {
    // Utilizar Promise.all para ejecutar las verificaciones en paralelo
    const results = await Promise.all(banks.map(bank => checkBankStatus(bank)));
    return results;
}

/**
 * Obtiene la configuración de un banco por su nombre.
 */
export function getBankConfig(bankName: string): BankConfig | undefined {
    return banks.find(b => b.name === bankName);
} 