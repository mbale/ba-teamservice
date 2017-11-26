import { List } from 'immutable';
import TeamEntity from '../entity/team';
import { Compare, CompareSettings, CompareModes, CompareMode } from 'ba-common';

class TeamCompare extends Compare {
  protected compareSettings : CompareSettings = {
    mode: CompareMode.StrictAndSimilar,
    thresholds: {
      dice: 0.75,
      levenshtein: 1,
    },
  };
}

export default TeamCompare;
