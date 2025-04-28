import { bancos } from '../config.ts';
import type { BancoInfo, BancoConfig } from '../types.ts';

/**
 * Verifica el estado de un banco específico.
 */
async function verificarBanco(bancoConfig: BancoConfig): Promise<BancoInfo> {
    const { nombre, url, icono } = bancoConfig;
    try {
        const inicioTiempo = Date.now();

        // Usar HEAD request para eficiencia, timeout de 5 segundos
        const respuesta = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        const tiempoRespuesta = Date.now() - inicioTiempo;

        return {
            nombre: nombre,
            url: url,
            tiempoRespuesta: `${tiempoRespuesta}ms`,
            codigoEstado: respuesta.status,
            status: respuesta.ok ? "ACTIVO" : `INACTIVO (Código: ${respuesta.status})`,
            estado: respuesta.ok ? "activo" : "inactivo",
            icono: icono || "https://via.placeholder.com/100x50?text=Banco" // Fallback icon
        };
    } catch (error) {
        // Manejar errores específicos si es necesario (e.g., AbortError for timeout)
        let errorMessage = error instanceof Error ? error.message : "Error desconocido";
        if (error instanceof Error && error.name === 'TimeoutError') { // Deno uses TimeoutError
             errorMessage = 'Timeout';
        }
        console.log(`Error al verificar ${nombre}: ${errorMessage}`);

        return {
            nombre: nombre,
            url: url,
            tiempoRespuesta: "N/A",
            codigoEstado: 0,
            status: `INACTIVO (Error: ${errorMessage})`,
            estado: "inactivo",
            icono: icono || "https://via.placeholder.com/100x50?text=Banco" // Fallback icon
        };
    }
}

/**
 * Obtiene el estado de todos los bancos configurados.
 */
export async function obtenerEstadosBancos(): Promise<BancoInfo[]> {
    // Utilizar Promise.all para ejecutar las verificaciones en paralelo
    const resultados = await Promise.all(bancos.map(banco => verificarBanco(banco)));
    return resultados;
}

/**
 * Obtiene la configuración de un banco por su nombre.
 */
export function obtenerConfigBanco(nombreBanco: string): BancoConfig | undefined {
    return bancos.find(b => b.nombre === nombreBanco);
} 