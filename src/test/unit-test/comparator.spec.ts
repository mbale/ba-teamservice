// import { AsyncTest, Expect, Test, TestCase, TestFixture, SetupFixture, AsyncSetupFixture } from "alsatian";
// import { Connection, ConnectionOptions, MongoRepository, Repository } from 'typeorm';
// import { Mock, IMock, MockBehavior, It, } from 'typemoq';
// import * as Queue from 'bull';
// import * as dotenv from 'dotenv';
// import FetchMediaWiki from '../../task/fetch-mediawiki-data';

// import TeamEntity from '../../entity/team';
// // import apiGateway from '../../gateway/api';

// dotenv.config();

// // @TestFixture("Testing SyncMediawikiTask")
// // export class SyncMediawikiTaskTests {
// //   private taskMock : IMock<SynchMediawiki> = null;
// //   private repositoryMock : IMock<MongoRepository<Team>> = null;

// //   @AsyncSetupFixture
// //   public async setupDependencies() {
// //     const repositoryMocked : IMock<MongoRepository<Team>> = Mock.ofType(MongoRepository);
// //     const taskMocked : IMock<SynchMediawiki> = Mock.ofType(SynchMediawiki, MockBehavior.Loose, false, repositoryMocked);
// //     const mockedTeams : Team[] = [];

// //     const team = new Team();
// //     team.name = 'joska';

// //     mockedTeams.push(team);

// //     repositoryMocked
// //         .setup(m => m.createEntityCursor(It.isAny()))

// //     this.repositoryMock = repositoryMocked;
// //     this.taskMock = taskMocked;
// //     repositoryMocked.object.createEntityCursor().next()
// //   }

// //   @TestCase()
// //   @Test("addition tests")
// //   public async addTest(firstNumber : number, secondNumber : number, expectedSum : number) {
      
// //       Expect(firstNumber + secondNumber).toBe(expectedSum);
// //   }
// // }