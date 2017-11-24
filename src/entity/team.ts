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

export interface Member {
  name: string;
  info?: string;
  joinedIn?: Date;
  countryCode?: string;
  sites?: string[];
  role?: string;
}

export enum MediaWikiSwitch {
  Manual, Automatic,
}

export enum MediaWikiSourceType {
  API_FETCH, HTML_PARSE,
}

export interface MediaWikiHTMLSource {
  type : MediaWikiSourceType.HTML_PARSE;
  tableSelector : string;
}

export interface MediaWikiAPISource {
  type: MediaWikiSourceType.API_FETCH;
  apiBaseUrl : string;
  pageName : string;
}

export interface MediaWikiSetting {
  switch : MediaWikiSwitch;
  sources : MediaWikiAPISource[] | MediaWikiHTMLSource[];
  lastFetch : Date;
}

export enum SocialSiteType {
  Facebook, Twitter,
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
  site : string = '';

  @Column()
  socialSites : {
    type : SocialSiteType,
    name : string;
  }[] = [];

  @Column()
  logo? : string = '';

  @Column()
  _mediaWiki : MediaWikiSetting = {
    switch: MediaWikiSwitch.Automatic,
    sources: [],
    lastFetch: null,
  };
}
