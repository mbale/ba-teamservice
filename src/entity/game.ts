import { ServiceEntity, League } from 'ba-common';
import { Entity, Column,  BeforeInsert } from 'typeorm';

@Entity('games')
class GameEntity extends ServiceEntity implements GameEntity {
  @Column()
  slug : string;

  @BeforeInsert()
  createSlug() {
    this.slug = this.name.replace(/_-/g, '');
  }
}

export default GameEntity;
