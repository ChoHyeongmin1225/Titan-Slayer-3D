import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createEntities(scene) {
  const loader = new GLTFLoader();

  // 1. 바닥
  const groundGeo = new THREE.PlaneGeometry(100, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a4f54, roughness: 0.9, metalness: 0.1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true; 
  scene.add(ground);

  // --- [2. 보스 히트박스 및 모델 로드] ---
  const bossGeo = new THREE.BoxGeometry(10, 15, 5);
  const bossMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }); // 히트박스 숨김
  const boss = new THREE.Mesh(bossGeo, bossMat);
  boss.position.set(0, 7.5, -5); 
  scene.add(boss);

  boss.userData.model1 = null;
  boss.userData.model2 = null;

  // 👿 [새 모델] 1페이즈 보스 로드 (6SxKo - Pixel Knight)
  loader.load('/boss1/scene.gltf', (gltf) => {
    const bossModel1 = gltf.scene;
    
    // 🔧 1페이즈 스케일 튜닝: 이 모델은 기본 크기가 적당해서 약간만 키웁니다.
    bossModel1.scale.set(1.5, 1.5, 1.5); 
    // 발바닥을 히트박스 바닥(y=0)에 맞춥니다.
    bossModel1.position.set(0, -7.5, 0); 

    bossModel1.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    boss.add(bossModel1);
    boss.userData.model1 = bossModel1; 
    console.log("1페이즈 로우폴리 보스 로드 완료!");
  });

  // 💀 [새 모델] 2페이즈 보스 로드 (6VGs7 - Low Poly Demon)
  loader.load('/boss2/scene.gltf', (gltf) => {
    const bossModel2 = gltf.scene;
    
    // 🔧 2페이즈 스케일 튜닝 (핵심!): 이 모델은 기본 크기가 엄청나게 큽니다!!
    // 이전 코드처럼 5배로 키우면 은하계만해집니다. 0.05배 정도로 대폭 줄여야 합니다.
    bossModel2.scale.set(0.05, 0.05, 0.05); 
    
    // 이 악마 모델은 피벗(중심)이 발바닥에 있지 않아서 y위치를 더 세심하게 잡아줘야 합니다.
    // 일단 화면에 보이게 적당히 내립니다. 나중에 발바닥이 땅에 닿게 수정할 겁니다.
    bossModel2.position.set(0, -7.5, 0); 
    
    bossModel2.visible = false; // 처음엔 숨김
    
    bossModel2.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    boss.add(bossModel2);
    boss.userData.model2 = bossModel2; 
    console.log("2페이즈 거대 악마 로드 완료! (크기 대폭 축소됨)");
  });

  // 보스 양팔 (투명 히트박스)
  const armGeo = new THREE.BoxGeometry(3, 14, 4);
  armGeo.translate(0, -7, 0); 
  const armMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-6.5, 7.5, 0); 
  boss.add(leftArm); 

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(6.5, 7.5, 0); 
  boss.add(rightArm);

  // --- [3. 플레이어 로드 (아르토리우스 킵)] ---
  const playerGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
  const playerMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }); 
  const player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(0, 1.5, 5); 
  scene.add(player);

  loader.load('/player/scene.gltf', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5); 
    model.position.set(0, -1.5, 0);
    model.rotation.y = Math.PI;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.originalColor = child.material.color.getHex();
      }
    });
    player.add(model);
  });

  const originalSetHex = player.material.color.setHex.bind(player.material.color);
  player.material.color.setHex = (hex) => {
    originalSetHex(hex);
    player.traverse((child) => {
      if (child.isMesh && child.userData.originalColor !== undefined) {
        if (hex === 0x6a7b8c || hex === 0xFFD700) {
          child.material.color.setHex(child.userData.originalColor);
        } else {
          child.material.color.setHex(hex);
        }
      }
    });
  };

  return { player, boss, leftArm, rightArm };
}