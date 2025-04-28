/**
 * Esta función verifica si el Banco de Chile está en línea.
 * Intenta hacer una conexión simple con el sitio web del banco
 * y nos informa si está funcionando o si presenta problemas.
 * Es como un vigilante que comprueba si la puerta del banco está abierta o cerrada.
 */
async function verificarchile(url) {
    try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        console.log(`Banco de Chile esta en linea ✅`);
    } catch (error) {
        console.log(`Banco de Chile esta caida ❌`);
    }
}

/**
 * Esta función verifica si el BCI está en línea.
 * Funciona igual que la función para verificar el Banco de Chile,
 * pero enfocándose en el sitio web del BCI.
 * Es otro vigilante que se encarga específicamente de revisar este banco.
 */
async function verificarbci(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`bci esta en linea ✅`);
    } catch (error) {
        console.log(`bci esta caida ❌`);
    }
}

/**
 * Esta función verifica si el Banco Estado está en línea.
 * Sigue el mismo proceso que las otras funciones de verificación,
 * comprobando la disponibilidad del sitio web del Banco Estado.
 * Es nuestro tercer vigilante, responsable de monitorear este banco.
 */
async function verificarestado(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`banco estado esta en linea ✅`);
    } catch (error) {
        console.log(`banco estado esta caida ❌`);
    }
}

/**
 * Esta función inicia el proceso de verificación para todos los bancos.
 * Es como el supervisor que le dice a cada vigilante que comience su turno.
 * Llama a las funciones individuales para verificar cada banco
 * y les proporciona las URLs que deben revisar.
 */
function iniciarVerificacion() {
    verificarchile('https://sitiospublicos.bancochile.cl/personas');
    verificarbci('https://www.bci.cl/personas');
    verificarestado('https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/home.html#/')
}

/**
 * Esta instrucción establece que la verificación se ejecute cada 5 segundos.
 * Es como programar un reloj para que suene periódicamente,
 * recordándole a los vigilantes que deben hacer sus rondas regularmente.
 */
setInterval(iniciarVerificacion, 5000)



