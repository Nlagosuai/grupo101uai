import { DB_FILE } from '../config.ts';
import type { Review as Reseña } from '../types.ts';
import type { Review } from '../types.ts';

// Almacenamiento de reseñas en memoria (se carga desde el archivo)
let reviews: Review[] = [];

/**
 * Asigna categorías automáticamente a reseñas que no las tienen.
 */
function assignCategoriesToReviews(reviewsData: any[]): Review[] {
    return reviewsData.map(reviewData => {
        // Si ya tiene categorías o no es una reseña válida, no hacer nada
        if (!reviewData || typeof reviewData.comentario !== 'string' || (reviewData.categorias && reviewData.categorias.length > 0)) {
            if (reviewData && typeof reviewData.calificación === 'string') {
                return {
                    id: reviewData.id,
                    bank: reviewData.banco,
                    rating: reviewData.calificación,
                    comment: reviewData.comentario,
                    categories: reviewData.categorias || [],
                    date: reviewData.fecha
                } as Review;
            }
            return reviewData as Review;
        }

        const comment = reviewData.comentario.toLowerCase();
        const categories: string[] = [];

        // Analizar el comentario para asignar categorías
        if (comment.includes('lent') || comment.includes('demor') || comment.includes('tard')) {
            categories.push('slow');
        }
        if (comment.includes('acces') || comment.includes('ingres') || comment.includes('entr') || comment.includes('login')) {
            categories.push('access');
        }
        if (comment.includes('error') || comment.includes('fall') || comment.includes('problem')) {
            categories.push('error');
        }
        if (comment.includes('segur') || comment.includes('contrase') || comment.includes('robo')) {
            categories.push('security');
        }

        // Si no se identificó ninguna categoría, asignar "otro"
        if (categories.length === 0) {
            categories.push('other');
        }

        // Retornar la reseña con categorías asignadas y English fields
        return {
            id: reviewData.id,
            bank: reviewData.banco,
            rating: reviewData.calificación,
            comment: reviewData.comentario,
            categories: categories,
            date: reviewData.fecha,
        } as Review;
    });
}

/**
 * Guarda las reseñas en el archivo JSON.
 */
async function saveReviews(reviewsToSave: Review[]) {
    try {
        await Deno.writeTextFile(DB_FILE, JSON.stringify(reviewsToSave, null, 2));
    } catch (error) {
        console.error("Error saving reviews:", error);
    }
}

/**
 * Carga las reseñas desde el archivo JSON, asigna categorías si es necesario,
 * y actualiza el archivo si hubo cambios.
 */
export async function loadAndProcessReviews(): Promise<void> {
    let updatedReviews: Review[] = [];
    try {
        const content = await Deno.readTextFile(DB_FILE);
        const loadedReviewsData = JSON.parse(content);

        if (!Array.isArray(loadedReviewsData)) {
            console.error("Review file does not contain a valid array.");
            reviews = [];
            return;
        }

        updatedReviews = assignCategoriesToReviews(loadedReviewsData);

        const initialReviewsWithEnglishKeys = loadedReviewsData.map(r => ({
             id: r.id, bank: r.banco, rating: r.calificación, comment: r.comentario, categories: r.categorías || [], date: r.fecha
        }) as Review);

        if (JSON.stringify(initialReviewsWithEnglishKeys) !== JSON.stringify(updatedReviews)) {
            await saveReviews(updatedReviews);
            console.log("Reviews updated with automatically assigned categories.");
        } else {
            
        }

    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.warn(`Review file (${DB_FILE}) not founz. A new one will be created when the first review is saved.`);
        } else {
            console.error("Error loading or processing reviews:", error);
        }
        updatedReviews = [];
    }
    reviews = updatedReviews;
    console.log(`Reviews loaded into memory: ${reviews.length}`);
}

/**
 * Obtiene todas las reseñas almacenadas en memoria.
 */
export function getAllReviews(): Review[] {
    return [...reviews];
}

/**
 * Agrega una nueva reseña a la lista y la guarda en el archivo.
 * Expects the incoming object to potentially use Spanish keys from the form.
 */
export async function addReview(newReviewData: any): Promise<void> {
    const completeReview: Review = {
        id: crypto.randomUUID(),
        bank: newReviewData.banco,
        rating: newReviewData.calificación,
        comment: newReviewData.comentario,
        date: new Date().toLocaleString(),
        categories: (newReviewData.categorías && newReviewData.categorías.length > 0)
            ? newReviewData.categorías.map((cat: string) => {
                const translationMap: { [key: string]: string } = {
                    'acceso': 'access',
                    'lentitud': 'slow',
                    'error': 'error',
                    'seguridad': 'security',
                    'otro': 'other'
                };
                return translationMap[cat.toLowerCase()] || cat;
              })
            : ['other']
    };

    reviews.unshift(completeReview);

    await saveReviews(reviews);
}

/**
 * Calcula las estadísticas de reportes comunes por banco.
 */
export function calculateReportStatistics(banksConfig: { name: string }[]): Record<string, { commonReport: string; count: number; totalReviews: number }> {
    const reportsByBank: Record<string, { commonReport: string; count: number; totalReviews: number }> = {};

    banksConfig.forEach(bank => {
        const bankReviews = reviews.filter(r => r.bank === bank.name);

        if (bankReviews.length > 0) {
            const categoryCounts: Record<string, number> = {};
            bankReviews.forEach(review => {
                if (review.categories && review.categories.length > 0) {
                    review.categories.forEach(category => {
                        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                    });
                }
            });

            let commonCategory = "No specific category";
            let maxCount = 0;
            for (const [category, count] of Object.entries(categoryCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    commonCategory = category;
                }
            }

            reportsByBank[bank.name] = {
                commonReport: commonCategory,
                count: maxCount,
                totalReviews: bankReviews.length
            };
        } else {
            reportsByBank[bank.name] = {
                commonReport: "No reports",
                count: 0,
                totalReviews: 0
            };
        }
    });

    return reportsByBank;
}

/**
 * Calcula los promedios de calificación por banco.
 */
export function calculateAverageRatings(banksConfig: { name: string }[]): Record<string, { average: string; count: number }> {
    const averages: Record<string, { average: string; count: number }> = {};

    banksConfig.forEach(bank => {
        const bankReviews = reviews.filter(r => r.bank === bank.name);
        if (bankReviews.length > 0) {
            const total = bankReviews.reduce((sum, r) => sum + parseInt(r.rating, 10), 0);
            averages[bank.name] = {
                average: (total / bankReviews.length).toFixed(1),
                count: bankReviews.length
            };
        } else {
            averages[bank.name] = {
                average: "0.0",
                count: 0
            };
        }
    });

    return averages;
} 