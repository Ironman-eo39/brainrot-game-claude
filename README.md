# Brainrot game: models, scenes, physics and course builder

A three.js project (procedural models, real rigged humanoids, a Rapier physics mode) for building brainrot-style physics gauntlets: you drive a car or character through a course of destroyers, and roster items get smashed.

## Run it

```
npm install
npm start          # http://localhost:8123/index.html
```

Portrait only (9:16). Use Chrome or Edge with WebGL.

## Three ways to play

| mode | what it is | where |
|---|---|---|
| scripted | original timing; you watch the destroyers and roster | game box |
| physics | the same 8 gauntlet games with a real engine and your vehicle | mode box = physics |
| custom course | build your own course in the editor; always physics | game box = custom course |

Full instructions: [docs/GUIDE.md](docs/GUIDE.md). Every parameter and its range: [docs/PARAMETERS.md](docs/PARAMETERS.md).

## Controls

- Keyboard: W/↑ gas, S/↓ brake, A/← left, D/→ right.
- Touch: the on-screen pad.
- Live sliders (physics panel): speed and steering. Gravity and bounce apply on reset.

## What's in the project

- **Models** (`src/vehicles`, `src/obstacles`, `src/characters`): procedural vehicles, props, the evil train, tractor, pig cart, sculpted giant head, and photo-based characters cut from the reference catalog. Rigged humans (Soldier, Xbot) for runners, footballers and the zombie.
- **Materials** (`src/core/textures.js`): procedural PBR maps (albedo, normal, roughness) for road, grass, bark, paint, tread, rust, skin and more.
- **Scenes** (`src/scenes`): 11 static scenes, each with a camera.
- **Gauntlet games** (`src/game`): 10 scripted games from the analysis files, built on one sequencer.
- **Physics** (`src/physics`): Rapier at 60 Hz. Terrain is a trimesh, destroyers are kinematic colliders that copy their animated pose each step, roster items are dynamic bodies, and the player drives.
- **Course builder** (`src/course`): schema-driven editor (every parameter in `schema.js` gets a control), normalizing JSON import/export, destroyer table, builder.
- **Docs**: `docs/GUIDE.md` (how to use it), `docs/PARAMETERS.md` (generated from the schema).

## Tests

```
node tools/phys-test.mjs          # drives the car headless and reports position, heading, speed (needs Chrome path set in the script)
bash tools/all.sh                 # renders every asset to shots/
bash tools/scenes.sh              # renders every scene
bash tools/games.sh name:t1,t2    # renders games at exact times
```

## Limits (current)

- Physics uses box or ball colliders, not exact meshes. Cars have no suspension.
- Photo characters are flat cut-outs. Front is the photo. Sides are approximated, and thin fins can show small gaps at sharp turns. Full 360° needs an image-to-3D model.
- Only the 8 gauntlet games have physics. The fist showcase and player bridge are scripted only.
- Headless rendering runs slower than real time, so real frame rate is unverified.
- The jaw head's lower jaw looks thin when open.

## Attribution

- `Soldier.glb`, `Xbot.glb`: three.js examples (Mixamo rigs; check Mixamo terms before publishing).
- `ferrari.glb`: three.js examples, CC-BY 3.0.
- Everything else: this project. Photo characters are cut from the reference catalog.

## Not included

Real-person likenesses. Players are generic bodies in kit colours. To use your own licensed player model, see `src/characters/humanReal.js` (`makeHuman`).
