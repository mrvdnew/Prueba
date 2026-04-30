import sql from 'mssql';
import 'dotenv/config';

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

let pool = null;

const getConnection = async () => {
    try {
        if (pool) return pool; 
        pool = await sql.connect(dbSettings);
        return pool;
    } catch (error) {
        console.error("Error de conexión SQL:", error.message);
        pool = null;
        throw error;
    }
};

export { getConnection, sql };