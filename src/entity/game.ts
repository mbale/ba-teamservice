import BaseEntity from '../common/base-entity';
import { Entity } from 'typeorm';

@Entity('games')
class Game extends BaseEntity {}

export default Game;
