import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScene(rootEl) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.innerWidth >= 900 && !reduced;
  const lowPower = navigator.hardwareConcurrency ? navigator.hardwareConcurrency < 4 : false;

  const renderer = new THREE.WebGLRenderer({
    antialias: isDesktop,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.pointerEvents = 'none';
  rootEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // ---- Environment (gentle reflections on the plush) ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  // ---- Soft lights so the plush shape reads clearly ----
  const keyLight = new THREE.DirectionalLight(0xfff2f7, 1.1);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xc7d8ff, 0.35);
  fillLight.position.set(-5, 2, -3);
  scene.add(fillLight);
  scene.add(new THREE.HemisphereLight(0xfff4fb, 0xcfd8f5, 0.55));

  // ---- Camera rig ----
  const camera = new THREE.PerspectiveCamera(
    isDesktop ? 42 : 55,
    window.innerWidth / window.innerHeight,
    0.1, 100
  );
  const rig = { px: 0, py: 0.2, pz: 7, lx: 0, ly: 0, lz: 0 };
  const look = new THREE.Vector3();
  camera.position.set(rig.px, rig.py, rig.pz);

  // ---- Plush model ----
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let modelCenterY = 0.4; // replaced by the measured center once the GLB loads
  const loader = new GLTFLoader();
  loader.load(`${import.meta.env.BASE_URL}model/mizuki.glb`, (gltf) => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = isDesktop ? 3.4 / maxDim : 3.6 / maxDim;
    m.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    m.position.x -= center.x * scale;
    m.position.z -= center.z * scale;
    m.position.y = -box.min.y * scale;
    modelCenterY = (box.max.y - box.min.y) * scale / 2;
    modelGroup.add(m);
  }, undefined, (err) => {
    // fallback poster handled by DOM if scene fails later
    console.warn('GLB load failed:', err);
  });

  // ---- Petals (soft dots) ----
  const petalCount = isDesktop ? 70 : 0;
  let petals = null;
  if (petalCount) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(petalCount * 3);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(245,169,184,1)');
    g.addColorStop(1, 'rgba(245,169,184,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    for (let i = 0; i < petalCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: tex,
      transparent: true,
      depthWrite: false,
      color: 0xf5a9b8,
      opacity: 0.85
    });
    petals = new THREE.Points(geo, mat);
    petals.position.y = 0;
    scene.add(petals);
  }

  // ---- Post-processing (bloom, desktop only) ----
  let composer = null;
  if (isDesktop && !lowPower) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.25, 0.5, 0.85
    );
    composer.addPass(bloom);
  }

  const state = { p: 0, modelY: 0, modelRot: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: document.querySelector('main'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1
    },
    defaults: { ease: 'none' }
  });

  tl.to(state, { p: 1, duration: 1 }, 0);
  tl.to(state, { modelRot: Math.PI * 2, duration: 1, ease: 'none' }, 0);

  // ---- Render loop ----
  let raf = 0;
  let spinAccum = 0;
  const clock = new THREE.Clock();

  function lerpKey(cur, arr) {
    // piecewise lerp across keyframe array
    let i = 0;
    while (i < arr.length - 2 && cur > arr[i + 1][0]) i++;
    const a = arr[i], b = arr[i + 1];
    const t = Math.min(1, Math.max(0, (cur - a[0]) / (b[0] - a[0])));
    const e = t * t * (3 - 2 * t); // smoothstep
    return a[1] + (b[1] - a[1]) * e;
  }

  function placeCamera() {
    rig.px = 0;
    rig.py = modelCenterY;
    rig.pz = 6.8;
  }

  const modelTarget = new THREE.Vector3(0, modelCenterY, 0);
  let sceneVisible = true;

  function animate() {
    raf = requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (!reduced) {
      placeCamera();
      camera.position.x += (rig.px - camera.position.x) * Math.min(0.12, dt * 4);
      camera.position.y += (rig.py - camera.position.y) * Math.min(0.12, dt * 4);
      camera.position.z += (rig.pz - camera.position.z) * Math.min(0.12, dt * 4);
      look.set(0, modelCenterY, 0);
      camera.lookAt(look);

      modelGroup.position.y += (state.modelY - modelGroup.position.y) * Math.min(0.15, dt * 4);
      modelGroup.rotation.y = state.modelRot + spinAccum;

      if (petals) {
        spinAccum += dt * 0.02;
        petals.rotation.y = spinAccum;
        const pos = petals.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - dt * (0.12 + (i % 5) * 0.03);
          if (y < -4) { y = 4; pos.setX(i, (Math.random() - 0.5) * 14); }
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
    } else {
      camera.position.set(0, modelCenterY, 6.5);
      camera.lookAt(modelTarget);
      modelGroup.position.y += (0 - modelGroup.position.y) * Math.min(0.1, dt * 3);
      if (petals) petals.rotation.y += dt * 0.02;
    }

    if (sceneVisible) {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }
  }

  animate();

  // ---- Resize ----
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(w, h);
    }
  }
  window.addEventListener('resize', onResize);

  // ---- Pause rendering only when the tab is hidden (canvas stays mounted) ----
  const onVisibility = () => {
    sceneVisible = document.visibilityState === 'visible';
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (composer) composer.dispose();
      renderer.dispose();
      rootEl.innerHTML = '';
      tl.kill();
    }
  };
}

export default initScene;