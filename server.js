import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';
<<<<<<< HEAD
// Importamos WhatsApp, aunque nos enfocaremos en Email para esta prueba
=======
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
import { enviarWhatsApp } from './src/api/v1/services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 8000;

<<<<<<< HEAD
// Configuración del Polling y Alertas
const UMBRAL_MINIMO = 5.0; 
const INTERVALO_SEGUNDOS = 10; // <-- POLLING FIJO: Revisará la BD cada 10 segundos exactos

// Nuestro "marcapáginas" temporal
=======
const UMBRAL_MINIMO = 5.0;
const MIN_SEGUNDOS = 10;
const MAX_SEGUNDOS = 35;

>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
<<<<<<< HEAD
        console.log(`\n[${new Date().toLocaleTimeString()}] Buscando anomalías (Valor > ${UMBRAL_MINIMO}) en ${process.env.DB_TABLE}...`);
        
        // 1. Armamos la consulta para traer SOLO el último registro más reciente
=======
        console.log(`\nBuscando anomalías NUEVAS (Valor > ${UMBRAL_MINIMO}) en ${process.env.DB_TABLE}...`);
        
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
        let query = `
            SELECT TOP 1 Tag, Fecha, Valor 
            FROM dbo.${process.env.DB_TABLE}
            WHERE Valor > ${UMBRAL_MINIMO}
        `;

<<<<<<< HEAD
        // 2. Si ya leímos un dato antes, le decimos a SQL que solo traiga datos MÁS NUEVOS que ese
=======
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
        if (ultimaFechaNotificada) {
            query += ` AND Fecha > '${ultimaFechaNotificada.toISOString()}'`;
        }

<<<<<<< HEAD
        // Siempre ordenamos del más nuevo al más viejo
=======
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
        query += ` ORDER BY Fecha DESC`;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        // 3. Evaluamos si SQL encontró un dato nuevo
        if (dato) {
<<<<<<< HEAD
            console.log(`⚠️ ¡NUEVA FALLA DETECTADA! Tag: ${dato.Tag} | Valor: ${dato.Valor}`);
            
            // Actualizamos nuestro marcapáginas para no repetir este correo en el próximo ciclo
=======
            console.log(`¡NUEVA FALLA DETECTADA! Tag: ${dato.Tag} | Valor: ${dato.Valor}`);
            
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
            ultimaFechaNotificada = dato.Fecha;

            const responsables = await obtenerResponsablesTag(dato.Tag);

            if (responsables.length > 0) {
                console.log(`Notificando a ${responsables.length} responsables del área...`);

                for (const user of responsables) {
<<<<<<< HEAD
                    // PRUEBA EXCLUSIVA DE EMAIL:
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                    
                    // Si quieres probar WhatsApp después, descomenta esta línea:
                    // if (user.notificar_whatsapp && user.telefono) {
                    //     await enviarWhatsApp(user.telefono, user.nombre, dato.Tag, `Valor: ${dato.Valor}`);
                    // }
=======
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                    if (user.notificar_whatsapp && user.telefono) {
                        await enviarWhatsApp(user.telefono, user.nombre, dato.Tag, `Valor: ${dato.Valor}`);
                    }
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
                }
            } else {
                console.log(`Falla en ${dato.Tag}, pero no hay responsables asignados en la BD.`);
            }

        } else {
<<<<<<< HEAD
            console.log("Monitor activo. No hay registros nuevos que superen el umbral.");
=======
            console.log("Monitor activo. No hay alarmas nuevas desde la última revisión.");
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
        }

    } catch (error) {
        console.error("❌ ERROR TÉCNICO AL CONSULTAR BD:", error.message);
    } finally {
<<<<<<< HEAD
        // 4. EL MOTOR DEL POLLING FIJO
        setTimeout(() => monitorearPlanta(pool), INTERVALO_SEGUNDOS * 1000);
=======
        const tiempoEspera = Math.floor(Math.random() * (MAX_SEGUNDOS - MIN_SEGUNDOS + 1) + MIN_SEGUNDOS);
        console.log(`Esperando ${tiempoEspera} segundos para la próxima revisión...`);
        setTimeout(() => monitorearPlanta(pool), tiempoEspera * 1000);
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
    }
};

app.listen(PORT, async () => {
<<<<<<< HEAD
    console.log(`=========================================`);
    console.log(`🏭 Gateway IoT encendido (Modo: Producción)`);
    console.log(`⏱️ Polling configurado a: ${INTERVALO_SEGUNDOS} segundos`);
    console.log(`=========================================\n`);
    
    try {
        const pool = await getConnection();
        console.log(`✅ ¡Conectado con éxito a SQL Server! Iniciando monitoreo...\n`);
=======
    console.log(`Gateway IoT encendido (Modo: Producción 24/7)`);
    console.log(`Conectando a la planta...`);
    
    try {
        const pool = await getConnection();
        console.log(`¡Conectado con éxito! Iniciando el ciclo de monitoreo...\n`);
>>>>>>> f04c3f942204ba5b4399a202d6d8c9ff956a462b
        
        // Iniciamos el ciclo infinito
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\n❌ ERROR GRAVE DE CONEXIÓN A SQL:");
        console.error(error.message);
    }
});