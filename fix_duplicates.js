/**
 * Este script repara el archivo server.ts eliminando las funciones duplicadas
 * Ejecutar con: deno run --allow-read --allow-write fix_duplicates.js
 */

const filePath = "server.ts";

async function fixDuplicates() {
  try {
    // Leer el archivo server.ts
    const content = await Deno.readTextFile(filePath);
    
    // Buscar y eliminar funciones duplicadas
    
    // Eliminar la segunda instancia de obtenerEstados (línea 252+)
    let fixedContent = content.replace(
      /\/\/ Función para obtener el estado de todos los bancos\s+async function obtenerEstados\(\) \{\s+return await Promise\.all\(bancos\.map\(banco => verificarBanco\(banco\.nombre, banco\.url\)\)\);\s+\}/,
      "// La función obtenerEstados ya está definida arriba"
    );
    
    // Eliminar la segunda instancia de renderNavbar (línea 609+)
    fixedContent = fixedContent.replace(
      /\/\/ Función auxiliar para renderizar la barra de navegación\s+function renderNavbar\(\) \{\s+return [`\s\S]+?<\/script>\s+`;\s+\}/,
      "// La función renderNavbar ya está definida arriba"
    );
    
    // Eliminar la segunda instancia de renderStars (línea 2755+)
    fixedContent = fixedContent.replace(
      /\/\/ Función auxiliar para renderizar estrellas según la calificación\s+function renderStars\(rating\) \{\s+[\s\S]+?return stars;\s+\}/,
      "// La función renderStars ya está definida arriba"
    );
    
    // Eliminar la segunda instancia de obtenerImagenBanco (línea 2769+)
    fixedContent = fixedContent.replace(
      /\/\/ Arreglar la función para obtener la imagen del banco\s+function obtenerImagenBanco\(nombreBanco\) \{\s+[\s\S]+?return banco \? banco\.icono : 'https:\/\/via\.placeholder\.com\/64\?text=Banco';\s+\}/,
      "// La función obtenerImagenBanco ya está definida arriba"
    );
    
    // Escribir el contenido corregido de vuelta al archivo
    await Deno.writeTextFile(filePath + ".fixed", fixedContent);
    
    console.log("Archivo reparado y guardado como server.ts.fixed");
    console.log("Por favor, verifica el archivo y renómbralo a server.ts si es correcto");
  } catch (error) {
    console.error("Error:", error);
  }
}

fixDuplicates(); 