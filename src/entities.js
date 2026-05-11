import * as THREE from 'three';

export function createEntities(scene) {
  // 바닥: 차가운 잿빛 석재
  const groundGeo = new THREE.PlaneGeometry(100, 30);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a4f54, 
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true; 
  scene.add(ground);

  // 보스 본체: 육중한 고철/암석 느낌
  const bossGeo = new THREE.BoxGeometry(10, 15, 5);
  const bossMat = new THREE.MeshStandardMaterial({ 
    color: 0x555555, // 어둡지만 형태가 보이도록 명도 조절
    metalness: 0.7, // 쇠 같은 느낌
    roughness: 0.4
  });
  const boss = new THREE.Mesh(bossGeo, bossMat);
  boss.position.set(0, 7.5, -5); 
  boss.castShadow = true; 
  boss.receiveShadow = true;
  scene.add(boss);

  // 보스 양팔
  const armGeo = new THREE.BoxGeometry(3, 14, 4);
  armGeo.translate(0, -7, 0); 
  const armMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.7, roughness: 0.4 });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-6.5, 7.5, 0); 
  leftArm.castShadow = true;
  boss.add(leftArm); 

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(6.5, 7.5, 0); 
  rightArm.castShadow = true;
  boss.add(rightArm);

  // 플레이어: 아르토리우스 특유의 탁한 은색 + 푸른빛 갑옷 모티브
  const playerGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
  const playerMat = new THREE.MeshStandardMaterial({ 
    color: 0x6a7b8c, 
    metalness: 0.8, // 갑옷이므로 쇠 느낌을 강하게
    roughness: 0.3 
  }); 
  const player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(0, 1.5, 5); 
  player.castShadow = true; 
  scene.add(player);

  return { player, boss, leftArm, rightArm };
}