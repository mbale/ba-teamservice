import { Connection, createConnection, ConnectionOptions } from 'typeorm';
import { Request, Response, Context } from 'koa';
import { Service, Container, Inject } from 'typedi';
import { 
  JsonController,
  Get, Ctx, Post, 
  Body, QueryParams,
  QueryParam,
  BadRequestError,
} from 'routing-controllers';
import TeamCompare from '../compare/team-compare';
import GameCompare from '../compare/game-compare';
import { List, Map } from 'immutable';
import TeamEntity from '../entity/team';
import * as dotenv from 'dotenv';
import GameEntity from '../entity/game';
import { ObjectId, ObjectID } from 'bson';
import { dIConnection } from 'ba-common';

dotenv.config();

const MONGODB_URL = process.env.TEAM_SERVICE_MONGODB_URL;

interface TeamCompareHTTPRequestParams {
  'team-name': string;
  'game-name': string;
}

interface TeamCompareHTTPResponse {
  gameId : ObjectID;
  teamId : ObjectID;
}


@Service()
@JsonController('/api')
export default class TeamController {
  constructor(
    @dIConnection(MONGODB_URL, [TeamEntity, GameEntity], Container) private _connection : Connection) {}

  /**
   * Health check
   * 
   * @param {Context} ctx 
   * @returns 
   * @memberof TeamController
   */
  @Get('/')
  public async ping(@Ctx() ctx : Context) {
    ctx.body = 'ok';
    return ctx;
  }

  /**
   * Check if we have a team with such game already
   * If not saves it
   * 
   * @param {string} teamName 
   * @param {string} gameName 
   * @param {Context} ctx 
   * @returns {Promise<Context>} 
   * @memberof TeamController
   */
  @Post('/compare')
  public async compareTeamName(
    @QueryParams() names : TeamCompareHTTPRequestParams,
    @Ctx() ctx : Context) : Promise<Context> {

    if (!names) {
      throw new BadRequestError('Missing object');
    }

    if (!names['team-name'] || !names['game-name']) {
      throw new BadRequestError('Missing one or two key');
    }
    
    const {
      'game-name': gameName,
      'team-name': teamName,
    } = names;

    if (gameName.length === 0 || teamName.length === 0) {
      throw new BadRequestError('Empty values');
    }

    const connection = await this._connection;
    const gameRepository = connection.getMongoRepository<GameEntity>(GameEntity);
    const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

    const gameCursor = connection
      .getMongoRepository<GameEntity>(GameEntity)
      .createEntityCursor();

    const teamCompare = new TeamCompare();
    const gameCompare = new GameCompare();

    /*
      Let's get game first
    */

    let game : GameEntity = null;
    
    while (await gameCursor.hasNext()) {
      const gameInDb : GameEntity = await gameCursor.next();
      
      const related = gameCompare.runInSequence(gameName, gameInDb);

      if (related) {
        game = gameInDb;
        // we found the correct game so break out of loop
        break;
      }
    }

    if (!game) {
      game = new GameEntity();
      game.name = gameName;
      game = await gameRepository.save(game);
    }

    /*
      Now let's find the team
    */

    const teamCursor = connection
      .getMongoRepository('Team')
      .createEntityCursor({
        gameId: game._id,
      });

    let team : TeamEntity = null;
    
    while (await teamCursor.hasNext()) {
      const team : TeamEntity = await teamCursor.next();
      const related = teamCompare.runInSequence(teamName, team);
    }

    const relatedTeam = teamCompare.getRelatedByRank()[0];

    // we've similar with that
    if (relatedTeam) {
      team = await teamRepository.findOneById(relatedTeam.entityId);
    } else {
    // we make it
      team = new TeamEntity();
      team.name = teamName;
      team.gameId = game._id;
      team = await teamRepository.save(team);
    }

    const response : TeamCompareHTTPResponse = {
      gameId: game._id,
      teamId: team._id,
    };

    ctx.body = response;

    return ctx;
  }

  /**
   * Fetch or query teams
   * 
   * @param {*} query 
   * @param {Context} ctx 
   * @returns {Promise<Context>} 
   * @memberof TeamController
   */
  @Get('/teams')
  public async fetchTeams(
    @QueryParams() query : any, 
    @Ctx() ctx : Context) : Promise<Context> {
    
    let ids : ObjectId[] = [];
    
    if (query.id) {
      if (query.id instanceof Array) {
        ids = query.id.map(id => new ObjectId(id));
      } else {
        ids.push(new ObjectId(query.id));
      }
    }

    let teams : TeamEntity[] = [];

    const connection = await this._connection;
    const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

    if (ids.length !== 0) {
      teams = await teamRepository.findByIds(ids);
    } else {
      teams = await teamRepository.find();
    }

    ctx.body = teams;

    return ctx;
  }


  @Get('/games')
  public async getGameById(
    @QueryParams() query : any,
    @Ctx() ctx : Context) : Promise<Context> {
    let ids : ObjectId[] = [];
    const connection = await this._connection;
    const gameRepository = connection.getMongoRepository<GameEntity>(GameEntity);
    
    if (query.id) {
      if (query.id instanceof Array) {
        ids = query.id.map(id => new ObjectId(id));
      } else {
        ids.push(new ObjectId(query.id));
      }
    }

    let games : GameEntity[] = [];
    
    if (ids.length !== 0) {
      games = await gameRepository.findByIds(ids);
    } else {
      games = await gameRepository.find();
    }

    ctx.body = games;

    return ctx;
  }
}
