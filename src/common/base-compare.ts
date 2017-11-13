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
  entity? : BaseEntity;
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
  mode : CompareMode;
  result? : CompareModeResult;
}

export interface EntitySimilarity {
  entity : BaseEntity;
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

  public runOnEntity(unit : string, entityToCompare : BaseEntity) : CompareResult {
    if (!unit) {
      throw new Error('Missing unit to test');
    }

    if (!entityToCompare) {
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

    if (mode === StrictOnly || mode === StrictAndSimilar) {
      const {
        type,
      } = this.strictCompare(entityToCompare);

      if (type === ModeResultType.MainIdentifierMatch) {

      }
    }

    if (mode === SimilarOnly || mode === StrictAndSimilar) {

    }

    return ;
  }

  /**
   * The callable interface to run (extended) compare service on collections
   * 
   * @param {string} unit 
   * @param {CompareSettings} [compareSettings] 
   * @returns {CompareResult} 
   * @memberof BaseCompare
   */
  // public runOnCollection(unit : string, compareSettings? : CompareSettings) : CompareResult {
  //   // const keywordIdentifierMatch = this.collection
  //   //   .find(entity => List(entity._keywords).contains(this.unit.toLowerCase()));
  //   if (!unit) {
  //     throw new Error('Missing unit to test');
  //   }
  //   if (compareSettings) {
  //     this.compareSettings = compareSettings;
  //   }

  //   this.unit = unit;

  //   const {
  //     mode,
  //     thresholds,
  //   } = this.compareSettings;

  //   let result : SimilarCompareModeResult | StrictCompareModeResult = null;

  //   if (mode === CompareMode.StrictOnly || mode === CompareMode.StrictAndSimilar) {
  //     result 
  //   }

  //   /*
  //     Strict phase
  //   */
  //   // if (mode === CompareMode.StrictOnly || mode === CompareMode.StrictAndSimilar) {
  //   //   const strictCompareResult = this.strictCompare();

  //   //   result = strictCompareResult;

  //   //   if (strictCompareResult.type === ModeResultType.NoMatch) {
  //   //     this._entitiesToSave = this._entitiesToSave.push(strictCompareResult.entity);
  //   //   }
      
  //   //   if (strictCompareResult.type === ModeResultType.MainIdentifierMatch 
  //   //     || strictCompareResult.type === ModeResultType.KeywordIdentifier) {
  //   //     this.relatedStrictEntities = this.relatedStrictEntities.push(strictCompareResult.entity);
  //   //   }
  //   // }

  //   // /*
  //   //   Similar phase
  //   // */
  //   // if (mode === CompareMode.SimilarOnly || mode === CompareMode.StrictAndSimilar) {
  //   //   const similarCompareResult = this.similarCompare();

  //   //   result = similarCompareResult;

  //   //   if (similarCompareResult.type === ModeResultType.NoMatch) {
  //   //     this._entitiesToSave = this._entitiesToSave.push(similarCompareResult.entity);
  //   //   }

  //   //   if (similarCompareResult.type === ModeResultType.MainIdentifierMatch 
  //   //     || similarCompareResult.type === ModeResultType.KeywordIdentifier) {
  //   //     this.relatedSimilarEntities =
  //   //         this.relatedSimilarEntities.push(similarCompareResult.entity);
  //   //   }
  //   // }

  //   if (this.relatedStrictEntities.count() !== 0) {
  //     return {
  //       result,
  //       mode,
  //     };
  //   }

  //   if (this.relatedSimilarEntities.count() !== 0) {
  //     return {
  //       result,
  //       mode,
  //     };
  //   }

  //   return {
  //     mode,
  //     result,
  //   };
  // }

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
  protected strictCompare(entityToCompare : BaseEntity) : StrictCompareModeResult {
    if (!entityToCompare) {
      throw new Error('Missing entity');
    }
    // we first check if we've the same by name
    const MainIdentifierMatchMatch = entityToCompare.name.toLowerCase() === this.unit.toLowerCase();
    // then we also check keywords
    const keywords = List(entityToCompare._keywords);
    const keywordIdentifierMatch = keywords.contains(this.unit.toLowerCase());

    if (MainIdentifierMatchMatch) {
      return {
        type: ModeResultType.MainIdentifierMatch,
      };
    }

    if (keywordIdentifierMatch) {
      return {
        type: ModeResultType.KeywordIdentifierMatch,
      };
    }

    return {
      type: ModeResultType.NoMatch,
    };
  }

  /**
   * Run similar compare on unit
   * 
   * @protected
   * @returns {SimilarCompareModeResult} 
   * @memberof BaseCompare
   */
  // protected similarCompare(entityToCompare : BaseEntity) : SimilarCompareModeResult {
  //   const MainIdentifierMatchMatch = this.collection
  //     .filter(entity => 
  //         this.compareTwoUnits(entity.name, this.unit) >= this.compareSettings.thresholds.dice,
  //       )
  //       .sort((a, b) => 
  //         this.compareTwoUnits(a.name, b.name) - this.compareTwoUnits(b.name, a.name),
  //       )
  //       .first();

  //   if (MainIdentifierMatchMatch) {
  //     return {
  //       type: ModeResultType.MainIdentifierMatch,
  //       entity: MainIdentifierMatchMatch,
  //       collision: MainIdentifierMatchMatch.name,
  //     };
  //   }

  //   const keywordIdentifierMatch = this.collection
  //     // filter by criteria (threshold)
  //     .filter(entity => this.filterListByThreshold(List(entity._keywords)))
  //     // reorder teams's keyword field by dice value
  //     .map((entity) => {
  //       entity._keywords = this.sortEntitiesBySimilarity(List(entity._keywords)).toArray();
  //       return entity;
  //     })
  //     // reorder teams by it's keyword dice values
  //     .sort((a, b) => this.sortEntitiesByKeywordIdentifier(a._keywords, b._keywords))
  //     .last();

  //   if (keywordIdentifierMatch) {
  //     return {
  //       type: ModeResultType.KeywordIdentifier,
  //       entity: keywordIdentifierMatch,
  //       collision: List(keywordIdentifierMatch._keywords).first(),
  //     };
  //   }

    // return {
    //   type: ModeResultType.NoMatch,
    // };
  // }
}

export default BaseCompare;
