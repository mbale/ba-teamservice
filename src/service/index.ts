import * as Queue from 'bull';

export async function createBullQueues(REDIS_URL : string) {
  if (!REDIS_URL) {
    throw new Error('Missing redis URL');
  }
}
