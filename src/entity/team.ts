import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectID,
  BeforeUpdate,
  BeforeInsert,
  Index,
} from 'typeorm';
import countryList from 'country-list';
import BaseEntity from '../common/base-entity';

export enum SiteType {
  Facebook, Twitch, Twitter, Instagram,
  YouTube, GooglePlus, Unknown, HomePage, 
}

export interface Site {
  type : SiteType;
  URL : string;
}

export interface Member {
  name: string;
  info?: string;
  joinedIn?: Date;
  countryCode?: string;
  sites?: Site[];
  role?: string;
}

@Entity('teams')
export default class Team extends BaseEntity {
  @Column()
  info? : string = '';

  @Column()
  members? : Member[] = [];

  @Column()
  gameId : ObjectID;

  @Column()
  countryCode? : string = '';

  @Column()
  sites? : Site[] = [];

  @Column()
  logo? : string = '';
}
