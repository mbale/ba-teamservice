import { List, Map } from 'immutable';
import {
  ObjectID,
  ObjectIdColumn,
  Column,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';

enum SourceType {
  Pinnacle = 'pinnacle',
  OddsGG = 'oddsgg',
}

interface Source {
  type: SourceType;
  leagueID?: number;
  matchID?: number;
  _createdAt: Date;
}

export interface ServiceEntitySettings {}

abstract class BaseEntity {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  name : string;

  @Column()
  _sources : Source[];

  @Column()
  _keywords : string[] = [];
  
  @Column()
  _createdAt : Date;

  @Column()
  _updatedAt : Date;

  @Column()
  abstract _settings : ServiceEntitySettings;

  @BeforeInsert()
  updateCreationDate() {
    this._createdAt = new Date();
  }  

  @BeforeUpdate()
  updateModificationDate() {
    this._updatedAt = new Date();
  }
};

export default BaseEntity;
