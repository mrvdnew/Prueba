import nodemailer from 'nodemailer';
import { obtenerOperadorDeTurno, guardarHistorialAlerta } from '../models/alertModel.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

const enviarEmailAlerta = async (destinatario, datos, nombreOperador) => {
    const mailOptions = {
        from: '"Sistema de Alertas Planta" <maria.zavala1116@gmail.com>',
        to: destinatario,
        subject: `ALERTA CRÍTICA: ${datos.id_maquina}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #d4d4d4; padding: 20px; border-radius: 10px;">
                <h2 style="color: #d32f2f;">Notificación de Alerta Industrial</h2>
                <p>Hola <b>${nombreOperador}</b>, se ha detectado una anomalía en tu área asignada.</p>
                <hr>
                <p><b>Máquina:</b> ${datos.id_maquina}</p>
                <p><b>Nivel de Riesgo:</b> ${datos.nivel_riesgo}</p>
                <p><b>Valor Detectado:</b> ${datos.valor_actual}</p>
                <p><b>Mensaje:</b> ${datos.mensaje}</p>
                <hr>
                <footer style="font-size: 0.8em; color: #777;">
                    Este es un mensaje automático generado por el Sistema de Monitoreo IoT.
                </footer>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado con éxito a: ${destinatario}`);
    } catch (error) {
        console.error("Error al enviar el correo:", error.message);
    }
};

const triggerAlert = async (req, res) => {
    try {
        console.log("[Controlador]: Alerta recibida desde el servicio PLC.");
        
        const alerta = req.body;
        res.status(200).json({ estado: "Procesando" });

        console.log("[Controlador]: Buscando operador de turno en Firebase...");
        const operador = await obtenerOperadorDeTurno(alerta.area || "Sala de Calderas");
        let nombreOperador = "Ninguno";

        if (operador && operador.email && String(operador.email).trim() !== "") {
            const emailLimpio = String(operador.email).trim();
            nombreOperador = operador.nombre_completo;
            
            console.log(`[Controlador]: Responsable encontrado: ${nombreOperador}. Notificando a: "${emailLimpio}"...`);
            await enviarEmailAlerta(emailLimpio, alerta, nombreOperador);
        } else {
            console.log("[Controlador]: No hay operador con email válido para este turno.");
        }

        console.log("[Controlador]: Guardando registro en historial de Firebase...");
        await guardarHistorialAlerta(alerta, nombreOperador, "Email");
        console.log("[Controlador]: Flujo completado exitosamente.\n");

    } catch (error) {
        console.error("[ERROR GRAVE EN CONTROLADOR]:", error.message);
    }
};

export { triggerAlert };