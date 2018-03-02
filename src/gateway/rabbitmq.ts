import * as rabbot from 'rabbot';
import { ObjectId } from 'mongodb';
import TeamEntity from '../entity/team';
import { getConnection, ConnectionManager } from 'typeorm';
import { Container } from 'inversify';



export function initRabbitMQ(container: Container) {
  rabbot.handle('get-by-ids', async ({ body, reply }) => {
    const teamIds = body.map(id => new ObjectId(id));

    const repository = container.get<ConnectionManager>('connectionmanager')
      .get().getMongoRepository<TeamEntity>(TeamEntity);

    const teams = await repository.findByIds(teamIds);

    return reply({
      teams,
    });
  });
}
