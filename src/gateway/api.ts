import * as Koa from 'koa';
import * as Router from 'koa-router';
import { List } from 'immutable';
import { Connection } from 'typeorm';
import { Container } from 'typedi';
import { useKoaServer, useContainer } from 'routing-controllers';
import Team from '../entity/team';
import TeamCompare from '../core/compare';
import ApiController from './controllers';

async function apiGateway(port: number): Promise<Koa> {
  const API_PORT = port;
  const app = new Koa();

  useContainer(Container);
  useKoaServer(app, {
    controllers: [ApiController],
  });
  
  app.listen(API_PORT, () => {
    console.log(`Listening on ${API_PORT}`);
  });

  return app;
}

export default apiGateway;