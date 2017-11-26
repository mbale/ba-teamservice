import fetchMediaWikiData from './task/fetch-mediawiki-data';
import Game from './entity/game';
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as Queue from 'bull';
import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import wikiJS from 'wikijs';
import apiGateway from './gateway/api';
import TeamEntity from './entity/team';
import TeamCompare from './compare/team-compare';

dotenv.config();

const REDIS_URL = process.env.TEAM_SERVICE_REDIS_URL;
const HTTP_PORT = Number.parseInt(process.env.TEAM_SERVICE_API_PORT, 10);

async function main() {
  const api = await apiGateway(HTTP_PORT);
  const queue = await fetchMediaWikiData();
  // await task.run();

}

main();
