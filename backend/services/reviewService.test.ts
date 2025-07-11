// backend/services/reviewService.test.ts
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
import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.203.0/testing/asserts.ts";

// Mock para aislar dependencias de disco
const mockReviews = [
  { id: "1", banco: "Banco A", calificación: "4", comentario: "Muy lento el sitio", fecha: "2023-01-01", categorias: [] },
  { id: "2", banco: "Banco B", calificación: "5", comentario: "Fácil acceso", fecha: "2023-01-02", categorias: [] },
  { id: "3", banco: "Banco A", calificación: "2", comentario: "Error en transacción", fecha: "2023-01-03", categorias: [] },
  { id: "4", banco: "Banco C", calificación: "3", comentario: "Buen servicio", fecha: "2023-01-04", categorias: [] },
];

console.log("\n INICIANDO PRUEBAS UNITARIAS - BOT AUDITOR DE BANCOS");
console.log("=" .repeat(60));

// ===== PRUEBAS DE ASIGNACIÓN DE CATEGORÍAS =====
console.log("\n CATEGORÍA: Asignación de Categorías (Nicolas)");

Deno.test("assignCategoriesToReviews asigna categorías correctamente (Nicolas)", () => {
  console.log("   Probando: Asignación automática de categorías por palabras clave");
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

Deno.test("assignCategoriesToReviews maneja reseñas con categorías existentes (Nicolas)", () => {
  console.log("  🔍 Probando: Reseñas que ya tienen categorías asignadas");
  // Arrange
  const reviewsWithCategories = [
    { id: "1", banco: "Banco X", calificación: "4", comentario: "Cualquier cosa", fecha: "2023-01-01", categorias: ["Lentitud"] },
  ];
  // Act
  const result = assignCategoriesToReviews(reviewsWithCategories);
  // Assert
  assertEquals(result[0].categories, ["Lentitud"]);
  console.log("  ✅ RESULTADO: Categorías existentes preservadas");
});

Deno.test("assignCategoriesToReviews maneja reseñas inválidas (Nicolas)", () => {
  console.log("  🔍 Probando: Manejo de reseñas con datos inválidos");
  // Arrange
  const invalidReviews = [
    null,
    { id: "1", banco: "Banco X", calificación: "4", comentario: null, fecha: "2023-01-01" },
    { id: "2", banco: "Banco Y", calificación: "5", comentario: "", fecha: "2023-01-02" },
  ];
  // Act
  const result = assignCategoriesToReviews(invalidReviews);
  // Assert
  assertEquals(result.length, 3);
  console.log("  ✅ RESULTADO: Reseñas inválidas manejadas correctamente");
});

Deno.test("assignCategoriesToReviews maneja múltiples categorías (Nicolas)", () => {
  console.log("  🔍 Probando: Comentarios que activan múltiples categorías");
  // Arrange
  const multiCategoryReview = [
    { id: "1", banco: "Banco X", calificación: "3", comentario: "Lento acceso con errores", fecha: "2023-01-01", categorias: [] },
  ];
  // Act
  const result = assignCategoriesToReviews(multiCategoryReview);
  // Assert
  assertArrayIncludes(result[0].categories, ["Lentitud"]);
  assertArrayIncludes(result[0].categories, ["Problemas de Acceso"]);
  assertArrayIncludes(result[0].categories, ["Error en Transacción"]);
  console.log("  ✅ RESULTADO: Múltiples categorías asignadas correctamente");
});

Deno.test("assignCategoriesToReviews maneja reseña con calificación numérica (Camila)", () => {
  console.log("  🔍 Probando: Reseñas con calificación numérica en lugar de string");
  // Arrange
  const numericRatingReview = [
    { id: "1", banco: "Banco X", calificación: 4, comentario: "Muy segura la plataforma", fecha: "2023-01-01", categorias: [] },
  ];
  // Act
  const result = assignCategoriesToReviews(numericRatingReview);
  // Assert
  assertEquals(result[0].categories, ["Seguridad"]);
  console.log("  ✅ RESULTADO: Calificación numérica procesada correctamente");
});

Deno.test("assignCategoriesToReviews maneja reseña sin comentario (Nicolas)", () => {
  console.log("  🔍 Probando: Reseñas sin comentario (undefined)");
  // Arrange
  const reviewWithoutComment = [
    { id: "1", banco: "Banco X", calificación: "4", comentario: undefined, fecha: "2023-01-01", categorias: [] },
  ];
  // Act
  const result = assignCategoriesToReviews(reviewWithoutComment);
  // Assert
  assertEquals(result.length, 1);
  console.log("  ✅ RESULTADO: Reseña sin comentario manejada correctamente");
});

Deno.test("assignCategoriesToReviews maneja reseña con comentario no string (Camila)", () => {
  console.log("  🔍 Probando: Reseñas con comentario de tipo no string");
  // Arrange
  const reviewWithNonStringComment = [
    { id: "1", banco: "Banco X", calificación: "4", comentario: 123, fecha: "2023-01-01", categorias: [] },
  ];
  // Act
  const result = assignCategoriesToReviews(reviewWithNonStringComment);
  // Assert
  assertEquals(result.length, 1);
  console.log("  ✅ RESULTADO: Comentario no string manejado correctamente");
});

// ===== PRUEBAS DE GESTIÓN DE RESEÑAS =====
console.log("\n📋 CATEGORÍA: Gestión de Reseñas (Camila)");

Deno.test("getAllReviews retorna todas las reseñas cargadas (Camila)", () => {
  console.log("  🔍 Probando: Obtención de todas las reseñas en memoria");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  // Act
  const all = getAllReviews();
  // Assert
  assertEquals(all.length, 4);
  console.log("  ✅ RESULTADO: Todas las reseñas retornadas correctamente");
});

Deno.test("getReviewsByBank filtra reseñas por banco (Nicolas)", () => {
  console.log("  🔍 Probando: Filtrado de reseñas por nombre de banco");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  // Act
  const bancoA = getReviewsByBank("Banco A");
  // Assert
  assertEquals(bancoA.length, 2);
  assertArrayIncludes(bancoA.map(r => r.comment), ["Muy lento el sitio", "Error en transacción"]);
  console.log("  ✅ RESULTADO: Filtrado por banco funcionando correctamente");
});

Deno.test("getReviewsByBank retorna array vacío para banco inexistente (Camila)", () => {
  console.log("  🔍 Probando: Búsqueda de banco que no existe");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  // Act
  const inexistente = getReviewsByBank("Banco Inexistente");
  // Assert
  assertEquals(inexistente.length, 0);
  console.log("  ✅ RESULTADO: Array vacío retornado para banco inexistente");
});

// ===== PRUEBAS DE AGREGADO DE RESEÑAS =====
console.log("\n📋 CATEGORÍA: Agregado de Reseñas (Ambos)");

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

Deno.test("addReview maneja reseña sin categorías (Camila)", async () => {
  console.log("  🔍 Probando: Agregado de reseña sin categorías específicas");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco E",
    calificación: "4",
    comentario: "Servicio regular",
    // Sin categorías
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].categories, ["Otro"]);
  console.log("  ✅ RESULTADO: Categoría 'Otro' asignada por defecto");
});

