const db = require('../../config/conexion');

const Usuario = {
    getNombreUsuario: (nombreUsuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM usuarios WHERE nombreUsuario = ?',
                [nombreUsuario],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },

    getUsuariosCi: (ci) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM usuarios WHERE ci = ?',
                [ci],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },

    guardarUsuario: (usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO usuarios 
                (cod_rol, nombre, paterno, materno, ci, foto, nombreUsuario, contrasena, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario.cod_rol,
                    usuario.nombre,
                    usuario.paterno,
                    usuario.materno,
                    usuario.ci,
                    usuario.foto,
                    usuario.nombreUsuario,
                    usuario.contrasena,  // ya encriptada
                    usuario.estado || 1,
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results.insertId);
                }
            );
        });
    },

    getUsuarioPorCodUsuario: (cod_usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT cod_usuario, nombre, paterno, materno, ci, foto, estado FROM usuarios WHERE cod_usuario = ?',
                [cod_usuario],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },

    actualizarUsuario: (cod_usuario, usuario) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE usuarios 
                 SET nombre = ?, paterno = ?, materno = ?, ci = ?, foto = ?
                 WHERE cod_usuario = ?`,
                [
                    usuario.nombre,
                    usuario.paterno,
                    usuario.materno,
                    usuario.ci,
                    usuario.foto,
                    cod_usuario
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },

    actualizarEstado: (cod_usuario, estado) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE usuarios 
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


    // ===== NUEVO: listarUsuarios con paginación, búsqueda y ordenamiento =====
    listarUsuarios: ({ page = 1, itemsPerPage = 10, q = '', sortBy = 'cod_usuario', orderBy = 'desc' }) => {
        return new Promise((resolve, reject) => {
            const camposPermitidos = ['cod_usuario', 'nombre', 'paterno', 'materno', 'ci', 'rol_nombre', 'cod_rol','foto','estado'];
            if (!camposPermitidos.includes(sortBy)) sortBy = 'cod_usuario';
            if (!['asc', 'desc'].includes(orderBy.toLowerCase())) orderBy = 'desc';

            const offset = (page - 1) * itemsPerPage;

            let sql = `
                SELECT 
                    u.cod_usuario, 
                    r.nombre AS rol_nombre, 
                    r.cod_rol as cod_rol,
                    u.nombre, 
                    u.paterno, 
                    u.materno, 
                    u.ci, 
                    u.foto,
                    u.estado
                FROM usuarios u
                INNER JOIN rol r ON u.cod_rol = r.cod_rol
            `;
            const params = [];

            if (q.trim() !== '') {
                sql += ` WHERE u.nombre LIKE ? OR u.paterno LIKE ? OR u.materno LIKE ? OR u.ci LIKE ?`;
                const busqueda = `%${q}%`;
                params.push(busqueda, busqueda, busqueda, busqueda);
            }

            sql += ` ORDER BY ${sortBy} ${orderBy} LIMIT ? OFFSET ?`;
            params.push(parseInt(itemsPerPage), parseInt(offset));

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);

                // Contar total de registros
                let countSql = `
                    SELECT COUNT(*) as total 
                    FROM usuarios u
                    INNER JOIN rol r ON u.cod_rol = r.cod_rol
                `;
                const countParams = [];
                if (q.trim() !== '') {
                    countSql += ` WHERE u.nombre LIKE ? OR u.paterno LIKE ? OR u.materno LIKE ? OR u.ci LIKE ?`;
                    const busqueda = `%${q}%`;
                    countParams.push(busqueda, busqueda, busqueda, busqueda);
                }

                db.query(countSql, countParams, (err2, countResult) => {
                    if (err2) return reject(err2);
                    const total = countResult[0].total;
                    resolve({
                        usuarios: results,
                        total,
                        page,
                        itemsPerPage,
                        totalPages: Math.ceil(total / itemsPerPage),
                        last_page: Math.ceil(total / itemsPerPage) // ahora el frontend puede usar last_page
                    });
                });
            });
        });
    },
    
    actualizarIntentos: (cod_usuario, intento) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE usuarios 
                 SET intentos = ?
                 WHERE cod_usuario = ?`,
                [
                    intento,
                    cod_usuario
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    actualizarFechaIntentos: (cod_usuario, fecha) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE usuarios 
                 SET fecha_intentos = ?
                 WHERE cod_usuario = ?`,
                [
                    fecha,
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

module.exports = Usuario;
