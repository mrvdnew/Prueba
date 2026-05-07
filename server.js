import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';
import { enviarWhatsApp } from './src/api/v1/services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 8000;

// ==========================================
// CONFIGURACIÓN DE LA PRUEBA
// ==========================================
// Umbral en 1000 para forzar la detección del tag PLQLARGO (que marca ~1100)
const UMBRAL_MINIMO = 1000; 
const INTERVALO_SEGUNDOS = 10; 

let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Buscando anomalías (> ${UMBRAL_MINIMO}) en t_tagColina...`);
        
        // 1. Armamos la consulta apuntando exactamente a la columna del Historian
        let query = `
            SELECT TOP 1 
                'SN2COL.LC_HRC_PLQLARGO.F_CV' AS Tag,
                [fecha] AS Fecha, 
                [SN2COL.LC_HRC_PLQLARGO.F_CV] AS Valor 
            FROM [Historian].[dbo].[t_tagColina]
            WHERE [SN2COL.LC_HRC_PLQLARGO.F_CV] > ${UMBRAL_MINIMO}
        `;

        // 2. Filtro de fecha con formato limpio (YYYY-MM-DD HH:MM:SS) para evitar errores de SQL
        if (ultimaFechaNotificada) {
            const fechaSegura = new Date(ultimaFechaNotificada).toISOString().slice(0, 19).replace('T', ' ');
            query += ` AND [fecha] > '${fechaSegura}'`;
        }

        // Siempre ordenamos del más nuevo al más viejo
        query += ` ORDER BY [fecha] DESC`;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        // 3. Evaluamos si encontramos un dato nuevo que supere el umbral
        if (dato) {
            console.log(`⚠️ ¡NUEVA FALLA DETECTADA! Tag: ${dato.Tag} | Valor: ${dato.Valor}`);
            
            // Guardamos la fecha para no repetir el correo en el siguiente ciclo
            ultimaFechaNotificada = dato.Fecha;

            // Busca en tu tabla SQL si alguien está asignado a este Tag específico
            const responsables = await obtenerResponsablesTag(dato.Tag);

            if (responsables && responsables.length > 0) {
                console.log(`Notificando a ${responsables.length} responsables del área...`);

                for (const user of responsables) {
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                }
            } else {
                console.log(`Falla detectada, pero no hay responsables asignados para el tag: ${dato.Tag}`);
            }

        } else {
            console.log("Monitor activo. No hay registros nuevos que superen el umbral.");
        }

    } catch (error) {
        console.error("❌ ERROR TÉCNICO AL CONSULTAR BD:", error.message);
    } finally {
        // Ejecuta el próximo ciclo en 10 segundos exactos
        setTimeout(() => monitorearPlanta(pool), INTERVALO_SEGUNDOS * 1000);
    }
};

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`🏭 Gateway IoT encendido (Modo: Producción Historian)`);
    console.log(`⏱️ Polling configurado a: ${INTERVALO_SEGUNDOS} segundos`);
    console.log(`=========================================\n`);
    
    try {
        const pool = await getConnection();
        console.log(`✅ ¡Conectado con éxito a SQL Server! Iniciando monitoreo...\n`);
        
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\n❌ ERROR GRAVE DE CONEXIÓN A SQL:");
        console.error(error.message);
    }
});