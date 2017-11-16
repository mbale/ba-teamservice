import BaseEntity from './base-entity';
import { EntitySchema } from 'typeorm';
import { List, Map, Collection } from 'immutable';
import {
  similarity,
} from 'talisman/metrics/distance/dice';
import levenshtein from 'talisman/metrics/distance/levenshtein';
import apiGateway from '../gateway/api';

export class AppError extends Error {
  constructor(message : string) {
    super(message);

    Error.captureStackTrace(this, this.constructor);
    
    // just in case we save name of class too
    this.name = this.constructor.name;
  }
}

/**
 * Type of mode result
 * 
 * @enum {number}
 */
enum ModeResultType {
  NoMatch, MainIdentifierMatch, KeywordIdentifierMatch,
}

interface CompareModeResult {
  type : ModeResultType;
}

/**
 * Interface of strict compare mode result
 * 
 * @export
 * @interface StrictCompareModeResult
 */
export interface StrictCompareModeResult extends CompareModeResult {
}

/**
 * Interface of similar compare mode result
 * 
 * @export
 * @interface SimilarCompareModeResult
 */
export interface SimilarCompareModeResult extends CompareModeResult {
  entity? : BaseEntity;
}

/**
 * Requested setting to how we compare 
 * 
 * @export
 * @enum {number}
 */
export enum CompareMode {
  StrictOnly, SimilarOnly, StrictAndSimilar,
}

/**
 * Contains limit for calculation
 * dice: between to unit
 * levenshtein: numerical distance
 * 
 * @export
 * @interface Thresholds
 */
export interface Thresholds {
  dice: number;
  levenshtein: number;
}

/**
 * Compare options object for compare service
 * 
 * @export
 * @interface CompareSettings
 */
export interface CompareSettings {
  mode : CompareMode;
  thresholds : Thresholds;
}

export interface CompareResult {
  result : CompareModeResult;
}

export interface EntitySimilarity {
  entity : BaseEntity;
  connection : ModeResultType;
  dice: number;
}

/**
 * Base abstract class that contains all core functionality for extending further compare services
 * 
 * @abstract
 * @class BaseCompare
 */
abstract class BaseCompare {

  /**
   * The string which we compare
   * 
   * @protected
   * @type {string}
   * @memberof BaseCompare
   */
  protected unit : string = null;

  /**
   * The collection in which we search for
   * 
   * @protected
   * @type {List<BaseEntity>}
   * @memberof BaseCompare
   */
  protected collection : List<BaseEntity> = null;
  
  /**
   * Contains all related entities by strict sequence
   * 
   * @protected
   * @type {List<BaseEntity>}
   * @memberof BaseCompare
   */
  protected relatedStrictEntities : List<BaseEntity> = List();

  /**
   * Contains all related entities by similar sequence
   * 
   * @protected
   * @type {List<BaseEntity>}
   * @memberof BaseCompare
   */
  protected relatedSimilarEntities : List<BaseEntity> = List();
  
  /**
   * Default compare settings which contains mode and threshold
   * 
   * @protected
   * @abstract
   * @type {CompareSettings}
   * @memberof BaseCompare
   */
  protected abstract compareSettings : CompareSettings;

  /**
   * Creates an instance of BaseCompare.
   * 
   * @param {List<BaseEntity>} collection 
   * @memberof BaseCompare
   */
  constructor(collection?: List<BaseEntity>) {
    if (collection && collection.count() === 0) {
      throw new Error('Empty collection');
    } else {
      this.collection = collection;
    }
  }

  /**
   * Compare unit with entity
   * 
   * @param {string} unit 
   * @param {BaseEntity} entity 
   * @returns {CompareResult} 
   * @memberof BaseCompare
   */
  public compareUnitWithEntity(unit : string, entity : BaseEntity) {
    if (!unit) {
      throw new Error('Missing unit to test');
    }

    if (!entity) {
      throw new Error('Missing entity to compare');
    }

    this.unit = unit;

    const {
      mode,
      thresholds,
    } = this.compareSettings;

    const {
      StrictOnly,
      SimilarOnly,
      StrictAndSimilar,
    } = CompareMode;

    enum CompareModes {
      Strict, Similar,
    }

    interface RelatedEntity {
      /**
       * Entity which unit is related to
       * 
       * @type {BaseEntity}
       * @memberof RelatedEntity
       */
      entity : BaseEntity;
      /**
       * Relation type which shows how it relates in comparison
       * strict | similar
       * 
       * @type {CompareModes}
       * @memberof RelatedEntity
       */
      relationType : CompareModes;
      /**
       * KeyType which shows what key is our base on comparison
       * 
       * @type {(ModeResultType.MainIdentifierMatch | ModeResultType.KeywordIdentifierMatch)}
       * @memberof RelatedEntity
       */
      keyType : ModeResultType.MainIdentifierMatch | ModeResultType.KeywordIdentifierMatch;
      /**
       * KeyValue which contains the value of relation key
       * 
       * @type {string}
       * @memberof RelatedEntity
       */
      keyValue : string;
      /**
       * Contains the value of dice comparison only if similar algorithm ran
       * 
       * @type {number}
       * @memberof RelatedEntity
       */
      diceIndex? : number;
    }

    let relatedEntities = List<RelatedEntity>();

    if (mode === StrictOnly || mode === StrictAndSimilar) {
      const { type, value }  = this.strictCompare(entity);

      switch (type) {
        case ModeResultType.MainIdentifierMatch:
          relatedEntities = relatedEntities.push({
            entity,
            relationType: CompareModes.Strict,
            keyType: ModeResultType.MainIdentifierMatch,
            keyValue: value,
          });
          break;
        case ModeResultType.KeywordIdentifierMatch:
          relatedEntities = relatedEntities.push({
            entity,
            relationType: CompareModes.Strict,
            keyType: ModeResultType.KeywordIdentifierMatch,
            keyValue: value,
          });
        default:
          break;
      }
    }

    if (mode === SimilarOnly || mode === StrictAndSimilar) {
      const r = this.similarCompare(entity);
    }

    if (relatedEntities.count() !== 0) {
      console.log(relatedEntities.first())
    }
    return ;
  }

