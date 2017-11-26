import { Job, JobPromise } from 'bull';
import wikiJS from 'wikijs';
import { ObjectID, getConnection, ConnectionOptions, getConnectionManager } from 'typeorm';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import * as dotenv from 'dotenv';
import { load } from 'cheerio';
import { List, Map } from 'immutable';
import { ObjectId } from 'bson';
import axios from 'axios';
import countryList from 'country-list';
import TeamEntity, { MediaWikiSwitch, MediaWikiSourceType } from '../entity/team';
import Game from '../entity/game';
import { TeamSocialSiteType } from 'ba-common';

dotenv.config();

const mongodbURL = process.env.TEAM_SERVICE_MONGODB_URL;

/**
 * Checks mediawiki data and tries to associate with our data on isolated model scope
 * 
 * @param {typeof wikiJS} client 
 * @param {string} apiUrl 
 * @param {any} pageName 
 * @param {TeamEntity} team 
 * @returns 
 */
async function 
analyseMediaWikiPage(client: typeof wikiJS, apiUrl : string, pageName, team : TeamEntity) {
  try {
    const client = await wikiJS({
      apiUrl, 
    });

    try {
      const page = await client.page(pageName);
      const info : any = await page.info();

      /*
        Check each field in page
      */
      if (info.name) {
        const already = team._keywords.find(k => k === info.name);

        if (!already) {
          team._keywords.push(info.name);
        }
      }

      if (info.location) {
        const countryCode = countryList().getCode(info.location);

        if (countryCode) {
          team.countryCode = countryCode;
        }
      }

      if (info.website) {
        const already = team.site === info.website;

        if (!already) {
          team.site = info.website;
        }
      }

      if (info.facebook) {
        const already = team.socialSites.find(s => s === info.facebook);

        if (!already) {
          team.socialSites.push({
            type: TeamSocialSiteType.Facebook,
            name: info.facebook,
          });
        }
      }

      if (info.twitter) {
        const already = team.socialSites.find(s => s === info.twitter);
        
        if (!already) {
          team.socialSites.push({
            type: TeamSocialSiteType.Twitter,
            name: info.twitter,
          });
        }
      }

      if (info.image) {
        try {
          const imagesURLS : string[] = await page.images();
          const mainImageURL = imagesURLS
            .find(u => u.toLowerCase().includes(info.image.toLowerCase()));

          if (mainImageURL) {
            team.logo = mainImageURL;
          }
        } catch (error) {
          
        }
      }
    } catch (error) {
      console.log(error)
      return null;
    }
  } catch (error) {
    console.log(error)
    return null;
  }
}

/**
 * Gathers team information from mediawiki api and html parsing
 * and updates team entities
 * 
 * @param {*} [jobData] 
 */
async function fetchMediaWikiTask(jobData? : any) {
  const dbOptions : ConnectionOptions = {
    entities: [Game, TeamEntity],
    type: 'mongodb',
    url: mongodbURL,
    logging: ['query', 'error'],
  };
  const connection = await getConnectionManager().create(dbOptions).connect();

  const gameRepository = connection.getMongoRepository<Game>(Game);
  const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

  const teamCursor = await connection
    .getMongoRepository<TeamEntity>(TeamEntity)
    .createEntityCursor({
      '_mediaWiki.switch': MediaWikiSwitch.Automatic,
    });

  const apiClients = [];

  while (await teamCursor.hasNext()) {
    const team : TeamEntity = await teamCursor.next();
    const game : Game = await gameRepository.findOneById(team.gameId);

    if (game) {
      const API_URLS = [];
      const HTML_FRAGMENT_URLS = [];

      /*
        Identify method of data gathering
      */
      
      for (const source of team._mediaWiki.sources) {
        /*
          Fetching API
        */
        if (source.type === MediaWikiSourceType.API_FETCH) {
          try {
            const data = analyseMediaWikiPage(wikiJS, source.apiBaseUrl, source.pageName, team);
          } catch (error) {
            console.log(error)
          }
        }
        /*
          HTML parsing
        */
        if (source.type === MediaWikiSourceType.HTML_PARSE) {
          
        }
      }
    }
  }
}

export default fetchMediaWikiTask;
