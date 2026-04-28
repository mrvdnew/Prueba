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

const getConnection = async () => {
    const pool = await sql.connect(dbSettings);
    return pool;
};

export { getConnection, sql };