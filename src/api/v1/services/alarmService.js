import { obtenerUltimoDatoHistorian } from '../models/masterModel.js';

const iniciarPruebaHistorian = async () => {
    console.log("Iniciando conexión de Historian...");

    try {
        const dato = await obtenerUltimoDatoHistorian();

        if (dato) {
            console.log("\n========================================");
            console.log("DATOS EXTRAÍDOS DE LA PLANTA");
            console.log("========================================");
            console.log(`Tag:   ${dato.Tag}`);
            console.log(`Fecha: ${dato.Fecha}`);
            console.log(`Valor: ${dato.Valor}`);
            console.log("========================================\n");
            
            console.log("Prueba superada. Ahora podemos conectar el Email o WhatsApp.");
        } else {
            console.log("Conectó, pero la tabla TagCems está vacía.");
        }
    } catch (error) {
        console.error("Falló la validación base:", error.message);
    }
};

export { iniciarPruebaHistorian };