  public rankByOverall() {
    
  }

  /**
   * Get similarity number between two unit
   * 
   * @protected
   * @param {string} unit1 
   * @param {string} unit2 
   * @returns {number} 
   * @memberof BaseCompare
   */
  protected compareTwoUnits(unit1 : string, unit2 : string) : number {
    return similarity(unit1, unit2);
  }

  /**
   * Sort two array items based on similarity between each other 
   * then returns correlation between them
   * 
   * @protected
   * @param {string[]} unitsA 
   * @param {string[]} unitsB 
   * @returns 
   * @memberof BaseCompare
   */
  protected sortEntitiesByKeywordIdentifier(unitsA : string[], unitsB : string[]) {
    unitsA = unitsA.sort((a, b) => 
      this.compareTwoUnits(this.unit, b) - this.compareTwoUnits(this.unit, a));
    unitsB = unitsB.sort((a, b) => 
      this.compareTwoUnits(this.unit, b) - this.compareTwoUnits(this.unit, a));
    
    return this.compareTwoUnits(unitsA[0], unitsB[0]);
  }

  /**
   * Check if a list contains eligible units based on threshold
   * 
   * @protected
   * @param {List<string>} list 
   * @returns {boolean} 
   * @memberof BaseCompare
   */
  protected filterListByThreshold(list : List<string>) : boolean {
    const eligibleEntityCriteriaCount = list
      .filter(keyword => 
        this.compareTwoUnits(this.unit.toLowerCase(), keyword.toLowerCase()) 
          >= this.compareSettings.thresholds.dice)
      .count();
  
    if (eligibleEntityCriteriaCount !== 0) return true;
    return false;
  }

  /**
   * Sort units based on its similarity values (ASC)
   * 
   * @protected
   * @param {List<string>} units 
   * @returns 
   * @memberof BaseCompare
   */
  protected sortEntitiesBySimilarity(units : List<string>) {
    units.sort((a, b) => 
      this.compareTwoUnits(this.unit, b) - this.compareTwoUnits(this.unit, a));
    
    return units;
  }

  /**
   * Run strict compare on unit 
   * 
   * @protected
   * @returns {StrictCompareModeResult} 
   * @memberof BaseCompare
   */
  protected strictCompare(entity : BaseEntity) {
    const unit = this.unit;
    const keywords = List(entity._keywords);
    // we first check if we've the same by name
    const MainIdentifierMatchMatch = entity.name.toLowerCase() === unit.toLowerCase();
    // then we also check keywords
    const keywordIdentifierMatch = keywords.contains(unit.toLowerCase());

    if (MainIdentifierMatchMatch) {
      // get value
      const mainValue = entity.name;
      return {
        type: ModeResultType.MainIdentifierMatch,
        value: mainValue,
      };
    }

    if (keywordIdentifierMatch) {
      // get that keyword
      const keywordValue = keywords.find(keyword => keyword === unit.toLowerCase());
      return {
        type: ModeResultType.KeywordIdentifierMatch,
        value: keywordValue,
      };
    }

    return {
      type: ModeResultType.NoMatch,
      value : null,
    };
  }

  /**
   * Run similar compare on unit
   * 
   * @protected
   * @returns {SimilarCompareModeResult} 
   * @memberof BaseCompare
   */
  protected similarCompare(entity : BaseEntity) {
    const unit = this.unit;
    const diceThreshold = this.compareSettings.thresholds.dice;
    const keywords = List(entity._keywords);

    const mainIdentifierSimilarity = this.compareTwoUnits(entity.name, unit);

    const keywordsIndexed = keywords
      // calculate their indexes
      .map((keyword) => {
        return {
          keyword,
          value: this.compareTwoUnits(keyword, unit),
        };
      })
      // remove invalids
      .filter(keywordIndexed => keywordIndexed.value >= diceThreshold)
      // sort them by rank
      .sort((a, b) => b.value - a.value);

    if (keywordsIndexed.count() > 0) {
      // return {
      //   type: ModeResultType.MainIdentifierMatch,
      //   value: mainValue,
      //   index: mainIdentifierSimilarity,
      // },
    }

    return {
      type: '',
      value: '',
      index: 1,
    };

  }
}

export default BaseCompare;
