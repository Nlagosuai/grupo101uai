import type { BankConfig } from './types.ts';

// Utilidad para guardar y cargar reseñas desde un archivo
export const DB_FILE = "./reviews.json";
export const DB_BENEFITS_FILE = "./benefits.json"; // File for storing monthly benefits

// Lista de bancos con logos oficiales actualizados
export const banks: BankConfig[] = [
    {
        name: "Banco de Chile",
        url: "https://www.bancochile.cl",
        icon: "/img/dechile.png"
    },
    {
        name: "BCI",
        url: "https://www.bci.cl",
        icon: "/img/bci.png"
    },
    {
        name: "Scotiabank",
        url: "https://www.scotiabankchile.cl",
        icon: "/img/scotiabank.png"
    },
    {
        name: "Banco Estado",
        url: "https://www.bancoestado.cl",
        icon: "/img/estado.png"
    },
    {
        name: "Banco Itaú",
        url: "https://www.itau.cl",
        icon: "/img/itau.png"
    },
    {
        name: "Banco Falabella",
        url: "https://www.bancofalabella.cl",
        icon: "/img/falabella.png"
    }
]; 