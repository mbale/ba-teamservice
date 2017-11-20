import { CompareHTTPResponse, CompareHTTPResponseType } from '../common/base-api';
import { Connection, createConnection, ConnectionOptions } from 'typeorm';
import { Request, Response, Context } from 'koa';
import { Service, Container, Inject } from 'typedi';
import { JsonController, Get, Ctx, QueryParam, Post, Body } from 'routing-controllers';
import TeamCompare from '../core/team-compare';
import { List, Map } from 'immutable';
import Team from '../entity/team';
import * as dotenv from 'dotenv';
import Game from '../entity/game';
import { ObjectID, ObjectId } from 'bson';
import GameCompare from '../core/game-compare';

dotenv.config();

const MONGODB_URL = process.env.TEAM_SERVICE_MONGODB_URL;

export function connection() {
  return function (object : object, propertyName : string, index? : number) {
    const dbOptions : ConnectionOptions = {
      type: 'mongodb',
      url: MONGODB_URL,
      logging: ['query', 'error'],
      entities: [Team, Game],
    };
    const connection = createConnection(dbOptions);
    Container.registerHandler({ object, propertyName, index, value: () => connection });
  };
}

@Service()
@JsonController('/api')
export default class TeamController {
  constructor(@connection() private _connection : Connection) {}

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
    @QueryParam('team-name') teamName : string,
    @QueryParam('game-name') gameName : string,
    @Body() body : string,
    @Ctx() ctx : Context) : Promise<Context> {

    console.log(body);

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

    const response : CompareHTTPResponse = {
      type: CompareHTTPResponseType.Match,
      gameId: game._id,
      teamId: team._id,
    };

    ctx.body = response;

    return ctx;
  }

  @Get('/teams')
  public async getTeamById(
    @QueryParam('ids') ids : ObjectID[], @Ctx() ctx : Context) : Promise<Context> {
    const connection = await this._connection;
    const teamRepository = connection.getMongoRepository<Team>(Team);
  
    ids = ids.map(id => new ObjectID(id));
    const results = await teamRepository.findByIds(ids);

    ctx.body = results;

    return ctx;
  }
}
