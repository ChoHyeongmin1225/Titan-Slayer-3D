import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createEntities(scene) {
  const loader = new GLTFLoader();

  // --- [✨ 1. 다크소울 배경 맵 로드] ---
  loader.load(
    '/map/scene.gltf', 
    (gltf) => {
      const mapModel = gltf.scene;
      
      // 🔧 맵 크기 및 위치 튜닝 (안전 수치로 시작)
      // 만약 안 보인다면 scale을 1, 1, 1로 먼저 확인해보는 게 좋습니다.
      const s = 0.001;
      mapModel.scale.set(s, s, s); 
      mapModel.position.set(0, 20, 0); 
      
      mapModel.traverse(node => {
        if (node.isMesh) {
          node.receiveShadow = true; 
          node.castShadow = true;
          // 맵이 검게 보일 수 있으므로 밝기를 강제로 올립니다.
          if(node.material) {
            node.material.side = THREE.DoubleSide; // 안팎 다 보이게
            node.material.envMapIntensity = 2.0; 
          }
        }
      });
      
      scene.add(mapModel);
      console.log("✅ 맵 로드 성공! 상세 정보:", mapModel);
      
      // 💡 팁: 맵이 너무 크면 이 정보를 보고 scale을 줄이세요.
      const box = new THREE.Box3().setFromObject(mapModel);
      const size = box.getSize(new THREE.Vector3());
      console.log("🗺️ 맵의 실제 크기:", size);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% 로딩 중...');
    },
    (error) => {
      console.error("❌ 맵 로드 실패! 경로를 확인하세요:", error);
    }
  );

  // --- [✨ 2. 지옥의 불씨 (Embers) 파티클] ---
  const emberCount = 300;
  const emberGeo = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPositions[i * 3] = (Math.random() - 0.5) * 80; 
    emberPositions[i * 3 + 1] = Math.random() * 30;    
    emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 50; 
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xffaa00, size: 0.12, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending 
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  scene.add(embers);

  // --- [3. 보스 히트박스] ---
  const boss = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 5), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }));
  boss.position.set(0, 7.5, -5); 
  scene.add(boss);
  boss.userData.model1 = null; boss.userData.model2 = null;

  loader.load('/boss1/scene.gltf', (gltf) => {
    const m = gltf.scene; m.scale.set(1.5, 1.5, 1.5); m.position.set(0, -7.5, 0);
    m.traverse(c => { if(c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    boss.add(m); boss.userData.model1 = m;
  });

  loader.load('/boss2/scene.gltf', (gltf) => {
    const m = gltf.scene; m.scale.set(0.05, 0.05, 0.05); m.position.set(0, -7.5, 0); m.visible = false;
    m.traverse(c => { if(c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    boss.add(m); boss.userData.model2 = m;
  });

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 4).translate(0,-7,0), new THREE.MeshStandardMaterial({transparent:true, opacity:0}));
  leftArm.position.set(-6.5, 7.5, 0); boss.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 4).translate(0,-7,0), new THREE.MeshStandardMaterial({transparent:true, opacity:0}));
  rightArm.position.set(6.5, 7.5, 0); boss.add(rightArm);

  // --- [4. 플레이어 히트박스] ---
  const player = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), new THREE.MeshStandardMaterial({transparent:true, opacity:0}));
  player.position.set(0, 1.5, 5); scene.add(player);
  loader.load('/player/scene.gltf', (gltf) => {
    const m = gltf.scene; m.scale.set(1.5, 1.5, 1.5); m.position.set(0, -1.5, 0); m.rotation.y = Math.PI;
    m.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; c.userData.originalColor = c.material.color.getHex(); } });
    player.add(m);
  });

  return { player, boss, leftArm, rightArm, embers }; 
}