import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';
import { enviarWhatsApp } from './src/api/v1/services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 8000;


const INTERVALO_SEGUNDOS = 10; 

let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Buscando el ultimo registro absoluto en t_tagColina...`);
        
        let query = `
            SELECT TOP 1 
                'SN2COL.LC_HRC_PLQLARGO.F_CV' AS Tag,
                [fecha] AS Fecha, 
                [SN2COL.LC_HRC_PLQLARGO.F_CV] AS Valor 
            FROM [Historian].[dbo].[t_tagColina]
        `;

        if (ultimaFechaNotificada) {
            const fechaSegura = new Date(ultimaFechaNotificada).toISOString().slice(0, 19).replace('T', ' ');
            query += ` WHERE CAST([fecha] AS DATETIME) > CAST('${fechaSegura}' AS DATETIME)`;
        }

        query += ` ORDER BY CAST([fecha] AS DATETIME) DESC`;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        if (dato) {
            console.log(`[NUEVO DATO DETECTADO] Tag: ${dato.Tag} | Valor: ${dato.Valor} | Fecha exacta en BD: ${dato.Fecha}`);
            
            ultimaFechaNotificada = dato.Fecha;

            const responsables = await obtenerResponsablesTag(dato.Tag);

            if (responsables && responsables.length > 0) {
                console.log(`Notificando a ${responsables.length} responsables del area...`);

                for (const user of responsables) {
                    if (user.notificar_email) {
                        await enviarEmailAlerta(user, dato);
                    }
                }
            } else {
                console.log(`Falla detectada, pero no hay responsables asignados para el tag: ${dato.Tag}`);
            }

        } else {
            console.log("Monitor activo. No hay registros nuevos en la base de datos.");
        }

    } catch (error) {
        console.error("[ERROR AL CONSULTAR BD]:", error.message);
    } finally {
        setTimeout(() => monitorearPlanta(pool), INTERVALO_SEGUNDOS * 1000);
    }
};

app.listen(PORT, async () => {
    console.log(`Gateway IoT encendido (Modo: Rayos X - Sin Umbral)`);
    console.log(`Polling configurado a: ${INTERVALO_SEGUNDOS} segundos`);
    
    try {
        const pool = await getConnection();
        console.log(`[Conectado con exito a SQL Server] Iniciando monitoreo...\n`);
        
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\n[ERROR DE CONEXION A SQL]:");
        console.error(error.message)
    }
});