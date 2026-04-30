import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';
import { enviarWhatsApp } from './src/api/v1/services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 8000;

const UMBRAL_MINIMO = 5.0;
const MIN_SEGUNDOS = 10;
const MAX_SEGUNDOS = 35;

let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
        console.log(`\nBuscando anomalías NUEVAS (Valor > ${UMBRAL_MINIMO}) en ${process.env.DB_TABLE}...`);
        
        let query = `
            SELECT TOP 1 Tag, Fecha, Valor 
            FROM dbo.${process.env.DB_TABLE}
            WHERE Valor > ${UMBRAL_MINIMO}
        `;

        if (ultimaFechaNotificada) {
            query += ` AND Fecha > '${ultimaFechaNotificada.toISOString()}'`;
        }

        query += ` ORDER BY Fecha DESC`;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        if (dato) {
            console.log(`¡NUEVA FALLA DETECTADA! Tag: ${dato.Tag} | Valor: ${dato.Valor}`);
            
            ultimaFechaNotificada = dato.Fecha;

            const responsables = await obtenerResponsablesTag(dato.Tag);

            if (responsables.length > 0) {
                console.log(`Notificando a ${responsables.length} responsables del área...`);

                for (const user of responsables) {
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                    if (user.notificar_whatsapp && user.telefono) {
                        await enviarWhatsApp(user.telefono, user.nombre, dato.Tag, `Valor: ${dato.Valor}`);
                    }
                }
            } else {
                console.log(`Falla en ${dato.Tag}, pero no hay responsables asignados en la BD.`);
            }

        } else {
            console.log("Monitor activo. No hay alarmas nuevas desde la última revisión.");
        }

    } catch (error) {
        console.error("ERROR TÉCNICO:", error.message);
    } finally {
        const tiempoEspera = Math.floor(Math.random() * (MAX_SEGUNDOS - MIN_SEGUNDOS + 1) + MIN_SEGUNDOS);
        console.log(`Esperando ${tiempoEspera} segundos para la próxima revisión...`);
        setTimeout(() => monitorearPlanta(pool), tiempoEspera * 1000);
    }
};

app.listen(PORT, async () => {
    console.log(`Gateway IoT encendido (Modo: Producción 24/7)`);
    console.log(`Conectando a la planta...`);
    
    try {
        const pool = await getConnection();
        console.log(`¡Conectado con éxito! Iniciando el ciclo de monitoreo...\n`);
        
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\nERROR GRAVE DE CONEXIÓN:");
        console.error(error.message);
    }
});