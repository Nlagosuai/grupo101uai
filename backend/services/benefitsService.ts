// Definición de tipos para beneficios
interface Benefit {
  id: string;
  bank: string;
  name: string;
  description: string;
  category: string;
  validDays: string[];
}

interface MonthlyBenefits {
  month: number;
  year: number;
  benefits: Benefit[];
}

// Variable para almacenar los beneficios en memoria
let currentBenefits: MonthlyBenefits | null = null;

// ============= CONFIGURACIÓN DE BENEFICIOS MENSUALES =============
// Para actualizar los beneficios cada mes, simplemente modifica este objeto
// con los nuevos beneficios o crea un nuevo objeto para el mes actual
// ================================================================

// Beneficios para Mayo 2024
const benefits_2024_05: MonthlyBenefits = {
  month: 5,
  year: 2024,
  benefits: [
    {
      id: "1",
      bank: "Banco de Chile",
      name: "Descuento en Dunkin Donuts",
      description: "30% de descuento en Dunkin Donuts los lunes y miércoles",
      category: "Comida",
      validDays: ["Lunes", "Miércoles"]
    },
    {
      id: "2",
      bank: "Banco de Chile",
      name: "Descuento en Uber Eats",
      description: "30% de descuento en restaurantes a través de Uber Eats los miércoles",
      category: "Comida",
      validDays: ["Miércoles"]
    },
    {
      id: "3",
      bank: "BCI",
      name: "Descuento en Starbucks",
      description: "30% de descuento en Starbucks los lunes",
      category: "Comida",
      validDays: ["Lunes"]
    },
    {
      id: "4",
      bank: "BCI",
      name: "Descuento en Burger King",
      description: "40% de descuento en Burger King los lunes",
      category: "Comida",
      validDays: ["Lunes"]
    },
    {
      id: "5",
      bank: "Banco Estado",
      name: "Cuotas sin interés en JetSmart",
      description: "6 a 12 cuotas sin interés en JetSmart",
      category: "Viajes",
      validDays: ["Todos los días"]
    },
    {
      id: "6",
      bank: "Banco Estado",
      name: "Descuento en Juan Maestro",
      description: "30% de descuento en Juan Maestro los martes",
      category: "Comida",
      validDays: ["Martes"]
    },
    {
      id: "7",
      bank: "Scotiabank",
      name: "Descuento en estacionamiento aeropuerto",
      description: "40% de descuento en estacionamiento del aeropuerto todos los días",
      category: "Transporte",
      validDays: ["Todos los días"]
    },
    {
      id: "8",
      bank: "Scotiabank",
      name: "Descuento en PedidosYa",
      description: "30% de descuento en PedidosYa los miércoles",
      category: "Comida",
      validDays: ["Miércoles"]
    },
    {
      id: "9",
      bank: "Banco Itaú",
      name: "Descuento en Viña Undurraga",
      description: "55% de descuento en Viña Undurraga los viernes",
      category: "Entretenimiento",
      validDays: ["Viernes"]
    },
    {
      id: "10",
      bank: "Banco Itaú",
      name: "Descuento en la CAV",
      description: "30% de descuento en la CAV los lunes",
      category: "Compras",
      validDays: ["Lunes"]
    },
    {
      id: "11",
      bank: "Banco Falabella",
      name: "Descuento en Domino's Pizza",
      description: "40% de descuento en Domino's Pizza los miércoles",
      category: "Comida",
      validDays: ["Miércoles"]
    },
    {
      id: "12",
      bank: "Banco Falabella",
      name: "Descuento en Palumbo",
      description: "40% de descuento en Palumbo los miércoles",
      category: "Comida",
      validDays: ["Miércoles"]
    }
  ]
};

// ============= CATÁLOGO DE BENEFICIOS POR MES Y AÑO =============
// Agrega aquí los beneficios de cada mes
// Formato: benefits_YYYY_MM donde YYYY=año y MM=mes (con cero inicial si es necesario)
// ================================================================

