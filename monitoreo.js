    
async function verificarsantander(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`santander está en línea ✅`);
    } catch (error) {
        console.log(`santander está caída ❌`);
    }
}

async function verificarchile(url) {
    try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        console.log(`Banco de Chile está en línea ✅`);
    } catch (error) {
        console.log(`Banco de Chile está caída ❌`);
    }
}

async function verificarbci(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`bci está en línea ✅`);
    } catch (error) {
        console.log(`bci está caída ❌`);
    }
}

async function verificarestado(url) {
    
    try {
        const respuesta = await fetch(url, { method: 'HEAD'});
        console.log(`banco estado está en línea ✅`);
    } catch (error) {
        console.log(`banco estado está caída ❌`);
    }
}

function iniciarVerificacion() {
    verificarsantander('https://banco.santander.cl/personas');
    verificarchile('https://sitiospublicos.bancochile.cl/personas');
    verificarbci('https://www.bci.cl/personas');
    verificarestado('https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/home.html#/')
}
setInterval(iniciarVerificacion, 5000)



