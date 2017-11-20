import { List } from 'immutable';
import Team from '../entity/team';
import BaseCompare, { CompareMode, CompareSettings } from '../common/base-compare';

class TeamCompare extends BaseCompare {
  protected compareSettings : CompareSettings = {
    mode: CompareMode.StrictAndSimilar,
    thresholds: {
      dice: 0.75,
      levenshtein: 1,
    },
  };
}

export default TeamCompare;
