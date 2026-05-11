import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function initScene() {
  const scene = new THREE.Scene();
  
  // 1. 배경: 완전한 어둠에서 -> 약간의 달빛이 스며든 짙은 청회색으로 밝게 조절
  const bgColor = 0x1a1c24; 
  scene.background = new THREE.Color(bgColor);
  // 안개도 조금 더 옅어지게, 멀리서부터 끼도록 조절
  scene.fog = new THREE.Fog(bgColor, 25, 100); 

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 40); 
  camera.lookAt(0, 5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  // ✨ 신규: 화면 전체의 노출(밝기)을 끌어올림! (기본값 1.0 -> 1.5)
  renderer.toneMappingExposure = 1.5; 
  document.querySelector('#app').appendChild(renderer.domElement);

  // 2. 조명: 전체적으로 빛의 세기(Intensity)를 대폭 상승
  // 주변광 (그림자 진 곳도 어느 정도 보이게 만들어줌)
  const ambientLight = new THREE.AmbientLight(0x707a8a, 2.0); 
  scene.add(ambientLight);
  
  // 주 조명 (달빛/창백한 빛 - 강도 1.5 -> 3.0 증가)
  const dirLight = new THREE.DirectionalLight(0xaaccff, 3.0);
  dirLight.position.set(10, 50, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // 지옥의 불길 조명 (바닥 아래에서 올라오는 붉은 광원 - 주황빛 섞고 강도 증가)
  const lavaLight = new THREE.PointLight(0xff4400, 20, 120);
  lavaLight.position.set(0, -10, 0);
  scene.add(lavaLight);

  // 3. 포스트 프로세싱 (Bloom)
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  composer.addPass(bloomPass);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, composer };
}