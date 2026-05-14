import * as THREE from 'three';
import { initScene } from './sceneSetup.js';
import { createEntities } from './entities.js';
import { initUI, updateHUD } from './ui.js';

// 1. 모듈 불러오기
const { scene, camera, renderer, composer } = initScene();
const { player, boss, leftArm, rightArm, embers } = createEntities(scene);
const uiElements = initUI();

// 2. 게임 상태 머신
const gameState = {
  status: 'START', 
  playerHealth: 20,
  bossHealth: 100,
  maxBossHealth: 100,
  isParryCooldown: false,
  isPhaseTwo: false,       
  phaseTwoStarted: false   
};

const keys = { a: false, d: false };
let isParrying = false; 
const moveSpeed = 0.4; 
const moveLimit = 25; 

let comboString = ""; 
let comboTimer = null; 
const COMBO_TIMEOUT = 600;
let leftArmTargetX = 0; 
let rightArmTargetX = 0; 

const warnings = []; 
const projectiles = [];
const slashes = []; 
const parryEffects = []; // ✨ 신규: 패링 성공 시 공간을 가르는 섬광 관리 배열

// --- [패턴 타이머 관리] ---
let warningTimer;
let projectileTimer;

function startPatterns(warningInterval, projInterval) {
  clearInterval(warningTimer);
  clearInterval(projectileTimer);
  warningTimer = setInterval(spawnWarning, warningInterval);
  projectileTimer = setInterval(spawnProjectile, projInterval);
}

startPatterns(3000, 800);

// --- [게임 리셋(재시작) 함수] ---
function resetGame() {
  gameState.playerHealth = 20;
  gameState.bossHealth = 100;
  gameState.isParryCooldown = false;
  
  gameState.isPhaseTwo = false;
  gameState.phaseTwoStarted = false;
  
  player.position.set(0, 1.5, 25); 
  player.material.color.setHex(0xFFD700);
  
  boss.material.color.setHex(0x333333); 
  leftArmTargetX = 0; rightArmTargetX = 0; 
  leftArm.rotation.x = 0; rightArm.rotation.x = 0; 

  if (boss.userData.model1 && boss.userData.model2) {
    boss.userData.model1.visible = true;  
    boss.userData.model2.visible = false; 
  }
  
  comboString = ""; 
  keys.a = false; keys.d = false;

  warnings.forEach(w => scene.remove(w.mesh));
  warnings.length = 0;
  projectiles.forEach(p => scene.remove(p));
  projectiles.length = 0;
  
  slashes.forEach(s => scene.remove(s.mesh));
  slashes.length = 0;

  // 패링 이펙트 초기화
  parryEffects.forEach(p => scene.remove(p.mesh));
  parryEffects.length = 0;

  startPatterns(3000, 800); 
  gameState.status = 'PLAYING';
}

// --- [키보드 입력 제어] ---
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault(); 

  if (gameState.status === 'START' && event.key === 'Enter') {
    gameState.status = 'PLAYING';
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`전체화면 전환 에러: ${err.message}`);
      });
    }
    return;
  }
  
  if ((gameState.status === 'GAMEOVER' || gameState.status === 'VICTORY') && (event.key === 'r' || event.key === 'R')) {
    resetGame();
    return;
  }

  if (gameState.status !== 'PLAYING') return;

  if (event.key === 'a' || event.key === 'A') keys.a = true;
  if (event.key === 'd' || event.key === 'D') keys.d = true;
  if (event.key === 'j' || event.key === 'J') handleAttack('J');
  if (event.key === 'k' || event.key === 'K') handleAttack('K');

  if (event.code === 'Space') {
    if (gameState.isParryCooldown) return;
    if (!isParrying) {
      isParrying = true;
      gameState.isParryCooldown = true; 
      
      // 패링 시전 시 준비 모션 (하늘색 깜빡임)
      player.material.color.setHex(0x00ffff); 
      setTimeout(() => {
        isParrying = false;
        player.material.color.setHex(0xFFD700); 
      }, 500);
      
      setTimeout(() => {
        gameState.isParryCooldown = false;
      }, 3000);
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'A') keys.a = false;
  if (event.key === 'd' || event.key === 'D') keys.d = false;
});

