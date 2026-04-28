import { db, admin } from '../../../../config/db/firebaseConfig.js';

const obtenerOperadorDeTurno = async (area) => {
    const hora = new Date().getHours();
    let turnoActual = (hora >= 8 && hora < 16) ? "Mañana" : (hora >= 16 && hora < 24) ? "Tarde" : "Noche";

    const snapshot = await db.collection('operadores')
        .where('area_asignada', '==', area)
        .where('turno', '==', turnoActual)
        .where('estado_activo', '==', true)
        .get();

    return snapshot.empty ? null : snapshot.docs[0].data();
};

const guardarHistorialAlerta = async (alerta, nombreOperador, canal) => {
    await db.collection('logs_industriales').add({
        ...alerta,
        operador_notificado: nombreOperador,
        canal: canal,
        timestamp: admin.firestore.Timestamp.now()
    });
};

export { obtenerOperadorDeTurno, guardarHistorialAlerta };