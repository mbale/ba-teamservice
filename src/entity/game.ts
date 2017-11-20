import ServiceEntity from '../common/base-entity';
import { Entity, Column,  BeforeInsert } from 'typeorm';

@Entity('games')
class Game extends ServiceEntity {
  @Column()
  slug : string;

  @BeforeInsert()
  createSlug() {
    this.slug = this.name.replace(/_-/g, '');
  }
}

export default Game;