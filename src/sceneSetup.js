import * as THREE from 'three';

export function initScene() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 40); 
  camera.lookAt(0, 5, 0);

  // ✨ 수정: antialias 옵션 유지, 픽셀 비율(DPR) 설정 추가
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio); // 고해상도 모니터 대응
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector('#app').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // ✨ 수정: 더 확실한 리사이즈 처리 함수
  window.addEventListener('resize', () => {
    // 1. 카메라 비율 맞추기
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // 2. 렌더러 사이즈를 창 크기에 정확히 맞추기
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}