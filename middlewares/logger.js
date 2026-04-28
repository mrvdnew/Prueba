const registrarActividad = async (req, res, next) => {
    const url = req.url;
    const metodo = req.method;
    const cuerpo = req.body;
    
    console.log(`\n========================================`);
    console.log(`[AUDITORÍA] Petición ${metodo} recibida en ${url}`);
    console.log(`[FECHA] ${new Date().toLocaleString()}`);
    if (Object.keys(cuerpo).length > 0) {
        console.log(`[DATOS DEL PLC]`, cuerpo);
    }
    console.log(`========================================\n`);
    
    next(); 
};

export { registrarActividad };