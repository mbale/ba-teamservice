import { ConnectionOptions, createConnection } from 'typeorm';
import { Container } from 'typedi';

/**
 * Used to inject db dependency
 * 
 * @export
 * @param {string} mongodbURL 
 * @param {Function[]} entities 
 * @returns 
 */
export function connection(mongodbURL : string, entities : Function[]) {
  return function (object : object, propertyName : string, index? : number) {
    const dbOptions : ConnectionOptions = {
      entities,
      type: 'mongodb',
      url: mongodbURL,
      logging: ['query', 'error'],
    };
    const connection = createConnection(dbOptions);
    Container.registerHandler({ object, propertyName, index, value: () => connection });
  };
}
