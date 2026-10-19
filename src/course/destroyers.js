// Destroyer types available to the course editor. Each entry builds the visual (its motion is scripted by the factory)
// and sets the default motion: speed (cycles/s), amplitude (units depend on the type), phase (0..1).
import { createGiantHammer, createGiantAxe, createPunchFist, createSlapHand, createPendulum, createCrusher } from '../obstacles/obstacles.js';
import { createPistonGate, createStompFoot } from '../obstacles/extra.js';
import { createJawTrap, createEvilTrain } from '../obstacles/realistic.js';

export const DESTROYERS = {
  hammer:           { label: 'giant hammer',   make: m => createGiantHammer({ length: 6, motion: m }),                              motion: { speed: 0.5, amplitude: 1.1 } },
  axe:              { label: 'giant axe',      make: m => createGiantAxe({ length: 6, motion: m }),                                  motion: { speed: 0.55, amplitude: 0.85 } },
  'punch-fist':     { label: 'punch fist',     make: m => createPunchFist({ scale: 1.6, motion: m }),                                motion: { speed: 0.5, amplitude: 9 } },
  'slap-hand':      { label: 'slap hand',      make: m => createSlapHand({ scale: 1.6, motion: m }),                                 motion: { speed: 0.5, amplitude: 10 } },
  'pendulum-ball':  { label: 'pendulum ball',  make: m => createPendulum({ head: 'ball', armLength: 6.5, span: 9.4, motion: m }),     motion: { speed: 0.35, amplitude: 0.95 } },
  'pendulum-axe':   { label: 'pendulum axe',   make: m => createPendulum({ head: 'axe', armLength: 6.5, span: 9.4, motion: m }),      motion: { speed: 0.35, amplitude: 0.95 } },
  'crusher-press':  { label: 'hydraulic press', make: m => createCrusher({ kind: 'press', width: 7, height: 5, motion: m }),          motion: { speed: 0.4, amplitude: 4.5 } },
  'crusher-pincer': { label: 'side pincers',   make: m => createCrusher({ kind: 'pincer', width: 6, height: 3.5, motion: m }),        motion: { speed: 0.4, amplitude: 3.5 } },
  'piston-gate':    { label: 'piston gate',    make: m => createPistonGate({ width: 7, motion: m }),                                 motion: { speed: 0.4, amplitude: 3.7 } },
  'stomp-foot':     { label: 'stomp foot',     make: m => createStompFoot({ motion: m }),                                            motion: { speed: 0.4, amplitude: 6.4 } },
  'jaw-trap':       { label: 'jaw trap',       make: m => createJawTrap({ size: 10, motion: m }),                                    motion: { speed: 0.3, amplitude: 0.5 } },
  'evil-train':     { label: 'evil train',     make: m => createEvilTrain({ motion: m }),                                            motion: { speed: 0.4, amplitude: 45 } },
};
