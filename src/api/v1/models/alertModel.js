import { getConnection, sql } from '../../../../config/db/sqlConfig.js';

export const obtenerResponsablesTag = async (tagName) => {
};

export const guardarHistorialAlerta = async (tag, valor, nombreOperador, canal) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('tag', sql.VarChar, tag)
            .input('valor', sql.Float, valor)
            .input('operador', sql.VarChar, nombreOperador)
            .input('canal', sql.VarChar, canal)
            .query(`
                INSERT INTO dbo.HistorialAlertas (tag, valor_falla, nombre_operador, canal, fecha_envio)
                VALUES (@tag, @valor, @operador, @canal, GETDATE())
            `);
    } catch (error) {
        console.error("Error guardando en el historial:", error.message);
    }
};