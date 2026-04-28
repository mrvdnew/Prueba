import axios from 'axios';

const enviarWhatsApp = async (numeroDestino, nombreOperador, maquina, alerta) => {
    const TOKEN_META = process.env.META_TOKEN;
    const ID_TELEFONO = process.env.META_PHONE_ID;

    try {
        console.log(`Enviando WhatsApp a ${nombreOperador} (${numeroDestino})...`);

        const payload = {
            messaging_product: "whatsapp",
            to: numeroDestino,
            type: "template",
            template: {
                name: "alerta_critica_planta", 
                language: { code: "es" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: nombreOperador },
                            { type: "text", text: maquina },
                            { type: "text", text: alerta }
                        ]
                    }
                ]
            }
        };

        const respuesta = await axios.post(
            `https://graph.facebook.com/v19.0/${ID_TELEFONO}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN_META}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`WhatsApp entregado correctamente.`);
        return respuesta.data;

    } catch (error) {
        const detalleError = error.response?.data?.error?.message || error.message;
        console.error(`Error de envío:`, detalleError);
    }
};

export { enviarWhatsApp };