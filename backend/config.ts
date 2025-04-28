import type { BancoConfig } from './types.ts';

// Utilidad para guardar y cargar reseñas desde un archivo
export const DB_FILE = "./reviews.json";

// Lista de bancos con logos oficiales actualizados
export const bancos: BancoConfig[] = [
    {
        nombre: "Banco de Chile",
        url: "https://sitiospublicos.bancochile.cl/personas",
        icono: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Banco_de_Chile_Logo.png"
    },
    {
        nombre: "BCI",
        url: "https://www.bci.cl/personas",
        icono: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Bci_Logotype.svg"
    },
    {
        nombre: "Banco Estado",
        url: "https://www.bancoestado.cl",
        icono: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Logo_BancoEstado.svg"
    },
    {
        nombre: "Scotiabank",
        url: "https://www.scotiabank.cl",
        icono: "https://upload.wikimedia.org/wikipedia/commons/5/51/Logo_Scotiabank_%28Kanada%29.svg"
    },
    {
        nombre: "Banco Itaú",
        url: "https://www.itau.cl",
        icono: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banco_Ita%C3%BA_logo.svg/640px-Banco_Ita%C3%BA_logo.svg.png"
    },
    {
        nombre: "Banco Falabella",
        url: "https://www.bancofalabella.cl",
        icono: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logotipo_Banco_Falabella.svg"
    }
]; 