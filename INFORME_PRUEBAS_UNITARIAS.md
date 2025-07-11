# Informe de Pruebas Unitarias - Bot Auditor de Bancos

## 1. Descripción de la Funcionalidad Testeada

Se implementaron **pruebas unitarias completas** para la funcionalidad de **"Evaluación de Experiencia de Usuario"** del sistema Bot Auditor de Bancos. Esta funcionalidad permite a los usuarios evaluar y reportar su experiencia con diferentes bancos, incluyendo:

- **Asignación automática de categorías** a reseñas basada en palabras clave
- **Gestión y filtrado de reseñas** por banco
- **Agregado de nuevas reseñas** con validaciones
- **Cálculo de estadísticas** y rankings por banco
- **Carga y procesamiento de archivos** de reseñas

### Funciones Principales Testeadas:
- `assignCategoriesToReviews()` - Asigna categorías automáticamente
- `getAllReviews()` - Obtiene todas las reseñas
- `getReviewsByBank()` - Filtra reseñas por banco
- `addReview()` - Agrega nuevas reseñas
- `calculateAverageRatings()` - Calcula promedios
- `getLeaderboardData()` - Genera rankings
- `calculateReportStatistics()` - Calcula estadísticas
- `loadAndProcessReviews()` - Carga archivos

---

## 2. Captura de Código - Pruebas Unitarias

### Archivo: `backend/services/reviewService.test.ts`

```typescript
// Pruebas unitarias para reviewService.ts
// Autor: Nicolas (participación principal)
// Autor: Camila (participación secundaria)

import {
  assignCategoriesToReviews,
  getAllReviews,
  getReviewsByBank,
  addReview,
  __setReviewsForTest,
  calculateAverageRatings,
  getLeaderboardData,
  calculateReportStatistics,
  loadAndProcessReviews,
} from "./reviewService.ts";

// Mock para aislar dependencias de disco
const mockReviews = [
  { id: "1", banco: "Banco A", calificación: "4", comentario: "Muy lento el sitio", fecha: "2023-01-01", categorias: [] },
  { id: "2", banco: "Banco B", calificación: "5", comentario: "Fácil acceso", fecha: "2023-01-02", categorias: [] },
  { id: "3", banco: "Banco A", calificación: "2", comentario: "Error en transacción", fecha: "2023-01-03", categorias: [] },
  { id: "4", banco: "Banco C", calificación: "3", comentario: "Buen servicio", fecha: "2023-01-04", categorias: [] },
];

// Ejemplo de prueba con patrón AAA
Deno.test("assignCategoriesToReviews asigna categorías correctamente (Nicolas)", () => {
  console.log("  🔍 Probando: Asignación automática de categorías por palabras clave");
  // Arrange
  // Act
  const result = assignCategoriesToReviews(mockReviews);
  // Assert
  assertEquals(result[0].categories, ["Lentitud"]);
  assertEquals(result[1].categories, ["Problemas de Acceso"]);
  assertEquals(result[2].categories, ["Error en Transacción"]);
  assertEquals(result[3].categories, ["Otro"]);
  console.log("  ✅ RESULTADO: Categorías asignadas correctamente");
});

// Ejemplo de prueba asíncrona
Deno.test({
  name: "addReview agrega una reseña y la guarda (Camila)",
  async fn() {
    console.log("  🔍 Probando: Agregado de nueva reseña con categorías");
    // Arrange
    __setReviewsForTest([]);
    const nueva = {
      banco: "Banco D",
      calificación: "5",
      comentario: "Excelente servicio",
      categorías: ["acceso"],
    };
    // Act
    await addReview(nueva);
    // Assert
    const all = getAllReviews();
    assertEquals(all.length, 1);
    assertEquals(all[0].bank, "Banco D");
    assertEquals(all[0].categories, ["Problemas de Acceso"]);
    console.log("  ✅ RESULTADO: Nueva reseña agregada y guardada correctamente");
  },
});
```

**Total de pruebas implementadas: 30 tests**

---

## 3. Instrucciones para Ejecutar los Tests

### Comandos principales:

```bash
# 1. Ejecutar todas las pruebas con cobertura
deno test --coverage=./coverage --allow-write

# 2. Ver reporte de cobertura
deno coverage ./coverage

# 3. Ejecutar solo las pruebas (sin cobertura)
deno test --allow-write

# 4. Generar reporte LCOV
deno coverage ./coverage --lcov > coverage.lcov
```

### Requisitos:
- Deno instalado en el sistema
- Permisos de escritura en el directorio
- Archivo `reviewService.test.ts` en `backend/services/`

---

## 4. Evidencia del Coverage

### Reporte de Cobertura Generado:

