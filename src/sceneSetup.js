import * as THREE from 'three';

export function initScene() {
  const scene = new THREE.Scene();
  
  // ✨ 잿빛 하늘과 황량한 안개
  const skyColor = 0x5a636e; 
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.Fog(skyColor, 30, 80); 

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 40); 
  camera.lookAt(0, 5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // 그림자 렌더링 활성화
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  document.querySelector('#app').appendChild(renderer.domElement);

  // ✨ 창백한 환경광
  const ambientLight = new THREE.AmbientLight(0x8899a6, 1.5); 
  scene.add(ambientLight);
  
  // ✨ 차가운 주 조명 (그림자 생성)
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

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}