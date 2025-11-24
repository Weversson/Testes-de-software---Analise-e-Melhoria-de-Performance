import { Repository } from 'typeorm';
import { MysqlDataSource } from '../../config/database';
import { Pokemon } from './Pokemon.entity';

export class PokemonRepository extends Repository<Pokemon> {
  constructor() {
    super(Pokemon, MysqlDataSource.manager);
  }
}
