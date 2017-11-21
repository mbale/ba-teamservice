import { Job, JobPromise } from 'bull';
import wikiJS from 'wikijs';
import { ObjectID, getConnection, ConnectionOptions, getConnectionManager } from 'typeorm';
import { List, Map } from 'immutable';
import Team, { MediaWikiSwitch } from '../entity/team';
import Game from '../entity/game';
import * as dotenv from 'dotenv';
import { createConnection } from 'net';
import * as cheerio from 'cheerio';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

const MediaWikiAPIUrls = {
  lol: 'http://lol.gamepedia.com/api.php',
  dota2: 'http://dota2.gamepedia.com/api.php',
  ow: 'http://overwatch.gamepedia.com/api.php',
  rl:  'http://rocketleague.gamepedia.com/api.php',
  hs: 'http://hearthstone.gamepedia.com/api.php',
};

dotenv.config();

const mongodbURL = process.env.TEAM_SERVICE_MONGODB_URL;

async function synchMediaWikiTask(jobData? : any) {
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
      // _mediaWiki: {
      //   switch: MediaWikiSwitch.Automatic,
      // },
    }).limit(10);

  let counter = 0;

  const apiClients = Map<string, typeof wikiJS>();

  while (await teamCursor.hasNext()) {
    const team : Team = await teamCursor.next();
    const game : Game = await gameRepository.findOneById(team.gameId);

    if (game) {
      if (MediaWikiAPIUrls[game.slug]) {
        const client = apiClients.get(game.slug, wikiJS)({
          apiUrl: MediaWikiAPIUrls.lol,
        });
        try {
          const page = await client.page(team.name);

          /*
            HTML parsing
          */

          const $ = cheerio.load(await page.html());
          console.log($('#Player_Roster')

          // console.log(await page.html())
          
          counter += 1;
        } catch (error) {
          
        }
      }
    }
  }

  console.log(counter)
}

export default synchMediaWikiTask;
