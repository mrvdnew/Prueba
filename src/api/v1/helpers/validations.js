import Joi from "joi";

export const alertSchema = Joi.object({
    id_maquina: Joi.string().max(50).required(),
    area: Joi.string().required(),
    nivel_riesgo: Joi.string().valid('BAJO', 'MEDIO', 'ALTO', 'CRITICO').required(), 
    valor_actual: Joi.number().required(),
    mensaje: Joi.string().max(255).required()
});