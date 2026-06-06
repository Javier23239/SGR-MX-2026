require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;
const SECRET_KEY = process.env.SECRET_KEY || "SGR_MX_TOKEN_SECRET_2026";

// --- CONFIGURACIÓN DE ENVÍO DE CORREO ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- CONEXIÓN BD ---
const dbConfig = {
    user: process.env.DB_USER || "BASURA_DB",
    password: process.env.DB_PASSWORD || "1234",
    connectString: process.env.DB_CONNECT_STRING || "localhost:1521/XEPDB1"
};

// Almacenamiento temporal para OTP (Login y Recuperación)
const otpCache = new Map();

// Middleware para verificar el Token JWT
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Acceso denegado. Inicia sesión." });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Sesión expirada o inválida." });
        }
        req.user = decoded;
        next();
    });
};

// --- LOGIN PASO 1: VALIDAR CREDENCIALES Y ENVIAR OTP ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        let usuarioDB = null;

        let resAdmin = await connection.execute(
            `SELECT CONTRASEÑA AS PASS, NOMBRE, 'ADMIN' AS ROL FROM BASURA_DB.ADMINISTRADOR WHERE UPPER(TRIM(USUARIO)) = UPPER(TRIM(:email))`,
            { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (resAdmin.rows.length > 0) {
            usuarioDB = resAdmin.rows[0];
        } else {
            let resReco = await connection.execute(
                `SELECT PASSWORD AS PASS, NOMBRE, 'RECOLECTOR' AS ROL FROM BASURA_DB.RECOLECTOR WHERE UPPER(TRIM(CORREO)) = UPPER(TRIM(:email))`,
                { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            if (resReco.rows.length > 0) {
                usuarioDB = resReco.rows[0];
            } else {
                let resCiu = await connection.execute(
                    `SELECT PASSWORD AS PASS, NOMBRE, 'CIUDADANO' AS ROL FROM BASURA_DB.CIUDADANO WHERE UPPER(TRIM(CORREO)) = UPPER(TRIM(:email))`,
                    { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                if (resCiu.rows.length > 0) usuarioDB = resCiu.rows[0];
            }
        }

        if (usuarioDB) {
            const coinciden = await bcrypt.compare(password, usuarioDB.PASS);
            if (coinciden) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                otpCache.set(email, {
                    otp,
                    userData: { 
                        nombre: usuarioDB.NOMBRE, 
                        email, 
                        rol: usuarioDB.ROL.trim().toUpperCase() 
                    },
                    expires: Date.now() + 300000
                });

                await transporter.sendMail({
                    from: `"Seguridad SGR-MX" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: "Código de Verificación de Acceso",
                    html: `<div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                            <h1 style="color: #059669;">SGR-MX</h1>
                            <p>Hola <strong>${usuarioDB.NOMBRE}</strong>, tu código de acceso es:</p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px 0;">
                                <span style="letter-spacing: 8px; font-size: 32px; font-weight: bold;">${otp}</span>
                            </div>
                           </div>`
                });
                res.json({ status: "OTP_SENT" });
            } else {
                res.status(401).json({ error: "Contraseña incorrecta" });
            }
        } else {
            res.status(401).json({ error: "Usuario no encontrado" });
        }
    } catch (err) {
        console.error("Error en /login:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        if (connection) await connection.close();
    }
});

// --- LOGIN PASO 2: VERIFICAR OTP ---
app.post('/verificar-otp', async (req, res) => {
    const { email, otp } = req.body;
    const session = otpCache.get(email);
    if (!session || session.otp !== otp || Date.now() > session.expires) {
        return res.status(400).json({ error: "Código inválido o expirado" });
    }
    const token = jwt.sign(session.userData, SECRET_KEY, { expiresIn: '4h' });
    otpCache.delete(email);
    res.json({ token, rol: session.userData.rol, nombre: session.userData.nombre });
});

// --- RECUPERACIÓN DE CONTRASEÑA: PASO 1 (SOLICITAR) ---
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const tables = [
            { t: 'ADMINISTRADOR', c: 'USUARIO' },
            { t: 'RECOLECTOR', c: 'CORREO' },
            { t: 'CIUDADANO', c: 'CORREO' }
        ];

        let found = false;
        for (let table of tables) {
            const check = await connection.execute(
                `SELECT NOMBRE FROM BASURA_DB.${table.t} WHERE UPPER(TRIM(${table.c})) = UPPER(TRIM(:email))`,
                { email }
            );
            if (check.rows.length > 0) { found = true; break; }
        }

        if (!found) return res.status(404).json({ error: "Correo no registrado" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpCache.set(`RESET_${email}`, { otp, expires: Date.now() + 600000 });

        await transporter.sendMail({
            from: `"SGR-MX Soporte" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Recupera tu Contraseña",
            html: `<h1>SGR-MX</h1><p>Tu código de recuperación es: <strong>${otp}</strong></p>`
        });
        res.json({ mensaje: "Código enviado" });
    } catch (err) { 
        console.error("Error en /forgot-password:", err);
        res.status(500).json({ error: "Error al procesar la solicitud" }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// --- RECUPERACIÓN DE CONTRASEÑA: PASO 2 (RESTABLECER) ---
app.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const session = otpCache.get(`RESET_${email}`);
    if (!session || session.otp !== otp || Date.now() > session.expires) {
        return res.status(400).json({ error: "Código inválido o expirado" });
    }

    let connection;
    try {
        const hashed = await bcrypt.hash(newPassword, saltRounds);
        connection = await oracledb.getConnection(dbConfig);
        const tables = [
            { t: 'ADMINISTRADOR', c: 'CONTRASEÑA', e: 'USUARIO' },
            { t: 'RECOLECTOR', c: 'PASSWORD', e: 'CORREO' },
            { t: 'CIUDADANO', c: 'PASSWORD', e: 'CORREO' }
        ];

        for (let table of tables) {
            await connection.execute(
                `UPDATE BASURA_DB.${table.t} SET ${table.c} = :hashed WHERE UPPER(TRIM(${table.e})) = UPPER(TRIM(:email))`,
                { hashed, email }, { autoCommit: true }
            );
        }
        otpCache.delete(`RESET_${email}`);
        res.json({ mensaje: "Contraseña actualizada" });
    } catch (err) { 
        console.error("Error en /reset-password:", err);
        res.status(500).json({ error: "No se pudo actualizar la contraseña" }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// --- REGISTRO ---
app.post('/registrar-ciudadano', async (req, res) => {
    const { nombre, apellido, email, password, direccion, telefono, rol } = req.body;
    let connection;
    try {
        const hashed = await bcrypt.hash(password || '1234', saltRounds);
        connection = await oracledb.getConnection(dbConfig);
        if (rol === "ADMIN") {
            await connection.execute(`INSERT INTO BASURA_DB.ADMINISTRADOR (NOMBRE, USUARIO, CONTRASEÑA) VALUES (:nombre, :email, :hashed)`, { nombre: `${nombre} ${apellido}`, email, hashed }, { autoCommit: true });
        } else if (rol === "RECOLECTOR") {
            await connection.execute(`INSERT INTO BASURA_DB.RECOLECTOR (NOMBRE, APELLIDO, TELEFONO, CORREO, PASSWORD) VALUES (:nombre, :apellido, :telefono, :email, :hashed)`, { nombre, apellido, telefono, email, hashed }, { autoCommit: true });
        } else {
            await connection.execute(`INSERT INTO BASURA_DB.CIUDADANO (NOMBRE, APELLIDO, CORREO, DIRECCION, TELEFONO, PASSWORD) VALUES (:nombre, :apellido, :email, :direccion, :telefono, :hashed)`, { nombre, apellido, email, direccion, telefono, hashed }, { autoCommit: true });
        }
        res.status(201).json({ mensaje: "Registro exitoso" });
    } catch (err) { 
        console.error("Error en /registrar-ciudadano:", err);
        res.status(400).json({ error: err.message }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// --- GESTIÓN DE USUARIOS ---
app.get('/usuarios', verificarToken, async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT ID_CIUDADANO AS ID, NOMBRE, APELLIDO, CORREO, DIRECCION, TELEFONO, 'CIUDADANO' AS ROL FROM BASURA_DB.CIUDADANO
                     UNION ALL SELECT ID_RECOLECTOR AS ID, NOMBRE, APELLIDO, CORREO, 'N/A', TELEFONO, 'RECOLECTOR' FROM BASURA_DB.RECOLECTOR
                     UNION ALL SELECT ID_ADMIN AS ID, NOMBRE, '', USUARIO, 'N/A', 'N/A', 'ADMIN' FROM BASURA_DB.ADMINISTRADOR`;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) { 
        console.error("Error en GET /usuarios:", err);
        res.status(500).json({ error: "Error al cargar la lista de usuarios" }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// ==========================================
//          MÉTODOS: CIUDADANO
// ==========================================

// --- CREAR SOLICITUD (CIUDADANO) ---
app.post('/solicitudes', verificarToken, async (req, res) => {
    const { descripcion, email, latitud, longitud } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `INSERT INTO BASURA_DB.SOLICITUD (DESCRIPCION, FECHA_SOLICITUD, ESTADO, ID_CIUDADANO, LATITUD, LONGITUD)
                     VALUES (:descripcion, CURRENT_TIMESTAMP, 'Pendiente', (SELECT ID_CIUDADANO FROM BASURA_DB.CIUDADANO WHERE UPPER(TRIM(CORREO)) = UPPER(TRIM(:email))), :latitud, :longitud)`;
        await connection.execute(sql, { descripcion, email, latitud, longitud }, { autoCommit: true });
        res.status(201).json({ mensaje: "Solicitud enviada" });
    } catch (err) { 
        console.error("Error en POST /solicitudes:", err);
        res.status(500).json({ error: "Error al procesar el reporte de recolección" }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// --- 🛠️ NUEVO: OBTENER HISTORIAL DE REPORTES PROPIOS DEL CIUDADANO (Mapeado a URL Segmentada) ---
app.get('/solicitudes/:email', verificarToken, async (req, res) => {
    const { email } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `
            SELECT S.ID_SOLICITUD, S.DESCRIPCION, S.ESTADO, S.FECHA_SOLICITUD, S.LATITUD, S.LONGITUD,
                   NVL(R.NOMBRE || ' ' || R.APELLIDO, 'No Asignado') AS CONDUCTOR
            FROM BASURA_DB.SOLICITUD S
            LEFT JOIN BASURA_DB.RECOLECTOR R ON S.ID_RECOLECTOR = R.ID_RECOLECTOR
            WHERE S.ID_CIUDADANO = (SELECT ID_CIUDADANO FROM BASURA_DB.CIUDADANO WHERE UPPER(TRIM(CORREO)) = UPPER(TRIM(:email)))
            ORDER BY S.FECHA_SOLICITUD DESC
        `;
        const result = await connection.execute(sql, { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        console.error("Error en GET /solicitudes/:email:", err);
        res.status(500).json({ error: "Error al obtener las solicitudes del ciudadano en Oracle." });
    } finally {
        if (connection) await connection.close();
    }
});


// ==========================================
//          MÉTODOS: ADMINISTRADOR
// ==========================================

// --- OBTENER REPORTES (ADMINISTRADOR) ---
app.get('/admin/reportes', verificarToken, async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT S.ID_SOLICITUD, S.DESCRIPCION, S.ESTADO, S.FECHA_SOLICITUD, S.LATITUD, S.LONGITUD,
                     NVL(C.NOMBRE || ' ' || C.APELLIDO, 'Ubicación Manual / Anónimo') AS CIUDADANO, 
                     NVL(R.NOMBRE || ' ' || R.APELLIDO, 'No Asignado') AS CONDUCTOR
                     FROM BASURA_DB.SOLICITUD S 
                     LEFT JOIN BASURA_DB.CIUDADANO C ON S.ID_CIUDADANO = C.ID_CIUDADANO
                     LEFT JOIN BASURA_DB.RECOLECTOR R ON S.ID_RECOLECTOR = R.ID_RECOLECTOR 
                     ORDER BY S.FECHA_SOLICITUD DESC`;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) { 
        console.error("Error en GET /admin/reportes:", err);
        res.status(500).json({ error: "Error al mapear las solicitudes globales" }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});

// --- ASIGNAR CONDUCTOR RECOLECTOR (ADMINISTRADOR) ---
app.put('/admin/asignar-reporte', verificarToken, async (req, res) => {
    const { id_solicitud, id_recolector } = req.body;
    let connection;

    if (!id_solicitud || !id_recolector) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios (id_solicitud o id_recolector)." });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const idSolicitudNum = parseInt(id_solicitud, 10);
        const idRecolectorNum = parseInt(id_recolector, 10);

        const sql = `
            UPDATE BASURA_DB.SOLICITUD 
            SET ID_RECOLECTOR = :idRecolectorNum, 
                ESTADO = 'Asignado' 
            WHERE ID_SOLICITUD = :idSolicitudNum
        `;

        const result = await connection.execute(
            sql, 
            { idRecolectorNum, idSolicitudNum }, 
            { autoCommit: true }
        );

        if (result.rowsAffected && result.rowsAffected === 0) {
            return res.status(404).json({ error: "No se encontró la solicitud específica." });
        }

        res.json({ mensaje: "Conductor asignado con éxito y estado actualizado en Oracle." });
    } catch (err) { 
        console.error("Error en PUT /admin/asignar-reporte:", err);
        res.status(500).json({ error: "Error en la base de datos Oracle: " + err.message }); 
    } finally { 
        if (connection) await connection.close(); 
    }
});


// ==========================================
//      MÉTODOS EXCLUSIVOS: CONDUCTOR
// ==========================================

// --- OBTENER TAREAS ACTIVAS ASIGNADAS POR EMAIL ---
app.get('/conductor/reportes', verificarToken, async (req, res) => {
    const { email } = req.query; // Query Parameters (?email=...)
    let connection;

    if (!email) {
        return res.status(400).json({ error: "El correo electrónico del conductor es requerido." });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const sql = `
            SELECT S.ID_SOLICITUD, S.DESCRIPCION, S.ESTADO, S.FECHA_SOLICITUD, S.LATITUD, S.LONGITUD,
                   C.DIRECCION, NVL(C.NOMBRE || ' ' || C.APELLIDO, 'Ciudadano Anónimo') AS CIUDADANO
            FROM BASURA_DB.SOLICITUD S
            LEFT JOIN BASURA_DB.CIUDADANO C ON S.ID_CIUDADANO = C.ID_CIUDADANO
            INNER JOIN BASURA_DB.RECOLECTOR R ON S.ID_RECOLECTOR = R.ID_RECOLECTOR
            WHERE UPPER(TRIM(R.CORREO)) = UPPER(TRIM(:email))
              AND S.ESTADO IN ('Asignado', 'En ruta')
            ORDER BY S.FECHA_SOLICITUD ASC
        `;

        const result = await connection.execute(sql, { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        console.error("Error en GET /conductor/reportes:", err);
        res.status(500).json({ error: "Error en la base de datos Oracle: " + err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// --- ACTUALIZAR ESTADO DE RECOLECCIÓN POR PARTE DEL CONDUCTOR ---
app.put('/conductor/actualizar-estado', verificarToken, async (req, res) => {
    const { id_solicitud, estado } = req.body;
    let connection;

    if (!id_solicitud || !estado) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios (id_solicitud o estado)." });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);
        const idSolicitudNum = parseInt(id_solicitud, 10);

        const sql = `
            UPDATE BASURA_DB.SOLICITUD 
            SET ESTADO = :estado 
            WHERE ID_SOLICITUD = :idSolicitudNum
        `;

        const result = await connection.execute(
            sql, 
            { estado, idSolicitudNum }, 
            { autoCommit: true }
        );

        if (result.rowsAffected && result.rowsAffected === 0) {
            return res.status(404).json({ error: "No se encontró la solicitud para actualizar." });
        }

        res.json({ mensaje: "Estado del reporte actualizado con éxito en Oracle Cloud." });
    } catch (err) {
        console.error("Error en PUT /conductor/actualizar-estado:", err);
        res.status(500).json({ error: "Error en la base de datos Oracle: " + err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// --- 🛠️ CORREGIDO: HISTORIAL CON QUERY PARAMS Y RUTA SANA CORRIGIENDO EL TYPO DE ORTOGRAFÍA ---
app.get('/conductor/historial', verificarToken, async (req, res) => {
    const { email } = req.query; // Cambiado de req.params a req.query para encajar con report.service.js
    let connection;
    
    if (!email) {
        return res.status(400).json({ error: "El correo electrónico del conductor es requerido." });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `
            SELECT S.ID_SOLICITUD, S.DESCRIPCION, S.ESTADO, S.FECHA_SOLICITUD, S.LATITUD, S.LONGITUD,
                   C.DIRECCION, NVL(C.NOMBRE || ' ' || C.APELLIDO, 'Ciudadano Anónimo') AS CIUDADANO
            FROM BASURA_DB.SOLICITUD S
            LEFT JOIN BASURA_DB.CIUDADANO C ON S.ID_CIUDADANO = C.ID_CIUDADANO
            INNER JOIN BASURA_DB.RECOLECTOR R ON S.ID_RECOLECTOR = R.ID_RECOLECTOR
            WHERE UPPER(TRIM(R.CORREO)) = UPPER(TRIM(:email))
              AND S.ESTADO = 'Completada'
            ORDER BY S.FECHA_SOLICITUD DESC
        `;
        const result = await connection.execute(sql, { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        console.error("Error en GET /conductor/historial:", err);
        res.status(500).json({ error: "Error al consultar el historial del conductor." });
    } finally {
        if (connection) await connection.close();
    }
});

// --- INICIO ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SERVIDOR SGR-MX EN PUERTO ${PORT}`));