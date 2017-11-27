import { ServiceEntity, Game } from 'ba-common';
import { Entity, Column,  BeforeInsert } from 'typeorm';

@Entity('games')
class GameEntity extends ServiceEntity implements Game {
  @Column()
  slug : string;

  @BeforeInsert()
  createSlug() {
    this.slug = this.name.replace(/_-/g, '');
  }
}

export default GameEntity;
