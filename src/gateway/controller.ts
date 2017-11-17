import { Connection, createConnection, ConnectionOptions } from 'typeorm';
import { Request, Response, Context } from 'koa';
import { Service, Container, Inject } from 'typedi';
import { JsonController, Get, Req, Res, Ctx, QueryParam, QueryParams, Param } from 'routing-controllers';
import TeamCompare from '../core/team-compare';
import { List, Map } from 'immutable';
import Team from '../entity/team';
import * as dotenv from 'dotenv';
import Game from '../entity/game';
import { ObjectID } from 'bson';
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

  @Get('/compare')
  public async compareTeamName(
    @QueryParam('team-name') teamName : string,
    @QueryParam('game-name') gameName : string,
    @Ctx() ctx : Context) : Promise<Context> {
    const connection = await this._connection;

    const teamCursor = connection
      .getMongoRepository('Team')
      .createEntityCursor();
    const gameRepository = connection.getMongoRepository<Game>(Game);

    const gameCursor = connection
      .getMongoRepository<Game>(Game)
      .createEntityCursor();

    const teamCompare = new TeamCompare();
    // team id connected to game id
    let teamIdByGameId = Map<ObjectID, ObjectID>();
    const gameCompare = new GameCompare();

    /*
      Let's first rule them by team relation
    */
    
    while (await teamCursor.hasNext()) {
      const team : Team = await teamCursor.next();
      const related = teamCompare.runInSequence(teamName, team);

      if (related) {
        teamIdByGameId = teamIdByGameId.set(team._id, team.gameId);
      }
    }

    const relatedTeams = teamCompare.getRelatedByRank();

    /*
      Now compare them based on game type
    */

    let relatedGame : Game = null;

    while (await gameCursor.hasNext()) {
      const game : Game = await gameCursor.next();

      const related = gameCompare.runInSequence(gameName, game);

      if (related) {
        relatedGame = game;
      }
      
    }

    // if (!relatedGame) {
    //   let game = new Game();
    //   game.name = gameName;

    //   game = await gameRepository.save(game);
    // }


    // relatedTeams.forEach(async (team) => {
    //   const game = await gameRepository.findOneById(teamIdByGameId.get(team.entityId));
      
    // })
    

    ctx.body = relatedTeams;

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
