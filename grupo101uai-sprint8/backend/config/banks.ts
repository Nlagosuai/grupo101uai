// Definición de bancos
interface Bank {
  name: string;
  active: boolean;
}

// Lista de bancos disponibles
const banks: Bank[] = [
  { name: "Banco de Chile", active: true },
  { name: "Banco Estado", active: true },
  { name: "Scotiabank", active: true },
  { name: "BCI", active: true },
  { name: "Banco Itaú", active: true },
  { name: "Banco Falabella", active: true },
  { name: "Banco Santander", active: true },
  { name: "Banco Security", active: true }
];

/**
 * Obtiene todos los bancos
 */
export function getAllBanks(): Bank[] {
  return [...banks];
}

/**
 * Obtiene solo los bancos activos
 */
export function getActiveBanks(): Bank[] {
  return banks.filter(bank => bank.active);
}

/**
 * Busca un banco por su nombre
 */
export function getBankConfig(bankName: string): Bank | undefined {
  return banks.find(bank => bank.name.toLowerCase() === bankName.toLowerCase());
} 