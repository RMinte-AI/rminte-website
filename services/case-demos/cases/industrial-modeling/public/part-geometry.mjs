import * as THREE from './vendor/three.module.mjs';

const HEX_APOTHEM = 15;
const HEX_RADIUS = HEX_APOTHEM / Math.cos(Math.PI / 6);

function hexagon(radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return new THREE.Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
  });
}

function square(side) {
  const half = side / 2;
  return [
    new THREE.Vector2(-half, -half),
    new THREE.Vector2(-half, half),
    new THREE.Vector2(half, half),
    new THREE.Vector2(half, -half)
  ];
}

function vertex(point, z) {
  return [point.x, point.y, z];
}

function triangle(positions, a, b, c) {
  positions.push(...a, ...b, ...c);
}

function quad(positions, a, b, c, d) {
  triangle(positions, a, b, c);
  triangle(positions, a, c, d);
}

function wall(positions, contour, bottom, top) {
  contour.forEach((point, index) => {
    const next = contour[(index + 1) % contour.length];
    quad(positions, vertex(point, bottom), vertex(next, bottom), vertex(next, top), vertex(point, top));
  });
}

function bridge(positions, lower, upper, lowerZ, upperZ) {
  lower.forEach((point, index) => {
    const next = (index + 1) % lower.length;
    quad(positions, vertex(point, lowerZ), vertex(lower[next], lowerZ), vertex(upper[next], upperZ), vertex(upper[index], upperZ));
  });
}

function cap(positions, outer, hole, z, top) {
  const contours = hole ? [hole] : [];
  const points = hole ? [...outer, ...hole] : outer;
  for (const face of THREE.ShapeUtils.triangulateShape(outer, contours)) {
    const [a, b, c] = face.map(index => vertex(points[index], z));
    triangle(positions, ...(top ? [a, b, c] : [c, b, a]));
  }
}

export function createPartGeometry({ stage = 3, slot = 16, height = 30, chamfer = 1 } = {}) {
  const bevel = stage >= 2 ? chamfer : 0;
  const bottom = -height / 2;
  const top = height / 2;
  const outer = hexagon(HEX_RADIUS);
  const endOuter = bevel ? hexagon(HEX_RADIUS - bevel / Math.cos(Math.PI / 6)) : outer;
  const hole = stage >= 3 ? square(slot) : null;
  const positions = [];

  wall(positions, outer, bottom + bevel, top - bevel);
  if (bevel) {
    bridge(positions, endOuter, outer, bottom, bottom + bevel);
    bridge(positions, outer, endOuter, top - bevel, top);
  }
  if (hole) wall(positions, hole, bottom, top);
  cap(positions, endOuter, hole, bottom, false);
  cap(positions, endOuter, hole, top, true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  return geometry;
}
