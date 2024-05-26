const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function verificarConexao() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Conexão ao banco de dados estável.');
    } catch (error) {
        console.error('Falha ao verificar conexão com o banco de dados:', error);
    }
}

verificarConexao();

async function salvarAlerta(sensor,idTipoAlerta,valMovimento,valLuz){
    const formattedDate = new Date(new Date()-3600*1000*3).toISOString().slice(0, 19).replace('T', ' ');
    let idSensor = await obterIDSalaPeloNome(sensor);
    let vals = [idSensor,idTipoAlerta,valLuz,valMovimento,formattedDate]
    const [result] = await pool.query('INSERT INTO Alerta (idSala,idTipoAlerta,valLuz,valMovimento,dataAlerta) VALUES (?,?,?,?,?)',vals)
    //return result
}

async function obterIDSalaPeloNome(nome){
    const [result] = await pool.query('SELECT idSala FROM sala WHERE nomeSala =?',[nome])
    if(result.length > 0)
        return result[0].idSala
    else
        return null
}

async function obterAlertas(sensor, limite, listaDeidTipoAlerta) {
    let sql = `SELECT * FROM Alerta`;

    if (sensor !== undefined || listaDeidTipoAlerta !== undefined) {
        sql += ` WHERE`;

        if (sensor !== undefined) {
            let idSensor = await obterIDSalaPeloNome(sensor);
            sql += ` idSala = ${idSensor}`;

            if (listaDeidTipoAlerta !== undefined && listaDeidTipoAlerta.length > 0) {
                sql += ` AND (`;

                for (let i = 0; i < listaDeidTipoAlerta.length; i++) {
                    sql += ` idTipoAlerta = ${listaDeidTipoAlerta[i]}`;
                    if (i < listaDeidTipoAlerta.length - 1) {
                        sql += ` OR`;
                    }
                }

                sql += ` )`;
            }
        } else if (listaDeidTipoAlerta !== undefined && listaDeidTipoAlerta.length > 0) {
            sql += ` (`;

            for (let i = 0; i < listaDeidTipoAlerta.length; i++) {
                sql += ` idTipoAlerta = ${listaDeidTipoAlerta[i]}`;
                if (i < listaDeidTipoAlerta.length - 1) {
                    sql += ` OR`;
                }
            }

            sql += ` )`;
        }
    }

    sql += ` ORDER BY idAlerta DESC`;

    if (limite !== undefined) {
        sql += ` LIMIT ${limite}`;
    }

    //console.log(sql);
    const [result] = await pool.query(sql);
    return result.length > 0 ? result : null;
}


async function obterUltimoAlerta(sensor){
    let idSensor = await obterIDSalaPeloNome(sensor);
    let sql = `SELECT * FROM Alerta`
    sql += ` WHERE idSala =${idSensor} AND idTipoAlerta ORDER BY idAlerta DESC LIMIT 1`
    const [result] = await pool.query(sql)
    //console.log(result)
    if(result.length > 0)
        return result
    else
        return null
}


module.exports = { obterIDSalaPeloNome, salvarAlerta, obterAlertas,obterUltimoAlerta}