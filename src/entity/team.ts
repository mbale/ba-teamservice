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
import { ServiceEntity, Team, TeamMember, TeamSocialSite } from 'ba-common';

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


@Entity('teams')
class TeamEntity extends ServiceEntity implements Team {
  @Column()
  info? : string = '';

  @Column()
  members? : TeamMember[] = [];

  @Column()
  gameId : ObjectID;

  @Column()
  countryCode? : string = '';

  @Column()
  site : string = '';

  @Column()
  socialSites : TeamSocialSite[] = [];

  @Column()
  logo? : string = '';
}

export default TeamEntity;
