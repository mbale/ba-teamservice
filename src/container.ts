import * as dotenv from 'dotenv';
import * as express from 'express';
import * as Queue from 'bull';
import * as rabbot from 'rabbot';
import * as winston from 'winston';
import GameEntity from './entity/game';
import TeamEntity from './entity/team';
import TeamHTTPController from './gateway/api';
import TeamTaskService from './service/task';
import wikiJS from 'wikijs';
import { ConnectionManager, ConnectionOptions, useContainer as useContainerDB } from 'typeorm';
import { Container } from 'inversify';
import {
  IdentifierHandler,
  IdentifierTypes,
  LoggingMiddleware,
  rabbitMQConfig,
  } from 'ba-common';
import { initRabbitMQ } from './gateway/rabbitmq';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { List, Map } from 'immutable';
import { ObjectId } from 'mongodb';
import { useContainer, useExpressServer } from 'routing-controllers';
import 'winston-mongodb';
 // inject

dotenv.config();

const RABBITMQ_URI = process.env.RABBITMQ_URI;
const HTTP_PORT = Number.parseInt(process.env.TEAM_SERVICE_API_PORT, 10);
const MONGODB_URL = process.env.TEAM_SERVICE_MONGODB_URL;
const REDIS_URL = process.env.TEAM_SERVICE_REDIS_URL;

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
    RabbitMQ layer
  */

  const exchanges = [
    {
      name: 'team-service',
      type: 'topic',
      persistent: true,
    },
  ];

  const queues = [
    {
      name: 'team-service', autoDelete: true, subscribe: true,
    },
  ];

  const bindings = [
    {
      exchange: 'team-service', target: 'team-service',
      keys: [
        'get-teams-by-ids',
        'get-games-by-ids',
      ],
    },
  ];

  await rabbot.configure(
    rabbitMQConfig(RABBITMQ_URI, exchanges, queues, bindings,
  ));

  initRabbitMQ(container);

  /*
    Redis and injecting tasks
  */

  enum Queues {
    TeamInfoFetchingMediawiki = 'fetch-team-infos-mediawiki',
    HLTVFetching = 'fetch-team-infos-hltv',
  }

  const handlerStore = Map<Queues, IdentifierHandler[]>()
    // here handlers needs to be wired
    // .set(Queues.TeamInfoFetchingMediawiki, [{
    //   identifier: IdentifierTypes.Mediawiki,
    //   handler: 'fetchMediawikiTeamInfo',
    // }])
    .set(Queues.HLTVFetching,[{
      identifier: IdentifierTypes.Mediawiki,
      handler: 'fetchHLTVTeamInfo',
    }]);

  let queueStore: Map<string, IQueue> = Map();

  for (const [varName, queueName] of Object.entries(Queues)) {
    const queue = new Queue(queueName, REDIS_URL);
    queueStore = queueStore.set(queueName, queue);

    // make the tasks if there is none
    if (await queue.count() === 0) {
      logger.info('Adding default tasks');
      switch (queueName) {
        case Queues.TeamInfoFetchingMediawiki:
          // queue.add(IdentifierTypes.Pinnacle, {}, {
          //   repeat: {
          //     cron: '0 0 * * *', // every day
          //   },
          // });
          // queue.add(IdentifierTypes.Mediawiki, {});
          break;
        case Queues.HLTVFetching:
          // queue.add(IdentifierTypes.Pinnacle, {}, {
          //   repeat: {
          //     cron: '0 0 * * *', // every day
          //   },
          // });
          queue.add(IdentifierTypes.Mediawiki, {});
          break;
        default:
          break;
      }
    }
  }

  container.bind('handlerstore').toConstantValue(handlerStore);
  container.bind('queuestore').toConstantValue(queueStore);

  logger.info(`HandlerStore's OK`);
  logger.info(`QueueStore's OK`);


  container.bind<TeamTaskService>(TeamTaskService).toSelf();

  container.get(TeamTaskService);
  logger.info(`MatchTaskService's OK`);

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
