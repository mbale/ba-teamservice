import { Job, JobPromise } from 'bull';
import wikiJS from 'wikijs';
import { ObjectID, getConnection, ConnectionOptions, getConnectionManager } from 'typeorm';
import { List, Map } from 'immutable';
import Team, { MediaWikiSwitch, MediaWikiSource, MediaWikiSourceType } from '../entity/team';
import Game from '../entity/game';
import * as dotenv from 'dotenv';
import { createConnection } from 'net';
import { load } from 'cheerio';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { ObjectId } from 'bson';
import axios from 'axios';

const MediaWikiAPIUrls = {
  lol: ['http://lol.gamepedia.com/api.php', 'http://wiki.teamliquid.net/dota2/api.php'],
  dota2: 'http://wiki.teamliquid.net/dota2/api.php',
  ow: 'http://overwatch.gamepedia.com/api.php',
  rl:  'http://rocketleague.gamepedia.com/api.php',
  hs: 'http://hearthstone.gamepedia.com/api.php',
};

dotenv.config();

const mongodbURL = process.env.TEAM_SERVICE_MONGODB_URL;

async function fetchMediaWikiTask(jobData? : any) {
  const dbOptions : ConnectionOptions = {
    entities: [Game, Team],
    type: 'mongodb',
    url: mongodbURL,
    logging: ['query', 'error'],
  };
  const connection = await getConnectionManager().create(dbOptions).connect();

  const gameRepository = connection.getMongoRepository<Game>(Game);
  const teamRepository = connection.getMongoRepository<Team>(Team);

  const teamCursor = await connection
    .getMongoRepository<Team>(Team)
    .createEntityCursor({
      '_mediaWiki.switch': MediaWikiSwitch.Automatic,
      '_mediaWiki.sources': {
        $size: 2,
      },
    });

  let counter = 0;

  const apiClients = [];

  while (await teamCursor.hasNext()) {
    const team : Team = await teamCursor.next();
    const game : Game = await gameRepository.findOneById(team.gameId);

    if (game) {
      const API_URLS = [];
      const HTML_FRAGMENT_URLS = [];

      /*
        Identify method of data gathering
      */
      
      for (const source of team._mediaWiki.sources) {
        console.log(source.type === MediaWikiSourceType.API_FETCH)
        if (source.type === MediaWikiSourceType.API_FETCH) {
          // console.log(source)
          const getPageFragment = source.url.split('/');
          console.log(getPageFragment);
          // API_URLS.push(wikiJS({
          //   apiUrl: source.url,
          // }).page());
        }
        if (source.type === MediaWikiSourceType.HTML_PARSE) {
          HTML_FRAGMENT_URLS.push(source.url);
        }
      }

      /*
        Initiate data gathering
      */


    
    }
  }

  console.log(counter)
}

export default fetchMediaWikiTask;
