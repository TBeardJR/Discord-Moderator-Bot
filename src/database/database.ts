import { createPool, MysqlError, createConnection } from 'mysql';
import { DBParam } from '../types/types';
import { Subject, Observable } from 'rxjs';

const onDBConnection: Subject<void> = new Subject<void>();
export const onDBConnection$: Observable<void> = onDBConnection.asObservable();

const connectionInfo = {
    connectionLimit : 10,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: +process.env.PORT
}

export const testDBConnection = () => {
    createConnection(connectionInfo).connect((error) => {
        if (!error) {
            onDBConnection.next();
        } else {
            onDBConnection.error(error);
        }
    });
}



const pool = createPool(connectionInfo);

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

 