Deno.test("addReview maneja sub-ratings (Nicolas)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con sub-calificaciones");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco F",
    calificación: "5",
    comentario: "Muy bueno",
    facilidadDeUso: "4",
    accesibilidad: "5",
    estabilidad: "3",
    precio: "4",
    serviciosAlUsuario: "5",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].subRatings?.facilidadDeUso, 4);
  assertEquals(all[0].subRatings?.accesibilidad, 5);
  console.log("  ✅ RESULTADO: Sub-ratings procesados correctamente");
});

Deno.test("addReview maneja calificación numérica (Nicolas)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con calificación numérica");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco G",
    calificación: 4.5,
    comentario: "Buen servicio",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].rating, 4.5);
  console.log("  ✅ RESULTADO: Calificación numérica procesada correctamente");
});

Deno.test("addReview maneja comentario vacío (Camila)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con comentario vacío");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco H",
    calificación: "3",
    comentario: "",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].comment, "");
  console.log("  ✅ RESULTADO: Comentario vacío manejado correctamente");
});

Deno.test("addReview maneja calificación como string vacío (Nicolas)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con calificación string vacío");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco J",
    calificación: "",
    comentario: "Sin calificación",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].rating, 0);
  console.log("  ✅ RESULTADO: Calificación vacía convertida a 0");
});

Deno.test("addReview maneja calificación como null (Camila)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con calificación null");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco K",
    calificación: null,
    comentario: "Sin calificación",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].rating, 0);
  console.log("  ✅ RESULTADO: Calificación null convertida a 0");
});

Deno.test("addReview maneja sub-ratings todos en cero (Nicolas)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con todos los sub-ratings en 0");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco I",
    calificación: "4",
    comentario: "Regular",
    facilidadDeUso: "0",
    accesibilidad: "0",
    estabilidad: "0",
    precio: "0",
    serviciosAlUsuario: "0",
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].subRatings, undefined);
  console.log("  ✅ RESULTADO: Sub-ratings en 0 no se incluyen");
});

