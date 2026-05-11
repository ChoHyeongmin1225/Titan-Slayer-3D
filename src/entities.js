import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createEntities(scene) {
  const loader = new GLTFLoader();

  // --- [✨ 1. 절망의 돌바닥: 절차적 텍스처 생성] ---
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 512, 512);
  // 무작위 균열 그리기
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
  for(let i=0; i<50; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random()*512, Math.random()*512);
    ctx.lineTo(Math.random()*512, Math.random()*512);
    ctx.stroke();
  }
  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(10, 5);

  const groundGeo = new THREE.PlaneGeometry(100, 30);
  const groundMat = new THREE.MeshStandardMaterial({ 
    map: floorTex, 
    roughness: 0.8, 
    metalness: 0.2,
    color: 0x444444
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true; 
  scene.add(ground);

  // --- [✨ 2. 지옥의 불씨 (Embers) 파티클] ---
  const emberCount = 200;
  const emberGeo = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPositions[i * 3] = (Math.random() - 0.5) * 60; // X
    emberPositions[i * 3 + 1] = Math.random() * 20;    // Y
    emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 30; // Z
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xffaa00,
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending // 빛나게 처리
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  scene.add(embers);

  // --- [3. 보스 & 플레이어 로직 (기존과 동일)] ---
  const boss = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 5), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }));
  boss.position.set(0, 7.5, -5); 
  scene.add(boss);
  boss.userData.model1 = null; boss.userData.model2 = null;

  // 보스 1, 2 모델 로드 (생략 - 기존 코드 유지)
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

  const player = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), new THREE.MeshStandardMaterial({transparent:true, opacity:0}));
  player.position.set(0, 1.5, 5); scene.add(player);
  loader.load('/player/scene.gltf', (gltf) => {
    const m = gltf.scene; m.scale.set(1.5, 1.5, 1.5); m.position.set(0, -1.5, 0); m.rotation.y = Math.PI;
    m.traverse(c => { if(c.isMesh) { c.castShadow = c.receiveShadow = true; c.userData.originalColor = c.material.color.getHex(); } });
    player.add(m);
  });

  return { player, boss, leftArm, rightArm, embers }; // ✨ embers 추가 반환
}