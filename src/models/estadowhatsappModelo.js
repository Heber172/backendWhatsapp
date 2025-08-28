const db = require('../../config/conexion');

const whatsappEstado = {
    
    getestadoWhatsappPorUsuario: (cod_usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT estado FROM estado_conexion_whatsapp where cod_usuario = ?;',
                [
                    cod_usuario,
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    guardarEstadoDeWhatsapp: (cod_usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO estado_conexion_whatsapp 
                (cod_usuario) 
                VALUES (?)`,
                [
                    cod_usuario
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results.insertId); // devolvemos el id generado
                }
            );
        });
    },
    
    actualizarEstadoDeWhatsapp: (cod_usuario, estado) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE estado_conexion_whatsapp 
                 SET estado = ?
                 WHERE cod_usuario = ?`,
                [
                    estado,
                    cod_usuario
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
};

module.exports = whatsappEstado; 
