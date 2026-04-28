import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarEmailPrueba = async (tag, fecha, valor) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'maria.zavala1116@gmail.com',
        subject: `PRUEBA DE CONEXIÓN: Tag ${tag}`,
        html: `
            <h2>Notificación de Datos en Tiempo Real</h2>
            <p>Se ha verificado la conexión con la base de datos <b>Historian</b>.</p>
            <table border="1" cellpadding="10">
                <tr><td><b>Tag:</b></td><td>${tag}</td></tr>
                <tr><td><b>Fecha:</b></td><td>${fecha}</td></tr>
                <tr><td><b>Valor:</b></td><td>${valor}</td></tr>
            </table>
            <p><i>Este es un mensaje automático del sistema en desarrollo.</i></p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email de prueba enviado exitosamente.");
    } catch (error) {
        console.error("Error enviando el email:", error.message);
    }
};

export { enviarEmailPrueba };