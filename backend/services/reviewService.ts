import { DB_FILE } from '../config.ts';
import type { Reseña } from '../types.ts';

// Almacenamiento de reseñas en memoria (se carga desde el archivo)
let reseñas: Reseña[] = [];

/**
 * Asigna categorías automáticamente a reseñas que no las tienen.
 */
function asignarCategoriasAResenas(reseñasData: any[]): Reseña[] {
    return reseñasData.map(reseña => {
        // Si ya tiene categorías o no es una reseña válida, no hacer nada
        if (!reseña || typeof reseña.comentario !== 'string' || (reseña.categorías && reseña.categorías.length > 0)) {
            return reseña as Reseña; // Asumimos que es una reseña si pasa el filtro inicial
        }

        const comentario = reseña.comentario.toLowerCase();
        const categorías: string[] = [];

        // Analizar el comentario para asignar categorías
        if (comentario.includes('lent') || comentario.includes('demor') || comentario.includes('tard')) {
            categorías.push('lentitud');
        }
        if (comentario.includes('acces') || comentario.includes('ingres') || comentario.includes('entr') || comentario.includes('login')) {
            categorías.push('acceso');
        }
        if (comentario.includes('error') || comentario.includes('fall') || comentario.includes('problem')) {
            categorías.push('error');
        }
        if (comentario.includes('segur') || comentario.includes('contrase') || comentario.includes('robo')) {
            categorías.push('seguridad');
        }

        // Si no se identificó ninguna categoría, asignar "otro"
        if (categorías.length === 0) {
            categorías.push('otro');
        }

        // Retornar la reseña con categorías asignadas
        return {
            ...reseña,
            categorías
        };
    });
}

/**
 * Guarda las reseñas en el archivo JSON.
 */
async function guardarReseñas(reseñasParaGuardar: Reseña[]) {
    try {
        await Deno.writeTextFile(DB_FILE, JSON.stringify(reseñasParaGuardar, null, 2));
    } catch (error) {
        console.error("Error al guardar reseñas:", error);
        // Podríamos lanzar el error para manejarlo en un nivel superior si es necesario
        // throw error;
    }
}

/**
 * Carga las reseñas desde el archivo JSON, asigna categorías si es necesario,
 * y actualiza el archivo si hubo cambios.
 */
export async function cargarYProcesarReseñas(): Promise<void> {
    let reseñasActualizadas: Reseña[] = [];
    try {
        const contenido = await Deno.readTextFile(DB_FILE);
        const reseñasCargadas = JSON.parse(contenido);

        // Asegurarnos de que reseñasCargadas es un array
        if (!Array.isArray(reseñasCargadas)) {
            console.error("El archivo de reseñas no contiene un array válido.");
            reseñas = [];
            return;
        }

        // Asignar categorías a reseñas sin categorías
        reseñasActualizadas = asignarCategoriasAResenas(reseñasCargadas);

        // Si hubo cambios, guardar las reseñas actualizadas
        if (JSON.stringify(reseñasCargadas) !== JSON.stringify(reseñasActualizadas)) {
            await guardarReseñas(reseñasActualizadas);
            console.log("Reseñas actualizadas con categorías asignadas automáticamente.");
        }

    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.warn(`Archivo de reseñas (${DB_FILE}) no encontrado. Se creará uno nuevo al guardar la primera reseña.`);
        } else {
            console.error("Error al cargar o procesar reseñas:", error);
        }
        // Si hay error (excepto NotFound), inicializamos con un array vacío
        reseñasActualizadas = [];
    }
    reseñas = reseñasActualizadas; // Actualiza la variable en memoria
    console.log(`Reseñas cargadas en memoria: ${reseñas.length}`);
}

/**
 * Obtiene todas las reseñas almacenadas en memoria.
 */
export function obtenerTodasReseñas(): Reseña[] {
    return [...reseñas]; // Devuelve una copia para evitar mutaciones externas
}

/**
 * Agrega una nueva reseña a la lista y la guarda en el archivo.
 */
export async function agregarReseña(nuevaReseña: Omit<Reseña, 'fecha' | 'categorías'> & { categorías?: string[] }): Promise<void> {
    const reseñaCompleta: Reseña = {
        ...nuevaReseña,
        fecha: new Date().toLocaleString(),
        // Asegurar que categorías sea un array, asignar 'otro' si está vacío o no existe
        categorías: (nuevaReseña.categorías && nuevaReseña.categorías.length > 0) ? nuevaReseña.categorías : ['otro']
    };

    // Agregar la reseña al inicio del array en memoria
    reseñas.unshift(reseñaCompleta);

    // Guardar el array actualizado en el archivo
    await guardarReseñas(reseñas);
}

/**
 * Calcula las estadísticas de reportes comunes por banco.
 */
export function calcularEstadisticasReportes(bancosConfig: { nombre: string }[]): Record<string, { reporteComun: string; conteo: number; totalReseñas: number }> {
    const reportesPorBanco: Record<string, { reporteComun: string; conteo: number; totalReseñas: number }> = {};

    bancosConfig.forEach(banco => {
        const reseñasBanco = reseñas.filter(r => r.banco === banco.nombre);

        if (reseñasBanco.length > 0) {
            const conteoCategorias: Record<string, number> = {};
            reseñasBanco.forEach(reseña => {
                if (reseña.categorías && reseña.categorías.length > 0) {
                    reseña.categorías.forEach(categoria => {
                        conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
                    });
                }
            });

            let categoriaComun = "Sin categoría específica";
            let maxConteo = 0;
            for (const [categoria, conteo] of Object.entries(conteoCategorias)) {
                if (conteo > maxConteo) {
                    maxConteo = conteo;
                    categoriaComun = categoria;
                }
            }

            reportesPorBanco[banco.nombre] = {
                reporteComun: categoriaComun,
                conteo: maxConteo,
                totalReseñas: reseñasBanco.length
            };
        } else {
            reportesPorBanco[banco.nombre] = {
                reporteComun: "Sin reportes",
                conteo: 0,
                totalReseñas: 0
            };
        }
    });

    return reportesPorBanco;
}

/**
 * Calcula los promedios de calificación por banco.
 */
export function calcularPromediosCalificaciones(bancosConfig: { nombre: string }[]): Record<string, { promedio: string; cantidad: number }> {
    const promedios: Record<string, { promedio: string; cantidad: number }> = {};

    bancosConfig.forEach(banco => {
        const reseñasBanco = reseñas.filter(r => r.banco === banco.nombre);
        if (reseñasBanco.length > 0) {
            const total = reseñasBanco.reduce((sum, r) => sum + parseInt(r.calificación, 10), 0);
            promedios[banco.nombre] = {
                promedio: (total / reseñasBanco.length).toFixed(1),
                cantidad: reseñasBanco.length
            };
        } else {
            promedios[banco.nombre] = {
                promedio: "0.0",
                cantidad: 0
            };
        }
    });

    return promedios;
} 