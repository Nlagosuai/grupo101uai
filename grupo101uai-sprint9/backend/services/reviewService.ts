import { DB_FILE } from '../config.ts';
import type { Review as Reseña } from '../types.ts';
import type { Review, CostReview } from '../types.ts';

const COST_REVIEWS_FILE = 'cost_reviews.json';

// Almacenamiento de reseñas en memoria (se carga desde el archivo)
let reviews: Review[] = [];
let costReviews: CostReview[] = [];

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
            categories.push('Lentitud');
        }
        if (comment.includes('acces') || comment.includes('ingres') || comment.includes('entr') || comment.includes('login')) {
            categories.push('Problemas de Acceso');
        }
        if (comment.includes('error') || comment.includes('fall') || comment.includes('problem')) {
            categories.push('Error en Transacción');
        }
        if (comment.includes('segur') || comment.includes('contrase') || comment.includes('robo')) {
            categories.push('Seguridad');
        }

        // Si no se identificó ninguna categoría, asignar "Otro"
        if (categories.length === 0) {
            categories.push('Otro');
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
                // Mantener las categorías en español
                const translationMap: { [key: string]: string } = {
                    'acceso': 'Problemas de Acceso',
                    'lentitud': 'Lentitud',
                    'error': 'Error en Transacción',
                    'seguridad': 'Seguridad',
                    'otro': 'Otro'
                };
                return translationMap[cat.toLowerCase()] || cat;
              })
            : ['Otro']
    };

    reviews.unshift(completeReview);

    await saveReviews(reviews);
}

/**
 * Calcula las estadísticas de reportes comunes por banco.
 */
export function calculateReportStatistics(banksConfig: { name: string }[]): Record<string, { commonReport: string; count: number; totalReviews: number }> {
    const reportsByBank: Record<string, { commonReport: string; count: number; totalReviews: number }> = {};

    // Mapa de traducción de categorías
    const categoryTranslations: Record<string, string> = {
        'slow': 'Lentitud',
        'access': 'Problemas de Acceso',
        'error': 'Error en Transacción',
        'security': 'Seguridad',
        'other': 'Otro',
        'No specific category': 'Sin categoría específica',
        'No reports': 'Sin reportes'
    };

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

            // Traducir la categoría común
            const translatedCategory = categoryTranslations[commonCategory] || commonCategory;

            reportsByBank[bank.name] = {
                commonReport: translatedCategory,
                count: maxCount,
                totalReviews: bankReviews.length
            };
        } else {
            reportsByBank[bank.name] = {
                commonReport: categoryTranslations["No reports"],
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

/**
 * Generates leaderboard data based on average review scores.
 */
export function getLeaderboardData(): { bank: string; averageRating: number; rank: number }[] {
    if (!reviews || reviews.length === 0) {
        return [];
    }

    const bankRatings: { [key: string]: { totalRating: number; reviewCount: number } } = {};

    reviews.forEach(review => {
        if (!bankRatings[review.bank]) {
            bankRatings[review.bank] = { totalRating: 0, reviewCount: 0 };
        }
        bankRatings[review.bank].totalRating += parseInt(review.rating, 10);
        bankRatings[review.bank].reviewCount++;
    });

    const leaderboard = Object.entries(bankRatings)
        .map(([bank, data]) => ({
            bank,
            averageRating: parseFloat((data.totalRating / data.reviewCount).toFixed(1)),
        }))
        .sort((a, b) => b.averageRating - a.averageRating); // Sort descending by average rating

    // Assign ranks
    return leaderboard.map((item, index) => ({
        ...item,
        rank: index + 1,
    }));
}

/**
 * Guarda las evaluaciones de costos en el archivo JSON.
 */
async function saveCostReviews(reviewsToSave: CostReview[]) {
    try {
        await Deno.writeTextFile(COST_REVIEWS_FILE, JSON.stringify(reviewsToSave, null, 2));
    } catch (error) {
        console.error("Error saving cost reviews:", error);
    }
}

/**
 * Carga las evaluaciones de costos desde el archivo JSON.
 */
export async function loadCostReviews(): Promise<void> {
    try {
        const content = await Deno.readTextFile(COST_REVIEWS_FILE);
        const loadedReviews = JSON.parse(content);

        if (!Array.isArray(loadedReviews)) {
            console.error("Cost review file does not contain a valid array.");
            costReviews = [];
            return;
        }

        costReviews = loadedReviews;
        console.log(`Cost reviews loaded into memory: ${costReviews.length}`);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.warn(`Cost review file (${COST_REVIEWS_FILE}) not found. A new one will be created when the first review is saved.`);
        } else {
            console.error("Error loading cost reviews:", error);
        }
        costReviews = [];
    }
}

/**
 * Obtiene todas las evaluaciones de costos almacenadas en memoria.
 */
export function getAllCostReviews(): CostReview[] {
    return [...costReviews];
}

/**
 * Agrega una nueva evaluación de costos a la lista y la guarda en el archivo.
 */
export async function addCostReview(newReviewData: any): Promise<void> {
    const completeReview: CostReview = {
        id: crypto.randomUUID(),
        bank: newReviewData.banco,
        costRating: newReviewData.costRating,
        feeType: newReviewData.feeType || [],
        affordabilityComment: newReviewData.affordabilityComment,
        date: new Date().toLocaleString(),
        comparisonComment: newReviewData.comparisonComment || ''
    };

    costReviews.unshift(completeReview);
    await saveCostReviews(costReviews);
}

/**
 * Calcula los promedios de calificación de costos por banco.
 */
export function calculateAverageCostRatings(banksConfig: { name: string }[]): Record<string, { average: string; count: number }> {
    const averages: Record<string, { average: string; count: number }> = {};

    banksConfig.forEach(bank => {
        const bankReviews = costReviews.filter(r => r.bank === bank.name);
        if (bankReviews.length > 0) {
            const total = bankReviews.reduce((sum, r) => sum + parseInt(r.costRating, 10), 0);
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