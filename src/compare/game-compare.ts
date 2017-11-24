import { List } from 'immutable';
import Team from '../entity/team';
import { Compare, CompareSettings, CompareMode } from 'ba-common';

class GameCompare extends Compare {
  protected compareSettings : CompareSettings = {
    mode: CompareMode.StrictOnly,
    thresholds: {
      dice: 0.8,
      levenshtein: 1,
    },
  };
}

export default GameCompare;
