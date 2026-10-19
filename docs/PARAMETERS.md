# Parameters reference

Every number in the course editor, the JSON file, and the physics engine. The tables are generated from `src/course/schema.js` and `src/course/destroyers.js`, so they match the code.

## Course fields

| JSON path | label | range | step |
|---|---|---|---|
| `physics.gravity` | gravity (m/s²) | 0 … 20 | 0.1 |
| `physics.friction` | friction | 0 … 1.5 | 0.05 |
| `physics.rosterBounce` | roster bounce | 0 … 1 | 0.05 |
| `physics.destroyerBounce` | destroyer bounce | 0 … 1 | 0.05 |
| `physics.rosterMass` | roster mass (kg) | 20 … 3000 | 10 |
| `physics.playerMass` | player mass (kg) | 200 … 4000 | 50 |
| `player.vehicle` | player (vehicle or character) | choice | — |
| `player.startZ` | start z (m) | -20 … 40 | 1 |
| `player.heading` | start heading (deg, 180 = away from camera) | -180 … 180 | 1 |
| `player.maxSpeed` | max speed (m/s) | 2 … 40 | 0.5 |
| `player.accel` | acceleration (m/s²) | 1 … 30 | 0.5 |
| `player.brake` | brake force (m/s²) | 2 … 40 | 0.5 |
| `player.coast` | coast decel (m/s²) | 0 … 10 | 0.1 |
| `player.steer` | steering (rad/s) | 0.2 … 3 | 0.05 |
| `player.grip` | grip (1/s) | 0.5 … 20 | 0.5 |
| `road.width` | road width (m) | 5 … 20 | 0.5 |
| `road.curve` | road curve (m) | 0 … 15 | 0.1 |
| `road.curveFreq` | curve frequency | 0.01 … 0.1 | 0.005 |
| `road.hill` | hills (m) | 0 … 15 | 0.5 |
| `road.from` | road starts at z | 0 … 80 | 1 |
| `road.to` | road ends at z | -400 … -40 | 5 |
| `road.lines` | road lines | choice | — |

## Items (destroyers and roster)

| field | used by | range | meaning |
|---|---|---|---|
| `kind` | both | `destroyer` or `roster` | what the item is |
| `type` | both | see the tables below | which model |
| `x` | both | −15 … 15 | sideways position (m), `0` is the middle of the road |
| `z` | both | −150 … 40 | forward position (m); negative is ahead of the start |
| `scale` | both | 0.2 … 5 | size multiplier |
| `rot` | destroyer | −180 … 180 | facing in degrees, `90` turns a hammer across the road |
| `speed` | destroyer | 0 … 3 | motion cycles per second |
| `amplitude` | destroyer | 0 … 50 | motion size; units depend on the type (rad, m or a sweep distance) |
| `phase` | destroyer | 0 … 1 | start offset of the motion cycle |
| `show` | roster | 0 … 60 s | time the item appears on the road |
| `launch` | roster | 0 … 60 s | time it starts rolling |
| `vx` | roster | −30 … 30 m/s | sideways launch speed |
| `vz` | roster | −30 … 30 m/s | forward launch speed; positive rolls toward the camera |

## Destroyer types

Default `speed` and `amplitude` are shown. Change them per item.

| type | model | default speed (cyc/s) | default amplitude |
|---|---|---|---|
| `hammer` | giant hammer | 0.5 | 1.1 |
| `axe` | giant axe | 0.55 | 0.85 |
| `punch-fist` | punch fist | 0.5 | 9 |
| `slap-hand` | slap hand | 0.5 | 10 |
| `pendulum-ball` | pendulum ball | 0.35 | 0.95 |
| `pendulum-axe` | pendulum axe | 0.35 | 0.95 |
| `crusher-press` | hydraulic press | 0.4 | 4.5 |
| `crusher-pincer` | side pincers | 0.4 | 3.5 |
| `piston-gate` | piston gate | 0.4 | 3.7 |
| `stomp-foot` | stomp foot | 0.4 | 6.4 |
| `jaw-trap` | jaw trap | 0.3 | 0.5 |
| `evil-train` | evil train | 0.4 | 45 |

## Roster and player types

Any key in `src/registry.js` with the group `moons`, `cars`, `characters` or `humans`:

- **moons:** `moon-green`, `moon-red`, `moon-purple`, `moon-cyan`, `moon-yellow`, `moon-white`, `moon-black`, `moon-brown`, `moon-blue`, `moon-orange`, `moon-clown`, `moon-pink`. Moons are balls and roll.
- **cars:** `jeep`, `school-bus`, `supercar`, `supercar-cyan`, `tractor`. Cars stay upright.
- **characters:** `tralalero`, `cappuccino-assassino`, `bombardino`, `chimpanzini`, `tung-tung`, `bananita-dolfinita`, `frigo-camelo`, `bobrito-bandito`, `vaca-saturno`, `brr-brr-patapim`, `ta-ta-ta-sahur`, `strawberry-elephant`, `orcalero`, `trippi-troppi`, `ballerina-cappuccina`, `muscle-man`, `knight`, `giant-tung-head`. Characters are flat photo models, so their sides are approximated.
- **humans:** `runner`, `footballer`, `zombie`. Rigged bodies that play real animations.

Player types are the same list.

## Physics: JSON to engine

| JSON key | engine parameter | meaning |
|---|---|---|
| `physics.gravity` | `gravity` | downward pull (m/s²) |
| `physics.friction` | `friction` | grip between bodies and the road |
| `physics.rosterBounce` | `rosterRestitution` | how much roster items bounce (0 dead, 1 perfect) |
| `physics.destroyerBounce` | `destroyerRestitution` | how much items bounce off destroyers |
| `physics.rosterMass` | `rosterMass` | mass of roster items (kg) |
| `physics.playerMass` | `playerMass` | mass of your vehicle (kg) |
| `player.maxSpeed` | `maxSpeed` | top speed under throttle (m/s) |
| `player.accel` | `accel` | how fast you reach top speed (m/s²) |
| `player.brake` | `brakeForce` | braking deceleration (m/s²) |
| `player.coast` | `coast` | slow-down when you lift off the throttle (m/s²) |
| `player.steer` | `steer` | turn rate at full steering (rad/s) |
| `player.grip` | `grip` | how quickly the car follows its heading (1/s); higher is more locked-on |

## Limits

- Collisions use boxes (or balls for moons), not the exact mesh.
- Headless tests run far slower than real time. Real-time frame rate is unverified.
- Scripted gauntlet games keep their own timing. Only the editor courses and the gauntlet physics modes use the physics engine.
