import { alertSchema } from "../src/api/v1/helpers/validations.js";

const validateAlert = (req, res, next) => {
    const { error } = alertSchema.validate(req.body);

    if (error) {
        console.log(`[VALIDACIÓN RECHAZADA]: El PLC envió datos inválidos - ${error.details[0].message}`);
        return res.status(400).json({ 
            error: "Datos de alerta corruptos o incompletos", 
            detalle: error.details[0].message 
        });
    }

    next();
};

export { validateAlert };