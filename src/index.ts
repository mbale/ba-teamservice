import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as Queue from 'bull';
import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import wikiJS from 'wikijs';
import apiGateway from './gateway/api';
// import SynchMediawiki from './task/synch-mediawiki';
import Team, {
  SiteType,
} from './entity/team';
import TeamCompare from './core/compare';
import { List } from 'immutable';
import { CompareMode, CompareSettings } from './common/base-compare';

dotenv.config();

const REDIS_URL = process.env.TEAMSERVICE_REDIS_URL;
const MONGODB_URL = process.env.TEAMSERVICE_MONGODB_URL;
const HTTP_PORT = Number.parseInt(process.env.TEAMSERVICE_API_PORT, 10);

const dbOptions: ConnectionOptions = {
  type: 'mongodb',
  url: MONGODB_URL,
  logging: ['query', 'error'],
  entities: [Team],
};

async function main() {
  const connection = await createConnection(dbOptions);
  const api = await apiGateway(HTTP_PORT);

  // const task = new SynchMediawiki(connection.getMongoRepository('Team'));
  //await task.run();

  // const wiki = await wikiJS({
  //   // apiUrl: 'http://lol.gamepedia.com/api.php',
  // });

  // const page = await wiki.page('title')

}

main();
