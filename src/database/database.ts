import { createPool, MysqlError } from 'mysql';
import { DBParam } from '../types/types';

const pool = createPool({
    connectionLimit : 10,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_CONNECTION_STRING,
    database: process.env.DB_NAME,
    port: +process.env.PORT
})

export async function query(queryString: string, params?: DBParam[] | DBParam[][] | DBParam[][][]): Promise<any> {
    return new Promise((resolve, reject) => {
        pool.query(queryString, params, (error: MysqlError, results: any) => {
            if(error) {
                console.error(`Error performing query: ${queryString}`);
                if(params) {
                    console.error(`Params: ${params.toString()}`);
                }               
                reject(new Error(error.message))
            }
            resolve(results);
        });
    })
}