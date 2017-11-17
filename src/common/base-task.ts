import BaseEntity from './base-entity';
import { MongoRepository } from 'typeorm'; 

export interface JobResult {}

export interface JobData {}

export abstract class BaseTask {
  public repository : MongoRepository<BaseEntity> = null;

  constructor(repository : MongoRepository<BaseEntity>) {
    this.repository = repository;
  }

  public abstract async run(jobData? : JobData) : Promise<JobResult>;
}
