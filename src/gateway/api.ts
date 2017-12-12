import GameCompare from '../compare/game-compare';
import GameEntity from '../entity/game';
import TeamCompare from '../compare/team-compare';
import TeamEntity from '../entity/team';
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  } from 'typeorm';
import { GetGamesQueryParams, HTTPController } from 'ba-common';
import { inject, injectable } from 'inversify';
import { List, Map } from 'immutable';
import { ObjectId } from 'mongodb';
import { Response } from 'express';
import { 
  JsonController,
  Get, Ctx, Post, 
  Body, QueryParams,
  QueryParam,
  BadRequestError,
  Res,
} from 'routing-controllers';

// interface TeamCompareHTTPRequestParams {
//   'team-name': string;
//   'game-name': string;
// }

// interface TeamCompareHTTPResponse {
//   gameId : ObjectID;
//   teamId : ObjectID;
// }

@injectable()
@JsonController('/api')
class TeamHTTPController extends HTTPController {
  /**
   * Health check
   * 
   * @param {Context} ctx 
   * @returns 
   * @memberof TeamController
   */
  @Get('/')
  public async ping(
    @Res() res : Response,
  ) {
    console.log(this)
    return res.send('ok');
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
    @QueryParams() names : any,
    @Res() res : Response) {

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

    const connection = await this.connection.get();
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

    const response = {
      gameId: game._id,
      teamId: team._id,
    };

    res.send(response);

    return res;
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
    @Res() res: Response) {
    
    let ids : ObjectId[] = [];
    
    if (query.id) {
      if (query.id instanceof Array) {
        ids = query.id.map(id => new ObjectId(id));
      } else {
        ids.push(new ObjectId(query.id));
      }
    }

    let teams : TeamEntity[] = [];

    const connection = await this.connection.get();
    const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

    if (ids.length !== 0) {
      teams = await teamRepository.findByIds(ids);
    } else {
      teams = await teamRepository.find();
    }

    return res.send(teams);
  }


  @Get('/games')
  public async getGameById(
    @QueryParams() query : GetGamesQueryParams,
    @Res() res : Response) {
    const connection = this.connection.get();
    const gameRepository = connection.getMongoRepository<GameEntity>(GameEntity);

    /*
      List all mode
    */
  
    let ids : ObjectId[] = [];
    
    if (query.ids) {
      if (query.ids instanceof Array) {
        ids = query.ids.map(id => new ObjectId(id));
      } else {
        ids.push(new ObjectId(query.ids));
      }
    }

    let games : GameEntity[] = [];
    
    if (ids.length !== 0) {
      games = await gameRepository.findByIds(ids);
      return res.send(games);
    }

    /*
      Query mode
    */

    interface Query {
      slug?: string;
      name?: string;
    }

    const dbQuery: Query = {};

    if (query.slug) {
      dbQuery.slug = query.slug;
    }

    if (query.name) {
      dbQuery.name = query.name;
    }

    games = await gameRepository.find(dbQuery);

    res.send(games);
  }
}


export default TeamHTTPController;
