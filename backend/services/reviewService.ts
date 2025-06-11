import { DB_FILE } from '../config.ts';
import type { Review as Reseña } from '../types.ts';
import type { Review } from '../types.ts';
import { banks } from '../config.ts';

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
 * Obtiene todas las reseñas para un banco específico.
 */
export function getReviewsByBank(bankName: string): Review[] {
    return reviews.filter(review => review.bank === bankName);
}

/**
 * Agrega una nueva reseña a la lista y la guarda en el archivo.
 * Expects the incoming object to potentially use Spanish keys from the form.
 */
export async function addReview(newReviewData: any): Promise<void> {
    // Mapeo de sub-calificaciones
    const subRatings = {
        facilidadDeUso: newReviewData.facilidadDeUso ? parseInt(newReviewData.facilidadDeUso, 10) : 0,
        accesibilidad: newReviewData.accesibilidad ? parseInt(newReviewData.accesibilidad, 10) : 0,
        estabilidad: newReviewData.estabilidad ? parseInt(newReviewData.estabilidad, 10) : 0,
        precio: newReviewData.precio ? parseInt(newReviewData.precio, 10) : 0,
        serviciosAlUsuario: newReviewData.serviciosAlUsuario ? parseInt(newReviewData.serviciosAlUsuario, 10) : 0,
    };

    const completeReview: Review = {
        id: crypto.randomUUID(),
        bank: newReviewData.banco,
        rating: newReviewData.calificación ? parseFloat(newReviewData.calificación) : 0,
        comment: newReviewData.comentario || '',
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
            : ['Otro'],
        subRatings: (Object.values(subRatings).some(r => r > 0)) ? subRatings : undefined
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
export function calculateAverageRatings(banksConfig: { name: string }[]): Record<string, { average: number; count: number }> {
    const averages: Record<string, { average: number; count: number }> = {};

    banksConfig.forEach(bank => {
        const bankReviews = reviews.filter(r => r.bank === bank.name);
        if (bankReviews.length > 0) {
            const total = bankReviews.reduce((sum, r) => sum + r.rating, 0);
            averages[bank.name] = {
                average: total / bankReviews.length,
                count: bankReviews.length
            };
        } else {
            averages[bank.name] = {
                average: 0.0,
                count: 0
            };
        }
    });

    return averages;
}

/**
 * Generates leaderboard data based on average review scores.
 * @param sortBy The category to sort the leaderboard by. Defaults to 'averageRating'.
 */
export function getLeaderboardData(sortBy: string = 'averageRating'): { 
    bank: string; 
    averageRating: number; 
    rank: number;
    subRatings: {
        facilidadDeUso: number;
        accesibilidad: number;
        estabilidad: number;
        precio: number;
        serviciosAlUsuario: number;
    };
    reviewCount: number;
}[] {
    if (!reviews || reviews.length === 0) {
        return [];
    }

    const bankRatings: { [key: string]: { 
        totalRating: number; 
        reviewCount: number;
        subRatingTotals: {
            facilidadDeUso: number;
            accesibilidad: number;
            estabilidad: number;
            precio: number;
            serviciosAlUsuario: number;
        };
        subRatingCounts: {
            facilidadDeUso: number;
            accesibilidad: number;
            estabilidad: number;
            precio: number;
            serviciosAlUsuario: number;
        };
    } } = {};

    // Initialize all banks from config to ensure they appear even with 0 reviews
    for (const bank of banks) {
        bankRatings[bank.name] = { 
            totalRating: 0, 
            reviewCount: 0,
            subRatingTotals: { facilidadDeUso: 0, accesibilidad: 0, estabilidad: 0, precio: 0, serviciosAlUsuario: 0 },
            subRatingCounts: { facilidadDeUso: 0, accesibilidad: 0, estabilidad: 0, precio: 0, serviciosAlUsuario: 0 }
        };
    }

    // Populate with data from existing reviews
    reviews.forEach(review => {
        if (bankRatings[review.bank]) {
            bankRatings[review.bank].totalRating += review.rating;
            bankRatings[review.bank].reviewCount++;
    
            if (review.subRatings) {
                for (const [key, value] of Object.entries(review.subRatings)) {
                    if (value > 0) {
                        (bankRatings[review.bank].subRatingTotals as any)[key] += value;
                        (bankRatings[review.bank].subRatingCounts as any)[key]++;
                    }
                }
            }
        }
    });

    const aggregatedData = Object.keys(bankRatings).map(bank => {
        const data = bankRatings[bank];
        const subRatingsAvg = {
            facilidadDeUso: data.subRatingCounts.facilidadDeUso > 0 ? data.subRatingTotals.facilidadDeUso / data.subRatingCounts.facilidadDeUso : 0,
            accesibilidad: data.subRatingCounts.accesibilidad > 0 ? data.subRatingTotals.accesibilidad / data.subRatingCounts.accesibilidad : 0,
            estabilidad: data.subRatingCounts.estabilidad > 0 ? data.subRatingTotals.estabilidad / data.subRatingCounts.estabilidad : 0,
            precio: data.subRatingCounts.precio > 0 ? data.subRatingTotals.precio / data.subRatingCounts.precio : 0,
            serviciosAlUsuario: data.subRatingCounts.serviciosAlUsuario > 0 ? data.subRatingTotals.serviciosAlUsuario / data.subRatingCounts.serviciosAlUsuario : 0,
        };
        return {
            bank,
            averageRating: data.reviewCount > 0 ? data.totalRating / data.reviewCount : 0,
            subRatings: subRatingsAvg,
            reviewCount: data.reviewCount,
        };
    });

    // Rank the banks based on the selected category
    const leaderboard = aggregatedData.sort((a, b) => {
        const valA = sortBy === 'averageRating' ? a.averageRating : (a.subRatings as any)[sortBy] || 0;
        const valB = sortBy === 'averageRating' ? b.averageRating : (b.subRatings as any)[sortBy] || 0;
        
        // Primary sort by the selected rating
        if (valB !== valA) {
            return valB - valA;
        }
        
        // Tie-breaker: sort by main average rating if sub-ratings are equal
        if (a.averageRating !== b.averageRating) {
            return b.averageRating - a.averageRating;
        }

        // Final tie-breaker: sort by review count
        return b.reviewCount - a.reviewCount;
    });

    // Assign ranks
    return leaderboard.map((bankData, index) => ({
        ...bankData,
        rank: index + 1,
    }));
} 