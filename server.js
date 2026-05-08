import 'dotenv/config'; 
import express from 'express';
import { getConnection } from './config/db/sqlConfig.js';
import { obtenerResponsablesTag } from './src/api/v1/models/alertModel.js';
import { enviarEmailAlerta } from './src/api/v1/services/email.Service.js';

const app = express();
const PORT = process.env.PORT || 8000;

const INTERVALO_SEGUNDOS = 10; 
let ultimaFechaNotificada = null;

const monitorearPlanta = async (pool) => {
    try {
        let query = `
            SELECT TOP 1 
                'SN2COL.LC_HRC_PLQLARGO.F_CV' AS Tag,
                CONVERT(varchar, [fecha], 120) AS FechaSegura, 
                [SN2COL.LC_HRC_PLQLARGO.F_CV] AS Valor 
            FROM [Historian].[dbo].[t_tagColina] WITH (NOLOCK)
            ORDER BY [fecha] DESC
        `;

        const result = await pool.request().query(query);
        const dato = result.recordset[0];

        if (dato) {
            console.log(`[${new Date().toLocaleTimeString()}] Última fecha en BD: ${dato.FechaSegura} | En memoria: ${ultimaFechaNotificada || 'Ninguna'}`);
            
            if (ultimaFechaNotificada !== dato.FechaSegura) {
                console.log(`Nuevo registro encontrado. Fecha: ${dato.FechaSegura}`);
                
                ultimaFechaNotificada = dato.FechaSegura;
                dato.Fecha = dato.FechaSegura; 

                const responsables = await obtenerResponsablesTag(dato.Tag);

                if (responsables && responsables.length > 0) {
                    for (const user of responsables) {
                        if (user.notificar_email) {
                            await enviarEmailAlerta(user, dato);
                        }
                    }
                }
            }
        } else {
            console.log("No se encontraron datos en la tabla.");
        }

    } catch (error) {
        console.error("ERROR AL CONSULTAR BD:", error.message);
    } finally {
        setTimeout(() => monitorearPlanta(pool), INTERVALO_SEGUNDOS * 1000);
    }
};

app.listen(PORT, async () => {
    console.log(`Gateway IoT`);
    console.log(`Polling: ${INTERVALO_SEGUNDOS} segundos`);
    
    try {
        const pool = await getConnection();
        console.log(`Conectado a SQL Server`);
        monitorearPlanta(pool);
    } catch (error) {
        console.error("\nERROR DE CONEXIÓN A SQL:", error.message);
    }
});