// --- [공격 로직] ---
function handleAttack(key) {
  clearTimeout(comboTimer);
  comboString += key;
  
  const colorJ = 0x301934;   
  const colorK = 0x4b0082;   
  const colorCombo = 0xee82ee; 

  let damage = 0;
  let effectColor = colorJ;
  let effectSize = 1;
  let tubeRadius = 0.8; 

  if (key === 'J') {
    damage = 1;
    effectColor = colorJ;
  } else if (key === 'K') {
    damage = 1;
    effectColor = colorK;
    effectSize = 1.3;
    tubeRadius = 1.5; 
  }

  if (comboString === 'JJJ') {
    damage += 2; effectSize = 1.8; effectColor = 0xda70d6; 
    tubeRadius = 1.2;
    comboString = ""; 
  } else if (comboString === 'JKJJK') {
    damage += 5; effectSize = 2.2; effectColor = colorCombo; 
    tubeRadius = 2.0;
    comboString = ""; 
  } else if (comboString.length >= 5) {
    comboString = ""; 
  }

  const attackRange = 6; 
  if (Math.abs(player.position.x - boss.position.x) <= attackRange) {
    const slashGeo = new THREE.TorusGeometry(5 * effectSize, tubeRadius, 16, 30, Math.PI / 1.5);
    
    const slashMat = new THREE.MeshStandardMaterial({ 
      color: 0x000000, 
      emissive: effectColor, 
      emissiveIntensity: 2, 
      transparent: true, 
      opacity: 1,
      side: THREE.DoubleSide 
    });
    
    const slash = new THREE.Mesh(slashGeo, slashMat);
    slash.scale.set(1, 1, 0.35); 
    slash.position.set(player.position.x, player.position.y + 1.5, player.position.z - 1.5);

    const isVertical = (key === 'K');
    if (isVertical) {
      slash.rotation.y = Math.PI / 2;
      slash.rotation.z = Math.PI / 4;
    } else {
      slash.rotation.x = Math.PI / 2;
      slash.rotation.z = Math.PI / 4;
    }

    scene.add(slash);
    slashes.push({ mesh: slash, life: 1.0, isVertical: isVertical });

    gameState.bossHealth -= damage;
    
    boss.material.color.setHex(0xffffff); 
    const baseColor = gameState.isPhaseTwo ? 0x8b0000 : 0x333333;
    setTimeout(() => boss.material.color.setHex(baseColor), 100); 
  }

  if (comboString !== "") {
    comboTimer = setTimeout(() => { comboString = ""; }, COMBO_TIMEOUT);
  }
}

// --- [패턴 생성기] ---
function spawnWarning() {
  if (gameState.status !== 'PLAYING') return; 
  const warnGeo = new THREE.PlaneGeometry(6, 6);
  const warnMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const warningMesh = new THREE.Mesh(warnGeo, warnMat);
  warningMesh.rotation.x = -Math.PI / 2;
  warningMesh.position.set(player.position.x, 0.01, player.position.z); 
  scene.add(warningMesh);
  
  const duration = gameState.isPhaseTwo ? 800 : 1500;
  warnings.push({ mesh: warningMesh, startTime: Date.now(), duration: duration });
}

function spawnProjectile() {
  if (gameState.status !== 'PLAYING') return; 
  const projGeo = new THREE.SphereGeometry(0.8);
  const projMat = new THREE.MeshBasicMaterial({ color: 0xff4500 }); 
  const projectile = new THREE.Mesh(projGeo, projMat);
  const randomX = (Math.random() - 0.5) * moveLimit * 2;
  projectile.position.set(randomX, 25, 5); 
  scene.add(projectile);
  projectiles.push(projectile);
}

