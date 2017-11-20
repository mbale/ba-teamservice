import { ObjectID } from 'bson';

export enum CompareHTTPResponseType {
  Match, NoMatch,
}

export interface CompareHTTPResponse {
  type : CompareHTTPResponseType;
  gameId? : ObjectID;
  teamId? : ObjectID;
}

