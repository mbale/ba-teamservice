import * as dotenv from 'dotenv';
import * as express from 'express';
import * as winston from 'winston';
import GameEntity from './entity/game';
import TeamEntity from './entity/team';
import TeamHTTPController from './gateway/api';
import { ConnectionManager, ConnectionOptions, useContainer as useContainerDB } from 'typeorm';
import { Container } from 'inversify';
import { LoggingMiddleware } from 'ba-common';
import { useContainer, useExpressServer } from 'routing-controllers';
import 'winston-mongodb';
 // inject

dotenv.config();

const HTTP_PORT = Number.parseInt(process.env.TEAM_SERVICE_API_PORT, 10);
const MONGODB_URL = process.env.TEAM_SERVICE_MONGODB_URL;

async function main() {
  const container = new Container({
    autoBindInjectable: false,
  });

  /*
    Logger
  */

  const logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)({ level: 'info' }),
      new winston.transports.MongoDB({
        level: 'error',
        db: MONGODB_URL,
        collection: 'logs',
        storeHost: true, // origin of log (hostname)
        tryReconnect: true, // we make sure we always log
      }),
    ],
  });

  logger.transports.mongodb.on('error', err => console.log(err));
  logger.unhandleExceptions(logger.transports.MongoDB);
  container.bind('logger').toConstantValue(logger);
  logger.info(`Logging's OK`);

  /*
    Database
  */

  const dbOptions : ConnectionOptions = {
    entities: [TeamEntity, GameEntity],
    type: 'mongodb',
    url: MONGODB_URL,
    logging: ['query', 'error'],
  };

  const connectionManager = new ConnectionManager();
  await connectionManager.create(dbOptions).connect();

  container.bind('connectionmanager').toConstantValue(connectionManager);
  logger.info(`DB's OK`);

  /*
    REST API
  */

  container.bind<TeamHTTPController>(TeamHTTPController).toSelf();
  logger.info(`TeamHTTPService's OK`);
  container.bind(LoggingMiddleware).toSelf();
  logger.info(`LoggingMiddleware's OK`);

  const app = express();

  useExpressServer(app, {
    // cors: true,
    validation: true,
    middlewares: [LoggingMiddleware],
  });

  app.listen(HTTP_PORT, () => {
    logger.info(`API's listening on ${HTTP_PORT}`);
  });

  // routing controllers will get any resolution from our global store
  useContainer(container);
  useContainerDB(container, {
    fallback: false,
    fallbackOnErrors: false,
  });

  logger.info(`Container's bootstrapped`);

  return container;
}

export default main;