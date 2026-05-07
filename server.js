import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';
// Importamos WhatsApp, aunque nos enfocaremos en Email para esta prueba
import { enviarWhatsApp } from './src/api/v1/services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Configuración del Polling y Alertas
const UMBRAL_MINIMO = 5.0; 
const INTERVALO_SEGUNDOS = 10; // <-- POLLING FIJO: Revisará la BD cada 10 segundos exactos

// Nuestro "marcapáginas" temporal
let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Buscando anomalías (Valor > ${UMBRAL_MINIMO}) en ${process.env.DB_TABLE}...`);
        
        // 1. Armamos la consulta para traer SOLO el último registro más reciente
        let query = `
            SELECT TOP 1 Tag, Fecha, Valor 
            FROM dbo.${process.env.DB_TABLE}
            WHERE Valor > ${UMBRAL_MINIMO}
        `;

        // 2. Si ya leímos un dato antes, le decimos a SQL que solo traiga datos MÁS NUEVOS que ese
        if (ultimaFechaNotificada) {
            query += ` AND Fecha > '${ultimaFechaNotificada.toISOString()}'`;
        }

        // Siempre ordenamos del más nuevo al más viejo
        query += ` ORDER BY Fecha DESC`;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        // 3. Evaluamos si SQL encontró un dato nuevo
        if (dato) {
            console.log(`⚠️ ¡NUEVA FALLA DETECTADA! Tag: ${dato.Tag} | Valor: ${dato.Valor}`);
            
            // Actualizamos nuestro marcapáginas para no repetir este correo en el próximo ciclo
            ultimaFechaNotificada = dato.Fecha;

            const responsables = await obtenerResponsablesTag(dato.Tag);

            if (responsables.length > 0) {
                console.log(`Notificando a ${responsables.length} responsables del área...`);

                for (const user of responsables) {
                    // PRUEBA EXCLUSIVA DE EMAIL:
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                    
                    // Si quieres probar WhatsApp después, descomenta esta línea:
                    // if (user.notificar_whatsapp && user.telefono) {
                    //     await enviarWhatsApp(user.telefono, user.nombre, dato.Tag, `Valor: ${dato.Valor}`);
                    // }
                }
            } else {
                console.log(`Falla en ${dato.Tag}, pero no hay responsables asignados en la BD.`);
            }

        } else {
            console.log("Monitor activo. No hay registros nuevos que superen el umbral.");
        }

    } catch (error) {
        console.error("❌ ERROR TÉCNICO AL CONSULTAR BD:", error.message);
    } finally {
        // 4. EL MOTOR DEL POLLING FIJO
        setTimeout(() => monitorearPlanta(pool), INTERVALO_SEGUNDOS * 1000);
    }
};

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`🏭 Gateway IoT encendido (Modo: Producción)`);
    console.log(`⏱️ Polling configurado a: ${INTERVALO_SEGUNDOS} segundos`);
    console.log(`=========================================\n`);
    
    try {
        const pool = await getConnection();
        console.log(`✅ ¡Conectado con éxito a SQL Server! Iniciando monitoreo...\n`);
        
        // Iniciamos el ciclo infinito
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\n❌ ERROR GRAVE DE CONEXIÓN A SQL:");
        console.error(error.message);
    }
});