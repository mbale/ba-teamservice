import * as Koa from 'koa';
import * as Router from 'koa-router';
import { Container } from 'typedi';
import { useKoaServer, useContainer } from 'routing-controllers';
import ApiController from './controller';

async function apiGateway(port: number): Promise<Koa> {
  const app = new Koa();

  useContainer(Container);
  useKoaServer(app, {
    controllers: [ApiController],
  });
  
  app.listen(port, () => {
    console.log(`Listening on ${port}`);
  });

  return app;
}

export default apiGateway;