// --- [메인 애니메이션 루프] ---
function animate() {
  requestAnimationFrame(animate);

  updateHUD(uiElements, gameState);

  if (gameState.status !== 'PLAYING') {
    renderer.render(scene, camera);
    return; 
  }

  // --- [검기 애니메이션] ---
  for (let i = slashes.length - 1; i >= 0; i--) {
    const s = slashes[i];
    s.life -= 0.08; 
    if (s.life <= 0) {
      scene.remove(s.mesh);
      slashes.splice(i, 1);
    } else {
      s.mesh.material.opacity = s.life;
      s.mesh.position.z -= 0.3; 
      s.mesh.rotation.z -= 0.3; 
      if (!s.isVertical) {
        s.mesh.scale.x += 0.05;
        s.mesh.scale.y += 0.05;
      }
    }
  }

  // --- [✨ 신규: 패링 '일섬' 애니메이션] ---
  for (let i = parryEffects.length - 1; i >= 0; i--) {
    const p = parryEffects[i];
    p.life -= 0.05; // 순식간에 사라짐 (약 0.3초)
    if (p.life <= 0) {
      scene.remove(p.mesh);
      parryEffects.splice(i, 1);
    } else {
      p.mesh.material.opacity = p.life;
      // ✨ 애니메이션 핵심: 두께(Y축)가 빛의 속도로 얇아지며 날카로운 선으로 변함
      p.mesh.scale.y *= 0.7; 
    }
  }

  // --- [2페이즈 광폭화 감지 및 연출] ---
  if (gameState.bossHealth <= gameState.maxBossHealth / 2 && !gameState.isPhaseTwo) {
    gameState.isPhaseTwo = true;
    
    if (boss.userData.model1 && boss.userData.model2) {
      boss.userData.model1.visible = false;
      boss.userData.model2.visible = true;
    } else {
      boss.material.color.setHex(0x8b0000); 
    }
    
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      camera.position.x = (Math.random() - 0.5) * 1.5;
      camera.position.y = 5 + (Math.random() - 0.5) * 1.5;
      shakeCount++;
      if (shakeCount > 20) { 
        clearInterval(shakeInterval);
        camera.position.set(0, 5, 40); 
      }
    }, 50);
  }

  if (gameState.isPhaseTwo && !gameState.phaseTwoStarted) {
    gameState.phaseTwoStarted = true;
    startPatterns(1500, 300); 
  }

  if (keys.a) player.position.x -= moveSpeed;
  if (keys.d) player.position.x += moveSpeed;
  player.position.x = Math.max(-moveLimit, Math.min(moveLimit, player.position.x));

  const currentTime = Date.now();
  
  // 장판 판정
  for (let i = warnings.length - 1; i >= 0; i--) {
    const w = warnings[i];
    const progress = (currentTime - w.startTime) / w.duration; 

    if (progress >= 1) {
      const isHit = Math.abs(player.position.x - w.mesh.position.x) < 3.75;
      if (isHit) {
        if (isParrying) { 
          // ✨ 패링 성공 시 쾌감 MAX 연출!
          gameState.bossHealth -= 25; 
          boss.material.color.setHex(0x00ff00); 
          const baseColor = gameState.isPhaseTwo ? 0x8b0000 : 0x333333;
          setTimeout(() => boss.material.color.setHex(baseColor), 200);

          // 1. 화면을 가르는 거대한 대각선 섬광 생성 (일섬)
          const cutGeo = new THREE.PlaneGeometry(200, 4); // 화면 전체를 덮을 만큼 거대하게!
          const cutMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x00ffff, // 찬란한 청백색
            emissiveIntensity: 10, // 블룸 효과 폭발 (가장 밝게)
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
          });
          const cutMesh = new THREE.Mesh(cutGeo, cutMat);
          
          // 카메라와 플레이어 사이, 화면 중앙을 가로지르도록 배치
          cutMesh.position.set(0, 5, 15);
          
          // 랜덤하게 왼쪽->오른쪽, 혹은 오른쪽->왼쪽 대각선으로 기울임
          cutMesh.rotation.z = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4 + Math.random() * 0.1);
          
          scene.add(cutMesh);
          parryEffects.push({ mesh: cutMesh, life: 1.0 });

          // 2. 타격감을 위한 짧고 강한 카메라 진동 (역경직 효과)
          let pShake = 0;
          const pShakeInt = setInterval(() => {
            camera.position.x = (Math.random() - 0.5) * 0.8;
            camera.position.y = 5 + (Math.random() - 0.5) * 0.8;
            pShake++;
            if(pShake > 4) { // 아주 짧게 흔들림 (순간적인 임팩트)
              clearInterval(pShakeInt);
              camera.position.set(0, 5, 40); // 원위치
            }
          }, 30);

        } else {
          gameState.playerHealth -= 5;
          player.material.color.setHex(0xff0000); 
          setTimeout(() => player.material.color.setHex(0xFFD700), 200); 
        }
      }

      if (w.mesh.position.x < 0) {
        leftArmTargetX = -Math.PI / 2.5; setTimeout(() => leftArmTargetX = 0, 400); 
      } else {
        rightArmTargetX = -Math.PI / 2.5; setTimeout(() => rightArmTargetX = 0, 400);
      }
      scene.remove(w.mesh);
      warnings.splice(i, 1);
    } else {
      w.mesh.material.opacity = (Math.sin(progress * Math.PI * 10) * 0.2) + 0.4; 
    }
  }

  // 탄막 판정
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.position.y -= 0.3; 

    const distX = Math.abs(p.position.x - player.position.x);
    const distY = Math.abs(p.position.y - player.position.y);

    if (distX < 1.2 && distY < 2) {
      gameState.playerHealth -= 1;
      player.material.color.setHex(0xff0000); 
      setTimeout(() => player.material.color.setHex(0xFFD700), 200);
      scene.remove(p);
      projectiles.splice(i, 1);
    } else if (p.position.y < -2) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  }

  leftArm.rotation.x += (leftArmTargetX - leftArm.rotation.x) * 0.2;
  rightArm.rotation.x += (rightArmTargetX - rightArm.rotation.x) * 0.2;

  if (gameState.playerHealth <= 0) {
    gameState.playerHealth = 0;
    gameState.status = 'GAMEOVER';
  } else if (gameState.bossHealth <= 0) {
    gameState.bossHealth = 0;
    gameState.status = 'VICTORY';
  }

  if (embers) {
    const positions = embers.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += 0.05; // 위로 상승
      positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01; // 좌우 흔들림
      if (positions[i + 1] > 20) positions[i + 1] = 0; // 천장에 닿으면 바닥으로
    }
    embers.geometry.attributes.position.needsUpdate = true;
  }

  composer.render();
}

animate();