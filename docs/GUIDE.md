# Guide: play, build and tune courses

## Run it

```
npm install
npm start          # serves the folder on http://localhost:8123
```

Open `http://localhost:8123/index.html`. Use a desktop browser or a phone. The view is always portrait (9:16) and fits the window.

## Pick a mode

Top-left, the **mode** box:

- **scripted:** the original timing. Destroyers and roster items follow exact timed motion. You only watch.
- **physics:** the same gauntlet games, but with a real physics engine (Rapier) and your vehicle. You drive.
- **custom course:** choose "custom course (editor)" in the game box. Build your own course, then press play. Always physics.

## Drive

- Keyboard: **W / ↑** gas, **S / ↓** brake, **A / ←** steer left, **D / →** steer right.
- Phone or touch: the on-screen pad (▲ ▼ ◀ ▶).
- Speed and steering sliders (physics panel) change the car live. Gravity and bounce apply on reset.
- The caption shows smashed count, crashes and speed. A roster item turns red when it is hit and green when it gets past unhit.

## Build a course

1. Choose **custom course (editor)** in the game box. The editor opens with an example.
2. **Player:** pick any vehicle or character, and set its start point, heading, speed, acceleration, braking and steering.
3. **Physics:** gravity, friction, bounce and mass. Bounce 0 means items stop dead, 1 means they bounce fully.
4. **Road:** width, curve, hills, lines, and where the road starts and ends.
5. **Items:** press **+ destroyer** or **+ roster item**, then set each item:
   - A destroyer sits at `x, z` and turns by `rot`. It moves by itself. Set `speed` and `amplitude`.
   - A roster item appears at `show` seconds, rolls at `launch` seconds, and moves at `vx, vz`.
   - Negative `z` is ahead of the start. A roster item with `vz` above 0 rolls toward the camera.
6. Press **▶ play**. Use **edit course** (top-left) to come back and change it.

Typical setup: a destroyer across the road about 8 m ahead, and roster items launched every 1 to 2 seconds from about 40 m ahead.

## Save and share

- **export JSON** writes the course into the text box. Copy it and keep it as a file.
- **import JSON** reads the text box back into the editor. Any unknown type or out-of-range value is fixed to the nearest valid one, and the warning line says what changed.

Example (this is the course the editor opens with):

```json
{
  "name": "example: hammer and moons",
  "road": { "width": 9, "curve": 2, "curveFreq": 0.035, "hill": 2, "lines": "double-yellow", "from": 30, "to": -200 },
  "physics": { "gravity": 9.81, "friction": 0.7, "rosterBounce": 0.35, "destroyerBounce": 0.55, "rosterMass": 300, "playerMass": 1200 },
  "player": { "vehicle": "jeep", "startZ": 12, "heading": 180, "maxSpeed": 18, "accel": 9, "brake": 14, "coast": 3, "steer": 1.1, "grip": 6 },
  "items": [
    { "kind": "destroyer", "type": "hammer", "x": 0, "z": -8, "rot": 90, "scale": 1, "speed": 0.5, "amplitude": 1.1, "phase": 0 },
    { "kind": "roster", "type": "moon-green", "x": -1.2, "z": -40, "scale": 1, "show": 0.5, "launch": 0.5, "vx": 0, "vz": 13 },
    { "kind": "roster", "type": "moon-red", "x": 1.2, "z": -40, "scale": 1, "show": 1.5, "launch": 1.5, "vx": 0, "vz": 13 }
  ]
}
```

## Links from the browser

- `?game=custom&play=1` starts the example course straight away.
- `?game=custom&play=1&player=tung-tung` starts it with a character as the player.
- `?mode=physics&game=slap-hand&t=3.8&gas=1` renders a physics gauntlet at exactly 3.8 s, with the throttle held. Handy for screenshots.

## Troubleshooting

- **"physics not available" or the game stays scripted:** only the eight gauntlet games have physics. The fist showcase and the player bridge are scripted only.
- **Very slow in a headless browser:** it runs slower than real time there. On a real browser with a GPU, expect real time.
- **A car flies or spins:** lower `maxSpeed`, raise `grip`, or lower `rosterBounce`.
- **Nothing hits:** move destroyers into the path (`x`, `z`, `rot`) and check the roster `vz`. Items move toward the camera when `vz` is positive.
