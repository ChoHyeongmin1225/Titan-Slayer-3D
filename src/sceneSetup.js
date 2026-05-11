import * as THREE from 'three';
// ✨ 블룸 효과를 위한 포스트 프로세싱 모듈들 수입!
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function initScene() {
  const scene = new THREE.Scene();
  
  // 잿빛 하늘과 황량한 안개
  const skyColor = 0x5a636e; 
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.Fog(skyColor, 30, 80); 

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 40); 
  camera.lookAt(0, 5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  
  // ✨ 빛 번짐을 더 자연스럽게 만들어주는 톤 매핑 설정
  renderer.toneMapping = THREE.ReinhardToneMapping;
  document.querySelector('#app').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x8899a6, 1.5); 
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xeef5ff, 2.5); 
  directionalLight.position.set(20, 40, 20); 
  directionalLight.castShadow = true; 
  
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  scene.add(directionalLight);

  // --- [✨ 블룸(Bloom) 포스트 프로세싱 세팅] ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // UnrealBloomPass(해상도, 빛 강도, 반경, 임계값)
  // 임계값(Threshold)을 0.5로 두어 어두운 갑옷은 빛나지 않고, 원색의 밝은 이펙트만 빛나게 설정
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0.5);
  composer.addPass(bloomPass);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight); // 필터 사이즈도 같이 리사이즈
  });

  // 이제 renderer 대신 composer도 같이 내보냅니다.
  return { scene, camera, renderer, composer };
}