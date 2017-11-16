import { List } from 'immutable';
import Team from '../entity/team';
import BaseCompare, { CompareMode, CompareSettings } from '../common/base-compare';


class TeamCompare extends BaseCompare {
  protected compareSettings : CompareSettings = {
    mode: CompareMode.SimilarOnly,
    thresholds: {
      dice: 0.8,
      levenshtein: 1,
    },
  };
}

export default TeamCompare;
