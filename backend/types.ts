export interface Reseña {
    banco: string;
    calificación: string;
    comentario: string;
    fecha: string;
    categorías: string[];
}

export interface BancoInfo {
    nombre: string;
    url: string;
    tiempoRespuesta: string;
    codigoEstado: number;
    status: string;
    estado: "activo" | "inactivo";
    icono: string;
}

export interface BancoConfig {
    nombre: string;
    url: string;
    icono: string;
} 