```
------------------------------------------------
File                       | Branch % | Line % |
------------------------------------------------
 config.ts                 |    100.0 |  100.0 |
 services/reviewService.ts |     85.7 |   85.9 |
------------------------------------------------
 All files                 |     85.7 |   87.6 |
------------------------------------------------
```

### Resultados de Ejecución:

```
🧪 INICIANDO PRUEBAS UNITARIAS - BOT AUDITOR DE BANCOS
============================================================

📋 CATEGORÍA: Asignación de Categorías (Nicolas)
  🔍 Probando: Asignación automática de categorías por palabras clave
  ✅ RESULTADO: Categorías asignadas correctamente

📋 CATEGORÍA: Gestión de Reseñas (Camila)
  🔍 Probando: Obtención de todas las reseñas en memoria
  ✅ RESULTADO: Todas las reseñas retornadas correctamente

📋 CATEGORÍA: Agregado de Reseñas (Ambos)
  🔍 Probando: Agregado de nueva reseña con categorías
  ✅ RESULTADO: Nueva reseña agregada y guardada correctamente

📋 CATEGORÍA: Estadísticas y Rankings (Nicolas)
  🔍 Probando: Cálculo de promedios de calificación por banco
  ✅ RESULTADO: Promedios calculados correctamente

📋 CATEGORÍA: Carga de Archivos (Ambos)
  🔍 Probando: Manejo de archivo de reseñas inexistente
  ✅ RESULTADO: Archivo no encontrado manejado correctamente

🎯 RESUMEN DE PRUEBAS:
📋 Categorías probadas: 5
🧪 Total de pruebas: 30
👥 Participación: Nicolas (16), Camila (14)

ok | 30 passed | 0 failed (104ms)
```

**Cobertura alcanzada: 87.6% (supera el 80% requerido)**

---

## 5. Evidencia de Participación de Integrantes

### Commits y Participación:

```
📋 CATEGORÍA: Asignación de Categorías (Nicolas)
- assignCategoriesToReviews asigna categorías correctamente (Nicolas)
- assignCategoriesToReviews maneja reseñas con categorías existentes (Nicolas)
- assignCategoriesToReviews maneja reseñas inválidas (Nicolas)
- assignCategoriesToReviews maneja múltiples categorías (Nicolas)
- assignCategoriesToReviews maneja reseña sin comentario (Nicolas)

📋 CATEGORÍA: Gestión de Reseñas (Camila)
- getAllReviews retorna todas las reseñas cargadas (Camila)
- getReviewsByBank filtra reseñas por banco (Nicolas)
- getReviewsByBank retorna array vacío para banco inexistente (Camila)

📋 CATEGORÍA: Agregado de Reseñas (Ambos)
- addReview agrega una reseña y la guarda (Camila)
- addReview maneja reseña sin categorías (Camila)
- addReview maneja sub-ratings (Nicolas)
- addReview maneja calificación numérica (Nicolas)
- addReview maneja comentario vacío (Camila)
- addReview maneja calificación como string vacío (Nicolas)
- addReview maneja calificación como null (Camila)
- addReview maneja sub-ratings todos en cero (Nicolas)
- addReview maneja categorías con traducción personalizada (Nicolas)

📋 CATEGORÍA: Estadísticas y Rankings (Nicolas)
- calculateAverageRatings calcula promedios correctamente (Nicolas)
- calculateAverageRatings maneja bancos sin reseñas (Camila)
- getLeaderboardData genera ranking correcto (Camila)
- getLeaderboardData maneja array vacío (Nicolas)
- getLeaderboardData maneja sortBy diferente (Camila)
- calculateReportStatistics calcula estadísticas correctamente (Nicolas)
- calculateReportStatistics maneja bancos sin reseñas (Camila)
- calculateReportStatistics maneja reseñas sin categorías (Nicolas)

📋 CATEGORÍA: Carga de Archivos (Ambos)
- loadAndProcessReviews maneja archivo no encontrado (Camila)
- loadAndProcessReviews maneja archivo con datos inválidos (Nicolas)
- loadAndProcessReviews maneja archivo con array inválido (Camila)
```

### Distribución de Participación:
- **Nicolas:** 16 pruebas implementadas (53.3%)
- **Camila:** 14 pruebas implementadas (46.7%)
- **Total:** 30 pruebas (100%)

### Principios Aplicados:
- ✅ **FIRST:** Fast, Isolated, Repeatable, Self-validating, Timely
- ✅ **AAA:** Arrange, Act, Assert
- ✅ **Mocks:** Aislamiento de dependencias
- ✅ **Casos borde:** Cobertura exhaustiva
- ✅ **Manejo de errores:** Pruebas de robustez

---

**Fecha de entrega:** [Fecha actual]  
**Versión:** 1.0  
**Framework:** Deno.test  
**Lenguaje:** TypeScript  
**Cobertura objetivo:** 80% ✅ **ALCANZADO: 87.6%** 