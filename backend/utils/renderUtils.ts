import { banks } from '../config.ts';

/**
 * Convierte una calificación numérica en estrellas visuales.
 * @param rating La calificación numérica.
 * @param format 'html' para Font Awesome, 'pdf' para caracteres Unicode, o 'pdf_fallback' para no renderizar nada.
 */
export function renderStars(rating: number | string, format: 'html' | 'pdf' | 'pdf_fallback' = 'html'): string {
    if (format === 'pdf_fallback') return ''; // No renderizar estrellas si la fuente no es compatible

    const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating;
    const validatedRating = isNaN(ratingNum) ? 0 : Math.max(0, Math.min(5, ratingNum));
    
    let stars = '';
    const fullStar = format === 'pdf' ? '★' : '<i class="fas fa-star"></i>';
    const halfStar = format === 'pdf' ? '★' : '<i class="fas fa-star-half-alt"></i>'; // PDF doesn't have a great half-star, so we use a full one.
    const emptyStar = format === 'pdf' ? '☆' : '<i class="far fa-star"></i>';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= validatedRating) {
            stars += fullStar;
        } else if (i - 0.5 <= validatedRating) {
            stars += halfStar;
        } else {
            stars += emptyStar;
        }
    }
    return stars;
}

/**
 * Obtiene la URL del icono (logo) de un banco por su nombre.
 */
export function getBankImage(bankName: string): string {
    const bank = banks.find(b => b.name === bankName);
    // Devolver URL del icono o una imagen genérica como fallback
    return bank?.icon || 'https://via.placeholder.com/100x50?text=Bank';
} 