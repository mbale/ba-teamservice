import { Job, JobPromise } from 'bull';
import wikiJS from 'wikijs';
import { ObjectID } from 'typeorm';
import { List } from 'immutable';
import { JobResult, JobData, BaseTask } from '../common/base-task';
import Team from '../entity/team';

interface SyncMediaWikiTaskResult {

}

class SynchMediaWiki extends BaseTask {
  public async run(jobData? : JobData) {
    const result: SyncMediaWikiTaskResult = {
      data: {},
    };

    const cursor = this.repository.createEntityCursor();
    
    
    return result;
  }
}

export default SynchMediaWiki;
