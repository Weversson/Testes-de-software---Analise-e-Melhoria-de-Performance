import { Router } from 'express';
import { HomeController } from './endpoints/home/HomeController';
import { PokemonController } from './endpoints/pokemon/PokemonController';

const router = Router();

// Home
router.get('/', new HomeController().healthcheck);

// Pokemon
router.post('/pokemon', new PokemonController().create);
router.get('/pokemon', new PokemonController().list);
router.get('/pokemon/count', new PokemonController().count);
router.get('/pokemon/:name', new PokemonController().getOne);
router.delete('/pokemon', new PokemonController().delete);

export default router;
