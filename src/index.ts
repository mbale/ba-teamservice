import SynchMediaWiki from './task/synch-mediawiki';
import Game from './entity/game';
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as Queue from 'bull';
import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import wikiJS from 'wikijs';
import apiGateway from './gateway/api';
import Team, {
  SiteType,
} from './entity/team';
import TeamCompare from './core/team-compare';
import { List } from 'immutable';
import { CompareMode, CompareSettings } from './common/base-compare';

dotenv.config();

const REDIS_URL = process.env.TEAM_SERVICE_REDIS_URL;
const HTTP_PORT = Number.parseInt(process.env.TEAM_SERVICE_API_PORT, 10);

async function main() {
  const api = await apiGateway(HTTP_PORT);
  const task = await SynchMediaWiki();
  // await task.run();

  const wiki = await wikiJS({
    apiUrl: 'http://lol.gamepedia.com/api.php',
  });

}

main();
