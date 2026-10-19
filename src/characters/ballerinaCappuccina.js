// Ballerina Cappuccina: coffee-cup head with latte-art foam, ballerina body, pink tutu, pointe shoes.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, lathe, eye, canvasTex, animate } from '../core/util.js';

function latteTex() {
  return canvasTex(256, (c, s) => {
    c.fillStyle = '#7a4a2a'; c.fillRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#f3e1c4'); g.addColorStop(1, '#a8703d'); c.fillStyle = g; c.beginPath(); c.arc(s / 2, s / 2, s / 2, 0, 7); c.fill();
    c.strokeStyle = '#7a4a2a'; c.lineWidth = 6;                                // leaf art
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(s / 2, s * 0.78); c.quadraticCurveTo(s * (0.3 + i * 0.1), s * (0.55 - i * 0.04), s / 2, s * (0.3 + i * 0.03)); c.stroke(); }
  });
}

export function createBallerinaCappuccina({ height = 1.7 } = {}) {
  const g = new THREE.Group(); g.name = 'BallerinaCappuccina';
  const root = new THREE.Group(); root.scale.setScalar(height / 1.7); g.add(root);
  const skin = mat(0xf3c9a8, { roughness: 0.5 }), pink = mat(0xf7b7cd, { roughness: 0.55 });
  const porcelain = mat(0xfaf6ef, { roughness: 0.15 }), gold = mat(0xd4a64a, { metalness: 0.8, roughness: 0.3 });

  // cup head: lathe cup (outer wall), coffee surface disc w/ latte art, handle, saucer
  const cup = new THREE.Group(); cup.position.set(0, 1.18, 0); root.add(cup);
  cup.add(lathe([[0, -0.16], [0.12, -0.15], [0.2, -0.05], [0.27, 0.12], [0.28, 0.26], [0.27, 0.27]], porcelain));
  cup.add(lathe([[0.27, 0.27], [0.255, 0.265], [0.256, 0.24]], porcelain));
  cup.add(mesh(new THREE.CircleGeometry(0.256, 48), mat(0xffffff, { map: latteTex(), roughness: 0.3 }), { pos: [0, 0.24, 0], rot: [-Math.PI / 2, 0, 0] }));
  cup.add(mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 24, Math.PI * 1.3), porcelain, { pos: [0.31, 0.1, 0], rot: [0, 0, -Math.PI * 0.65] }));  // handle
  cup.add(lathe([[0.0, -0.2], [0.26, -0.2], [0.34, -0.17], [0.35, -0.16]], porcelain));  // saucer under cup
  // face on the cup wall
  for (const s of [-1, 1]) {
    const e = eye(0.055, { pupil: 0.55, irisColor: 0x3a2412, look: [0, 0.1] }); e.position.set(s * 0.095, 0.02, 0.255);
    e.rotation.x = -0.15; cup.add(e);
    cup.add(mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 12, Math.PI), mat(0x2a1a10), { pos: [s * 0.095, 0.085, 0.265], rot: [0, 0, 0] })); // lash arc
    cup.add(sphere(0.035, mat(0xf79aae, { transparent: true, opacity: 0.6 }), { pos: [s * 0.17, -0.04, 0.215], scale: [1, 0.6, 0.3] })); // blush
  }
  cup.add(mesh(new THREE.TorusGeometry(0.04, 0.007, 4, 12, Math.PI), mat(0xc03a58), { pos: [0, -0.075, 0.262], rot: [0, 0, Math.PI] })); // smile
  // neck, torso
  root.add(cyl(0.045, 0.05, 0.14, skin, { pos: [0, 0.98, 0] }));
  root.add(mesh(new THREE.CapsuleGeometry(0.11, 0.14, 8, 16), pink, { pos: [0, 0.82, 0], scale: [1, 1, 0.8] })); // bodice
  // tutu: layered flared discs
  for (let i = 0; i < 5; i++) root.add(lathe([[0.09, 0.0], [0.34 - i * 0.02, -0.03 - i * 0.015], [0.4 - i * 0.03, -0.07 - i * 0.015], [0.2, -0.04]], mat(i % 2 ? 0xf9cfe0 : 0xf4a9c4, { roughness: 0.8, side: THREE.DoubleSide }), { pos: [0, 0.66 - i * 0.012, 0], rot: [0, i * 0.4, 0] }));
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.12, 0.9, 0); root.add(sh);
    sh.add(limb([0, 0, 0], [s * 0.2, 0.05, 0.1], 0.025, skin));               // graceful raised arm
    sh.add(limb([s * 0.2, 0.05, 0.1], [s * 0.3, 0.2, 0.12], 0.02, skin));
    arms.push(sh);
  }
  // legs + pointe shoes, one in relevé
  for (const [s, bend] of [[-1, 0], [1, 1]]) {
    const knee = bend ? [s * 0.1, 0.34, 0.14] : [s * 0.06, 0.32, 0.0];
    const ankle = bend ? [s * 0.07, 0.34, -0.08] : [s * 0.06, 0.08, 0.0];
    root.add(limb([s * 0.06, 0.6, 0], knee, 0.032, skin));
    root.add(limb(knee, ankle, 0.028, skin));
    root.add(mesh(new THREE.ConeGeometry(0.03, 0.14, 12), pink, { pos: [ankle[0], ankle[1] - (bend ? 0 : 0.03), ankle[2] + 0.03], rot: [bend ? 1.4 : Math.PI, 0, 0] }));
  }
  root.add(cyl(0.34, 0.34, 0.012, gold, { pos: [0, 0.005, 0] }));          // stage disc
  animate(g, t => { root.rotation.y = Math.sin(t * 1.3) * 0.5; root.position.y = Math.abs(Math.sin(t * 2.6)) * 0.05; arms.forEach((a, i) => a.rotation.z = Math.sin(t * 2 + i * Math.PI) * 0.12); });
  return g;
}