Deno.test("addReview maneja categorías con traducción personalizada (Nicolas)", async () => {
  console.log("  🔍 Probando: Agregado de reseña con categoría personalizada");
  // Arrange
  __setReviewsForTest([]);
  const nueva = {
    banco: "Banco L",
    calificación: "4",
    comentario: "Bueno",
    categorías: ["Categoría Personalizada"],
  };
  // Act
  await addReview(nueva);
  // Assert
  const all = getAllReviews();
  assertEquals(all.length, 1);
  assertEquals(all[0].categories, ["Categoría Personalizada"]);
  console.log("  ✅ RESULTADO: Categoría personalizada preservada");
});

// ===== PRUEBAS DE ESTADÍSTICAS Y RANKINGS =====
console.log("\n📋 CATEGORÍA: Estadísticas y Rankings (Nicolas)");

Deno.test("calculateAverageRatings calcula promedios correctamente (Nicolas)", () => {
  console.log("  🔍 Probando: Cálculo de promedios de calificación por banco");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  const banksConfig = [
    { name: "Banco A" },
    { name: "Banco B" },
    { name: "Banco C" },
  ];
  // Act
  const averages = calculateAverageRatings(banksConfig);
  // Assert
  assertEquals(averages["Banco A"].count, 2);
  assertEquals(averages["Banco B"].count, 1);
  assertEquals(averages["Banco C"].count, 1);
  console.log("  ✅ RESULTADO: Promedios calculados correctamente");
});

Deno.test("calculateAverageRatings maneja bancos sin reseñas (Camila)", () => {
  console.log("  🔍 Probando: Cálculo de promedios para bancos sin reseñas");
  // Arrange
  __setReviewsForTest([]);
  const banksConfig = [
    { name: "Banco A" },
    { name: "Banco B" },
  ];
  // Act
  const averages = calculateAverageRatings(banksConfig);
  // Assert
  assertEquals(averages["Banco A"].count, 0);
  assertEquals(averages["Banco B"].count, 0);
  console.log("  ✅ RESULTADO: Bancos sin reseñas manejados correctamente");
});

Deno.test("getLeaderboardData genera ranking correcto (Camila)", () => {
  console.log("  🔍 Probando: Generación de leaderboard por rating promedio");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  // Act
  const leaderboard = getLeaderboardData("averageRating");
  // Assert
  // Verificar que retorna un array válido con rankings
  assertEquals(Array.isArray(leaderboard), true);
  assertEquals(leaderboard.length > 0, true);
  // Verificar que cada elemento tiene las propiedades esperadas
  leaderboard.forEach(item => {
    assertEquals(typeof item.bank, "string");
    assertEquals(typeof item.averageRating, "number");
    assertEquals(typeof item.rank, "number");
  });
  console.log("  ✅ RESULTADO: Leaderboard generado correctamente");
});

Deno.test("getLeaderboardData maneja array vacío (Nicolas)", () => {
  console.log("  🔍 Probando: Leaderboard con array de reseñas vacío");
  // Arrange
  __setReviewsForTest([]);
  // Act
  const leaderboard = getLeaderboardData();
  // Assert
  assertEquals(leaderboard.length, 0);
  console.log("  ✅ RESULTADO: Array vacío retornado para reseñas vacías");
});

Deno.test("getLeaderboardData maneja sortBy diferente (Camila)", () => {
  console.log("  🔍 Probando: Leaderboard ordenado por cantidad de reseñas");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  // Act
  const leaderboard = getLeaderboardData("reviewCount");
  // Assert
  assertEquals(Array.isArray(leaderboard), true);
  assertEquals(leaderboard.length > 0, true);
  console.log("  ✅ RESULTADO: Ordenamiento alternativo funcionando");
});

Deno.test("calculateReportStatistics calcula estadísticas correctamente (Nicolas)", () => {
  console.log("  🔍 Probando: Cálculo de estadísticas de reportes por banco");
  // Arrange
  __setReviewsForTest(assignCategoriesToReviews(mockReviews));
  const banksConfig = [
    { name: "Banco A" },
    { name: "Banco B" },
    { name: "Banco C" },
  ];
  // Act
  const stats = calculateReportStatistics(banksConfig);
  // Assert
  assertEquals(stats["Banco A"].totalReviews, 2);
  assertEquals(stats["Banco B"].totalReviews, 1);
  assertEquals(stats["Banco C"].totalReviews, 1);
  console.log("  ✅ RESULTADO: Estadísticas calculadas correctamente");
});

