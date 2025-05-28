import type { BankConfig } from './types.ts';

// Utilidad para guardar y cargar reseñas desde un archivo
export const DB_FILE = "./reviews.json";
export const DB_BENEFITS_FILE = "./benefits.json"; // File for storing monthly benefits

// Lista de bancos con logos oficiales actualizados
export const banks: BankConfig[] = [
    {
        name: "Banco de Chile",
        url: "https://sitiospublicos.bancochile.cl/personas",
        icon: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Banco_de_Chile_Logo.png"
    },
    {
        name: "BCI",
        url: "https://www.bci.cl/personas",
        icon: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Bci_Logotype.svg"
    },
    {
        name: "Banco Estado",
        url: "https://www.bancoestado.cl",
        icon: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Logo_BancoEstado.svg"
    },
    {
        name: "Scotiabank",
        url: "https://www.scotiabank.cl",
        icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Logo_Scotiabank_%28Kanada%29.svg"
    },
    {
        name: "Banco Itaú",
        url: "https://www.itau.cl",
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banco_Ita%C3%BA_logo.svg/640px-Banco_Ita%C3%BA_logo.svg.png"
    },
    {
        name: "Banco Falabella",
        url: "https://www.bancofalabella.cl",
        icon: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logotipo_Banco_Falabella.svg"
    }
]; 