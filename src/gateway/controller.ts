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
import TeamCompare from '../core/team-compare';
import { List, Map } from 'immutable';
import Team from '../entity/team';
import * as dotenv from 'dotenv';
import Game from '../entity/game';
import { ObjectId, ObjectID } from 'bson';
import GameCompare from '../core/game-compare';
import { connection } from '../common/base-utilities';

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
  constructor(@connection(MONGODB_URL, [Team, Game]) private _connection : Connection) {}

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
    const gameRepository = connection.getMongoRepository<Game>(Game);
    const teamRepository = connection.getMongoRepository<Team>(Team);

    const gameCursor = connection
      .getMongoRepository<Game>(Game)
      .createEntityCursor();

    const teamCompare = new TeamCompare();
    const gameCompare = new GameCompare();

    /*
      Let's get game first
    */

    let game : Game = null;
    
    while (await gameCursor.hasNext()) {
      const gameInDb : Game = await gameCursor.next();

      const related = gameCompare.runInSequence(gameName, gameInDb);

      if (related) {
        game = gameInDb;
        // we found the correct game so break out of loop
        break;
      }
    }

    if (!game) {
      game = new Game();
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

    let team : Team = null;
    
    while (await teamCursor.hasNext()) {
      const team : Team = await teamCursor.next();
      const related = teamCompare.runInSequence(teamName, team);
    }

    const relatedTeam = teamCompare.getRelatedByRank().first();

    // we've similar with that
    if (relatedTeam) {
      team = await teamRepository.findOneById(relatedTeam.entityId);
    } else {
    // we make it
      team = new Team();
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

  @Get('/teams')
  public async getTeamById(
    @QueryParam('ids') ids : ObjectID[], 
    @Ctx() ctx : Context) : Promise<Context> {

    if (!ids) {
      throw new BadRequestError();
    }

    const connection = await this._connection;
    const teamRepository = connection.getMongoRepository<Team>(Team);
  
    ids = ids.map(id => new ObjectID(id));
    const results = await teamRepository.findByIds(ids);

    ctx.body = results;

    return ctx;
  }
}