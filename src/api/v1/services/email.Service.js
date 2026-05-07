import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarEmailAlerta = async (usuario, dato) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuario.email, 
        subject: `ALERTA CRÍTICA: ${dato.Tag}`,
        html: `
            <div style="font-family: sans-serif; border: 2px solid #ff9900; padding: 20px; border-radius: 8px;">
                <h2 style="color: #ff9900;">¡Dato Anómalo Detectado!</h2>
                <p>Hola <b>${usuario.nombre}</b>, se ha capturado un valor sobre el umbral en tu área asignada:</p>
                <ul>
                    <li><b>TAG:</b> ${dato.Tag}</li>
                    <li><b>FECHA:</b> ${dato.Fecha}</li>
                    <li><b>VALOR:</b> <span style="color: red; font-size: 1.2em; font-weight: bold;">${dato.Valor}</span></li>
                </ul>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado a ${usuario.nombre} (${usuario.email}).`);
    } catch (error) {
        console.error(`Error enviando email a ${usuario.email}:`, error.message);
    }
};

export { enviarEmailAlerta };