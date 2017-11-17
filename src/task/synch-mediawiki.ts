import { Job, JobPromise } from 'bull';
import wikiJS from 'wikijs';
import { ObjectID } from 'typeorm';
import { List } from 'immutable';
import { JobResult, JobData, BaseTask } from '../common/base-task';
import Team from '../entity/team';

class SychMediawiki extends BaseTask {
  public async run(jobData? : JobData) {
    const result: JobResult = {
      data: {}
    }

    const cursor = this.repository.createEntityCursor();

    async function getGamename(gameId : ObjectID ) {
      if (!gameId) {
        throw new TypeError('');
      }
    }

    // loop in stream
    while (await cursor.hasNext()) {
      const team : Team = await cursor.next();

      // team._settings = {
      //   mediawiki: true
      // }

      await this.repository.save(team);
    }

    
    
    return Promise.resolve(result);
  }
}

export default SychMediawiki;
