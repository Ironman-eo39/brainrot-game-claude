// Reference-exact characters built from the catalog photos (assets/cutouts/*.png) via photo-relief.
// Every entry: size (m, height or width per `fit`) is overridable: createCharacter('tung-tung', { size: 4 }).
import { createPhotoRelief } from '../core/photoRelief.js';

export const CHARACTERS = {
  'tralalero':           { file: 'tralalero', size: 2.2, thickness: 0.55, label: 'Tralalero Tralala' },
  'cappuccino-assassino':{ file: 'cappuccino-assassino', size: 1.7, thickness: 0.9, label: 'Cappuccino Assassino' },
  'bombardino':          { file: 'bombardino', size: 5, fit: 'width', thickness: 0.5, idle: { sway: 0.05, bob: 0.08, speed: 1.3 }, label: 'Bombardino Crocodilo' },
  'chimpanzini':         { file: 'chimpanzini', size: 1.9, thickness: 0.6, label: 'Chimpanzini Bananini' },
  'tung-tung':           { file: 'tung-tung', size: 3.0, thickness: 1.0, label: 'Tung Tung Tung Sahur' },
  'bananita-dolfinita':  { file: 'bananita-dolfinita', size: 1.9, thickness: 0.7, label: 'Bananita Dolfinita' },
  'frigo-camelo':        { file: 'frigo-camelo', size: 3.0, thickness: 0.7, label: 'Frigo Camelo' },
  'bobrito-bandito':     { file: 'bobrito-bandito', size: 1.7, thickness: 0.7, label: 'Bobrito Bandito' },
  'vaca-saturno':        { file: 'vaca-saturno', size: 2.4, thickness: 0.8, label: 'La Vaca Saturno Saturnita' },
  'brr-brr-patapim':     { file: 'brr-brr-patapim', size: 3.0, thickness: 0.7, label: 'Brr Brr Patapim' },
  'ta-ta-ta-sahur':      { file: 'ta-ta-ta-sahur', size: 3.0, thickness: 0.6, label: 'Ta Ta Ta Sahur' },
  'strawberry-elephant': { file: 'strawberry-elephant', size: 2.4, thickness: 0.8, label: 'Strawberry Elephant' },
  'orcalero':            { file: 'orcalero', size: 2.8, thickness: 0.7, label: 'Orcalero Orcala' },
  'trippi-troppi':       { file: 'trippi-troppi', size: 1.6, fit: 'width', thickness: 0.7, label: 'Trippi Troppi' },
  'ballerina-cappuccina':{ file: 'ballerina-cappuccina', size: 1.9, thickness: 0.6, label: 'Ballerina Cappuccina' },
  'muscle-man':          { file: 'muscle-man', size: 4.0, thickness: 0.8, label: 'Muscle man' },
  'knight':              { file: 'knight', size: 2.3, thickness: 0.5, label: 'Knight' },
  'giant-tung-head':     { file: 'giant-tung-head', size: 6, fit: 'width', thickness: 0.9, idle: { sway: 0.01, bob: 0, speed: 1.4 }, label: 'Giant Tung head' },
};
export const createCharacter = (key, opts = {}) => {
  const d = CHARACTERS[key]; if (!d) throw new Error('unknown character ' + key);
  return createPhotoRelief(`./assets/cutouts/${d.file}.png`, { ...d, name: d.label, ...opts });
};
