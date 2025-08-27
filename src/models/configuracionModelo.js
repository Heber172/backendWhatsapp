const db = require('../../config/conexion');

const Configuracion = {
    getTiempoConfiguracion: (cod_usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM configuracion WHERE cod_usuario = ?',
                [cod_usuario],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },

    guardarConfiguracion: (cod_usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO configuracion 
                (cod_usuario, tiempo) 
                VALUES (?, "00:00:10")`,
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
    actualizarConfiguracionTiempo: (cod_usuario, tiempo) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE configuracion 
                 SET tiempo = ?
                 WHERE cod_usuario = ?`,
                [
                    tiempo,
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

module.exports = Configuracion; 
