import { getConnection } from '../../../../config/db/sqlConfig.js';

const obtenerUltimoDatoHistorian = async () => {
    try {
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT TOP 1 
                Tag, 
                Fecha, 
                Valor 
            FROM dbo.TagCems
            ORDER BY Fecha DESC
        `);

        return result.recordset[0]; 
    } catch (error) {
        console.error("Error en la consulta SQL:", error.message);
        return null;
    }
};

export { obtenerUltimoDatoHistorian };