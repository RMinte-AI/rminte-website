import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.mjs';
import { createPartGeometry } from './part-geometry.mjs';

export function createViewer(canvas, viewport, onViewChange) {
  const status = document.getElementById('viewer-status');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 55;
  controls.maxDistance = 210;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x869bb1, 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(-45, 65, 40); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe3edff, 1.3); fill.position.set(40, 10, -30); scene.add(fill);
  const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const material = new THREE.MeshStandardMaterial({ color: 0xaebccf, roughness: .4, metalness: .2, side: THREE.DoubleSide });
  const outline = new THREE.LineBasicMaterial({ color: 0x7e92ac, transparent: true, opacity: .24 });
  const model = new THREE.Group(); scene.add(model);
  let modelHeight = 30;
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d'); const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(82,103,136,.22)'); gradient.addColorStop(.5, 'rgba(82,103,136,.09)'); gradient.addColorStop(1, 'rgba(82,103,136,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeometry = new THREE.PlaneGeometry(65, 65);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  let frame = 0;
  let disposed = false;
  function draw() {
    frame = 0;
    controls.update();
    renderer.render(scene, camera);
  }
  function requestRender() {
    if (!frame && !disposed) frame = requestAnimationFrame(draw);
  }
  controls.addEventListener('change', requestRender);
  const clearPreset = () => onViewChange(null);
  let interactionDirection = null;
  const interactionStart = () => { interactionDirection = camera.position.clone().sub(controls.target).normalize(); };
  controls.addEventListener('start', interactionStart);
  function announce(action) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const horizontal = Math.round(THREE.MathUtils.radToDeg(spherical.theta));
    const vertical = Math.round(90 - THREE.MathUtils.radToDeg(spherical.phi));
    status.textContent = `${action}。当前水平角 ${horizontal} 度，垂直角 ${vertical} 度，观察距离 ${Math.round(spherical.radius)}。`;
  }
  const interactionEnd = () => {
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (interactionDirection && interactionDirection.angleTo(direction) > 1e-4) clearPreset();
    interactionDirection = null;
    announce('已通过鼠标或触控调整模型视角');
  };
  controls.addEventListener('end', interactionEnd);
  function setModel({ stage = 3, slot = 16, height = 30, chamfer = 1 }) {
    model.children.forEach(child => child.geometry?.dispose()); model.clear();
    const geometry = createPartGeometry({ stage, slot, height, chamfer });
    model.add(new THREE.Mesh(geometry, material));
    model.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), outline));
    shadow.position.y = -height / 2 - .2; modelHeight = height; requestRender();
  }
  function view(name = 'iso') {
    const distance = Math.max(103, modelHeight * 3.5) / Math.min(camera.aspect, 1);
    const direction = { iso: [1.05, .8, 1.3], front: [0, .001, 1], top: [0, 1, .001] }[name];
    camera.position.copy(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));
    controls.target.set(0, 0, 0); controls.update(); requestRender();
    announce({iso: '已切换到等轴测视图', front: '已切换到正视图', top: '已切换到俯视图'}[name]);
    onViewChange(name);
  }
  function fit() {
    const distance = Math.max(103, modelHeight * 3.5) / Math.min(camera.aspect, 1);
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).add(direction.multiplyScalar(distance));
    controls.update(); requestRender(); announce('已使模型适合窗口');
  }
  function rotate(horizontal, vertical, action) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += THREE.MathUtils.degToRad(horizontal);
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + THREE.MathUtils.degToRad(vertical), .1, Math.PI - .1);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update(); requestRender(); announce(action); clearPreset();
  }
  function zoom(factor, action) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset);
    controls.update(); requestRender(); announce(action);
  }
  function keydown(event) {
    const commands = {
      ArrowLeft: () => rotate(-10, 0, '已向左旋转'),
      ArrowRight: () => rotate(10, 0, '已向右旋转'),
      ArrowUp: () => rotate(0, -10, '已向上旋转'),
      ArrowDown: () => rotate(0, 10, '已向下旋转'),
      '+': () => zoom(.9, '已放大'),
      '=': () => zoom(.9, '已放大'),
      '-': () => zoom(1.1, '已缩小'),
      '_': () => zoom(1.1, '已缩小'),
      Home: () => view('iso')
    };
    const command = commands[event.key];
    if (!command) return;
    event.preventDefault(); command();
  }
  function resize() { const { width, height } = viewport.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); const previousAspect = camera.aspect; camera.aspect = width / height; camera.position.sub(controls.target).multiplyScalar(Math.min(previousAspect, 1) / Math.min(camera.aspect, 1)).add(controls.target); camera.updateProjectionMatrix(); requestRender(); }
  const observer = new ResizeObserver(resize); observer.observe(viewport); canvas.addEventListener('keydown', keydown);
  setModel({}); view(); resize();
  return { setModel, view, fit, section(enabled) { material.clippingPlanes = enabled ? [clip] : []; outline.clippingPlanes = enabled ? [clip] : []; material.needsUpdate = true; outline.needsUpdate = true; requestRender(); }, dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('keydown', keydown); controls.removeEventListener('change', requestRender); controls.removeEventListener('start', interactionStart); controls.removeEventListener('end', interactionEnd); controls.dispose(); model.children.forEach(child => child.geometry?.dispose()); model.clear(); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose(); material.dispose(); outline.dispose(); renderer.dispose(); } };
}
