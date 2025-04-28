import { bancos } from '../config.ts';

/**
 * Convierte una calificación numérica en estrellas visuales (HTML).
 */
export function renderStars(rating: number | string): string {
    let stars = '';
    // Asegurarse de que la calificación sea un número, manejar strings
    const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating;

    // Validar que sea un número entre 0 y 5
    const validatedRating = isNaN(ratingNum) ? 0 : Math.max(0, Math.min(5, ratingNum));
    const fullStars = Math.floor(validatedRating);
    // Podríamos añadir lógica para medias estrellas si quisiéramos
    // const hasHalfStar = validatedRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '★'; // Estrella llena
        } else {
            stars += '☆'; // Estrella vacía
        }
    }
    return stars;
}

/**
 * Obtiene la URL del icono (logo) de un banco por su nombre.
 */
export function obtenerImagenBanco(nombreBanco: string): string {
    const banco = bancos.find(b => b.nombre === nombreBanco);
    // Devolver URL del icono o una imagen genérica como fallback
    return banco?.icono || 'https://via.placeholder.com/100x50?text=Banco';
} 