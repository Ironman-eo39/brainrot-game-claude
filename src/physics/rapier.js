// Loads the Rapier physics engine (WASM, fixed-step). One shared instance.
import RAPIER, { init } from '@dimforge/rapier3d-compat';

let ready = null;
export function loadRapier() {
  if (!ready) ready = init().then(() => RAPIER);
  return ready;
}
