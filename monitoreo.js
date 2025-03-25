    
async function verificarsantander(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`santander esta en linea ✅`);
    } catch (error) {
        console.log(`santander esti caida ❌`);
    }
}

async function verificarchile(url) {
    try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        console.log(`Banco de Chile esta en linea ✅`);
    } catch (error) {
        console.log(`Banco de Chile esta caida ❌`);
    }
}

async function verificarbci(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`bci esta en linea ✅`);
    } catch (error) {
        console.log(`bci esta caida ❌`);
    }
}

async function verificarestado(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`banco estado esta en linea ✅`);
    } catch (error) {
        console.log(`banco estado esta caida ❌`);
    }
}

function iniciarVerificacion() {
    verificarsantander('https://banco.santander.cl/personas');
    verificarchile('https://sitiospublicos.bancochile.cl/personas');
    verificarbci('https://www.bci.cl/personas');
    verificarestado('https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/home.html#/')
}
setInterval(iniciarVerificacion, 5000)