Deno.test("calculateReportStatistics maneja bancos sin reseñas (Camila)", () => {
  console.log("  🔍 Probando: Estadísticas para bancos sin reseñas");
  // Arrange
  __setReviewsForTest([]);
  const banksConfig = [
    { name: "Banco X" },
    { name: "Banco Y" },
  ];
  // Act
  const stats = calculateReportStatistics(banksConfig);
  // Assert
  assertEquals(stats["Banco X"].totalReviews, 0);
  assertEquals(stats["Banco X"].commonReport, "Sin reportes");
  assertEquals(stats["Banco Y"].totalReviews, 0);
  console.log("  ✅ RESULTADO: Bancos sin reseñas marcados como 'Sin reportes'");
});

Deno.test("calculateReportStatistics maneja reseñas sin categorías (Nicolas)", () => {
  console.log("  🔍 Probando: Estadísticas para reseñas sin categorías");
  // Arrange
  const reviewsWithoutCategories = [
    { id: "1", bank: "Banco X", rating: 4, comment: "Bueno", categories: [], date: "2023-01-01" },
    { id: "2", bank: "Banco X", rating: 3, comment: "Regular", categories: [], date: "2023-01-02" },
  ];
  __setReviewsForTest(reviewsWithoutCategories);
  const banksConfig = [{ name: "Banco X" }];
  // Act
  const stats = calculateReportStatistics(banksConfig);
  // Assert
  assertEquals(stats["Banco X"].totalReviews, 2);
  assertEquals(stats["Banco X"].commonReport, "Sin categoría específica");
  console.log("  ✅ RESULTADO: Reseñas sin categorías marcadas correctamente");
});

// ===== PRUEBAS DE CARGA DE ARCHIVOS =====
console.log("\n📋 CATEGORÍA: Carga de Archivos (Ambos)");

Deno.test("loadAndProcessReviews maneja archivo no encontrado (Camila)", async () => {
  console.log("  🔍 Probando: Manejo de archivo de reseñas inexistente");
  // Arrange - Simular que el archivo no existe
  const originalReadTextFile = Deno.readTextFile;
  Deno.readTextFile = async () => {
    throw new Deno.errors.NotFound("File not found");
  };
  
  // Act
  await loadAndProcessReviews();
  
  // Assert
  const reviews = getAllReviews();
  assertEquals(reviews.length, 0);
  
  // Restaurar función original
  Deno.readTextFile = originalReadTextFile;
  console.log("  ✅ RESULTADO: Archivo no encontrado manejado correctamente");
});

Deno.test("loadAndProcessReviews maneja archivo con datos inválidos (Nicolas)", async () => {
  console.log("  🔍 Probando: Manejo de archivo con JSON inválido");
  // Arrange - Simular archivo con datos inválidos
  const originalReadTextFile = Deno.readTextFile;
  Deno.readTextFile = async () => {
    return "invalid json data";
  };
  
  // Act
  await loadAndProcessReviews();
  
  // Assert
  const reviews = getAllReviews();
  assertEquals(reviews.length, 0);
  
  // Restaurar función original
  Deno.readTextFile = originalReadTextFile;
  console.log("  ✅ RESULTADO: JSON inválido manejado correctamente");
});

Deno.test("loadAndProcessReviews maneja archivo con array inválido (Camila)", async () => {
  console.log("  🔍 Probando: Manejo de archivo con objeto en lugar de array");
  // Arrange - Simular archivo con objeto en lugar de array
  const originalReadTextFile = Deno.readTextFile;
  Deno.readTextFile = async () => {
    return JSON.stringify({ notAnArray: true });
  };
  
  // Act
  await loadAndProcessReviews();
  
  // Assert
  const reviews = getAllReviews();
  assertEquals(reviews.length, 0);
  
  // Restaurar función original
  Deno.readTextFile = originalReadTextFile;
  console.log("  ✅ RESULTADO: Array inválido manejado correctamente");
});

console.log("\n" + "=" .repeat(60));
console.log("🎯 RESUMEN DE PRUEBAS:");
console.log("📋 Categorías probadas: 5");
console.log("🧪 Total de pruebas: 30");
console.log("👥 Participación: Nicolas (16), Camila (14)");
console.log("=" .repeat(60));

// Cobertura mínima: 80% sobre lógica de categorías, filtrado y agregado. Se recomienda correr:
// deno test --coverage=./coverage && deno coverage ./coverage --lcov > coverage.lcov
// y revisar el reporte con una herramienta compatible con lcov. 