const benefitsCatalog: Record<string, MonthlyBenefits> = {
  "2024_05": benefits_2024_05,
  // Agregar futuros meses aquí:
  // "2024_06": benefits_2024_06,
  // "2024_07": benefits_2024_07,
};

/**
 * Obtiene el objeto de beneficios para un mes y año específicos
 */
function getBenefitsForMonth(month: number, year: number): MonthlyBenefits | null {
  // Formatear mes y año al formato del catálogo
  const monthKey = month.toString().padStart(2, '0');
  const yearKey = year.toString();
  const key = `${yearKey}_${monthKey}`;
  
  return benefitsCatalog[key] || null;
}

/**
 * Carga los beneficios del mes especificado
 */
export async function loadBenefitsForMonth(month: number, year: number): Promise<MonthlyBenefits> {
  try {
    // Buscar beneficios para el mes solicitado
    const monthlyBenefits = getBenefitsForMonth(month, year);
    
    if (monthlyBenefits) {
      currentBenefits = monthlyBenefits;
      console.log(`Beneficios cargados para ${month}/${year}:`, currentBenefits.benefits.length);
      return currentBenefits;
    } else {
      // Si no hay beneficios para el mes solicitado, usar el mes más reciente disponible
      const currentDate = new Date();
      const currentYearMonth = `${currentDate.getFullYear()}_${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Obtener todas las claves del catálogo y ordenarlas
      const availableMonths = Object.keys(benefitsCatalog).sort().reverse();
      
      if (availableMonths.length > 0) {
        // Usar el mes más reciente
        const latestMonth = availableMonths[0];
        console.log(`No hay beneficios disponibles para ${month}/${year}, usando los de ${latestMonth}`);
        currentBenefits = benefitsCatalog[latestMonth];
        return currentBenefits;
      }
      
      // Si no hay ningún mes disponible, devolver un objeto vacío
      console.warn(`No hay beneficios disponibles en el catálogo`);
      return {
        month,
        year,
        benefits: []
      };
    }
  } catch (error) {
    console.error(`Error al cargar beneficios para ${month}/${year}:`, error.message);
    return {
      month,
      year,
      benefits: []
    };
  }
}

/**
 * Obtiene todos los beneficios del mes actual
 */
export async function getAllBenefits(): Promise<Benefit[]> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
  const currentYear = currentDate.getFullYear();

  // Si no hay beneficios cargados o son de otro mes, cargarlos
  if (!currentBenefits || currentBenefits.month !== currentMonth || currentBenefits.year !== currentYear) {
    await loadBenefitsForMonth(currentMonth, currentYear);
  }

  return currentBenefits?.benefits || [];
}

/**
 * Obtiene los beneficios de un banco específico de todos los tiempos.
 */
export function getBenefitsByBank(bankName: string): Benefit[] {
  const allBenefits: Benefit[] = [];

  // Recorrer todo el catálogo y acumular beneficios para el banco
  for (const monthKey in benefitsCatalog) {
    const monthlyBenefits = benefitsCatalog[monthKey].benefits;
    const bankBenefits = monthlyBenefits.filter(
      benefit => benefit.bank.toLowerCase() === bankName.toLowerCase()
    );
    allBenefits.push(...bankBenefits);
  }

  return allBenefits;
}

/**
 * Carga los beneficios inicialmente
 */
export async function initializeBenefits(): Promise<void> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  await loadBenefitsForMonth(currentMonth, currentYear);
  console.log("Beneficios inicializados.");
}

/**
 * Instrucciones para actualizar los beneficios mensuales:
 * 
 * 1. Crear un nuevo objeto de beneficios para el mes siguiente (usar el mismo formato que los objetos existentes)
 * 2. Añadir el nuevo objeto al catálogo de beneficios (benefitsCatalog)
 * 3. Reiniciar el servidor para que los cambios surtan efecto
 */ 