import * as THREE from 'three';

export function createEntities(scene) {
  // 바닥
  const groundGeo = new THREE.PlaneGeometry(100, 20);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 보스 본체 및 양팔
  const bossGeo = new THREE.BoxGeometry(10, 15, 5);
  const bossMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const boss = new THREE.Mesh(bossGeo, bossMat);
  boss.position.set(0, 7.5, -5); 
  scene.add(boss);

  const armGeo = new THREE.BoxGeometry(3, 14, 4);
  armGeo.translate(0, -7, 0); 
  const armMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-6.5, 7.5, 0); 
  boss.add(leftArm); 

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(6.5, 7.5, 0); 
  boss.add(rightArm);

  // 플레이어
  const playerGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); 
  const player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(0, 1.5, 5); 
  scene.add(player);

  return { player, boss, leftArm, rightArm };
}