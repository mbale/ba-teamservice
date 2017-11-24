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
import { ServiceEntity } from 'ba-common';

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

export enum MediaWikiSwitch {
  Manual, Automatic,
}

export enum MediaWikiSourceType {
  API_FETCH, HTML_PARSE,
}

export interface MediaWikiSource {
  type: MediaWikiSourceType;
  url: string;
}

export interface MediaWikiSetting {
  switch : MediaWikiSwitch;
  sources : MediaWikiSource[];
  lastFetch : Date;
}

@Entity('teams')
export default class Team extends ServiceEntity {
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

  @Column()
  _mediaWiki : MediaWikiSetting = {
    switch: MediaWikiSwitch.Automatic,
    sources: [],
    lastFetch: null,
  };
}
