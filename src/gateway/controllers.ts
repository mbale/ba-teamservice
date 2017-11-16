import { Connection, createConnection, ConnectionOptions } from 'typeorm';
import { Request, Response, Context } from 'koa';
import { Service, Container, Inject } from 'typedi';
import { JsonController, Get, Req, Res, Ctx, QueryParam, QueryParams, Param } from 'routing-controllers';
import TeamCompare from '../core/compare';
import { List } from 'immutable';
import Team from '../entity/team';
import * as dotenv from 'dotenv';
import { ObjectID } from 'bson';

dotenv.config();

const MONGODB_URL = process.env.TEAMSERVICE_MONGODB_URL;
const HTTP_PORT = Number.parseInt(process.env.TEAMSERVICE_API_PORT, 10);

export function connection() {
  return function (object : object, propertyName : string, index? : number) {
    const dbOptions : ConnectionOptions = {
      type: 'mongodb',
      url: MONGODB_URL,
      logging: ['query', 'error'],
      entities: [Team],
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

  @Get('/compare-team-name')
  public async compareTeamName(
    @QueryParam('name') name : string,  
    @Ctx() ctx : Context) : Promise<Context> {
    const connection = await this._connection;

    const cursor = connection
      .getMongoRepository('Team')
      .createEntityCursor();

    const teamCompare = new TeamCompare();

    const results = List();
    
    while (await cursor.hasNext()) {
      const team : Team = await cursor.next();

      teamCompare.compareUnitWithEntity(name, team);
      teamCompare.rankByOverall();
    }

    // literate through entities

    

    ctx.body = results;
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
