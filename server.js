import 'dotenv/config'; 
import express from 'express';
import sql from 'mssql';
import nodemailer from 'nodemailer'; 

const app = express();
const PORT = process.env.PORT || 8000;

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE, 
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

const UMBRAL_MINIMO = 5.0; 
const MIN_SEGUNDOS = 10; 
const MAX_SEGUNDOS = 35; 

const monitorearPlanta = async (pool) => {
    try {
        console.log(`\nBuscando anomalía (Valor > ${UMBRAL_MINIMO}) en la tabla ${process.env.DB_TABLE}...`);
        
        const result = await pool.request().query(`
            SELECT TOP 1 Tag, Fecha, Valor 
            FROM dbo.${process.env.DB_TABLE}
            WHERE Valor > ${UMBRAL_MINIMO}
            ORDER BY NEWID()
        `);

        const dato = result.recordset[0];

        if (dato) {
            console.log(`Dato capturado: ${dato.Tag} | Valor: ${dato.Valor}`);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, 
                subject: `ALARMA SIMULADA: ${dato.Tag}`,
                html: `
                    <div style="font-family: sans-serif; border: 2px solid #ff9900; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #ff9900;">¡Dato Anómalo Detectado!</h2>
                        <p>El sistema automático ha capturado un valor sobre el umbral (${UMBRAL_MINIMO}):</p>
                        <ul>
                            <li><b>TAG:</b> ${dato.Tag}</li>
                            <li><b>FECHA:</b> ${dato.Fecha}</li>
                            <li><b>VALOR:</b> <span style="color: red; font-size: 1.2em; font-weight: bold;">${dato.Valor}</span></li>
                        </ul>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log("¡Correo de alerta enviado!");

        } else {
            console.log("Normal. No se encontraron valores altos.");
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
    console.log(`Gateway IoT encendido`);
    console.log(`Conectando a la planta...`);
    
    try {
        const pool = await sql.connect(dbSettings);
        console.log(`Conectado.\n`);
        
        monitorearPlanta(pool);

    } catch (error) {
        console.log("\nERROR GRAVE DE CONEXIÓN:");
        console.error(error.message);
    }
});