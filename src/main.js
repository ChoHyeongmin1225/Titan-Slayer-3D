import * as THREE from 'three';
import { initScene } from './sceneSetup.js';
import { createEntities } from './entities.js';
import { initUI, updateHUD } from './ui.js';

// 1. 모듈 불러오기
const { scene, camera, renderer } = initScene();
const { player, boss, leftArm, rightArm } = createEntities(scene);
const uiElements = initUI();

// 2. ✨ 게임 상태 머신 (Phase 2 변수 추가)
const gameState = {
  status: 'START', 
  playerHealth: 20,
  bossHealth: 100, // 테스트용 체력 100
  maxBossHealth: 100,
  isParryCooldown: false,
  isPhaseTwo: false,       // 2페이즈 돌입 여부
  phaseTwoStarted: false   // 패턴 가속 실행 여부
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

// --- [✨ 패턴 타이머 관리] ---
let warningTimer;
let projectileTimer;

function startPatterns(warningInterval, projInterval) {
  clearInterval(warningTimer);
  clearInterval(projectileTimer);
  warningTimer = setInterval(spawnWarning, warningInterval);
  projectileTimer = setInterval(spawnProjectile, projInterval);
}

// 초기 시작은 1페이즈 속도!
startPatterns(3000, 800);

// --- [게임 리셋(재시작) 함수] ---
function resetGame() {
  gameState.playerHealth = 20;
  gameState.bossHealth = 100;
  gameState.isParryCooldown = false;
  
  // 2페이즈 초기화
  gameState.isPhaseTwo = false;
  gameState.phaseTwoStarted = false;
  
  player.position.set(0, 1.5, 5); 
  player.material.color.setHex(0xFFD700);
  
  boss.material.color.setHex(0x333333); // 보스 색상 원래대로
  leftArmTargetX = 0; rightArmTargetX = 0; 
  leftArm.rotation.x = 0; rightArm.rotation.x = 0; 
  
  comboString = ""; 
  keys.a = false; keys.d = false;

  warnings.forEach(w => scene.remove(w.mesh));
  warnings.length = 0;
  projectiles.forEach(p => scene.remove(p));
  projectiles.length = 0;

  startPatterns(3000, 800); // 패턴 속도 1페이즈로 원상복구
  gameState.status = 'PLAYING';
}

// --- [키보드 입력 제어] ---
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault(); 
  }

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
  
  let damage = 0;
  let effectColor = 0xffffff;
  let effectSize = 2;

  if (key === 'J') { damage = 1; effectColor = 0x00ffff; } 
  else if (key === 'K') { damage = 1; effectColor = 0xffa500; effectSize = 3; }

  if (comboString === 'JJJ') {
    damage += 2; effectSize = 5; effectColor = 0xff0000; comboString = ""; 
  } else if (comboString === 'JKJJK') {
    damage += 5; effectSize = 6; effectColor = 0xff00ff; comboString = ""; 
  } else if (comboString.length >= 5) {
    comboString = ""; 
  }

  const attackRange = 6; 
  if (Math.abs(player.position.x - boss.position.x) <= attackRange) {
    const effectGeo = new THREE.BoxGeometry(effectSize, effectSize, 1);
    const effectMat = new THREE.MeshBasicMaterial({ color: effectColor, transparent: true, opacity: 0.7 });
    const effect = new THREE.Mesh(effectGeo, effectMat);
    effect.position.set(player.position.x, player.position.y + 1, player.position.z - 2);
    scene.add(effect);
    setTimeout(() => scene.remove(effect), 100); 

    gameState.bossHealth -= damage;
    
    // 타격 시 번쩍임 (2페이즈면 붉은색으로 복구, 1페이즈면 짙은 회색으로 복구)
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
  warningMesh.position.set(player.position.x, 0.01, 2); 
  scene.add(warningMesh);
  
  // ✨ 2페이즈 돌입 시 장판 터지는 시간이 절반으로 짧아짐!
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

  // --- [✨ 2페이즈 광폭화 감지 및 연출] ---
  if (gameState.bossHealth <= gameState.maxBossHealth / 2 && !gameState.isPhaseTwo) {
    gameState.isPhaseTwo = true;
    console.log("🔥 보스 2페이즈 돌입! 광폭화!!");
    
    // 1. 보스 색상이 시뻘겋게 변함
    boss.material.color.setHex(0x8b0000); 
    
    // 2. 화면 흔들림(카메라 쉐이크) 연출
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      camera.position.x = (Math.random() - 0.5) * 1.5;
      camera.position.y = 5 + (Math.random() - 0.5) * 1.5;
      shakeCount++;
      if (shakeCount > 20) { 
        clearInterval(shakeInterval);
        camera.position.set(0, 5, 40); // 1초 뒤 카메라 원위치
      }
    }, 50);
  }

  // 3. 2페이즈 패턴 가속 발동
  if (gameState.isPhaseTwo && !gameState.phaseTwoStarted) {
    gameState.phaseTwoStarted = true;
    console.log("⚡ 패턴 가속 발동! (장판 1.5초, 탄막 0.3초 간격)");
    startPatterns(1500, 300); // 1.5초마다 장판, 0.3초마다 탄막 폭격!
  }
  // ----------------------------------------

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
          // ⚠️ 테스트를 위해 패링 데미지를 100 -> 25로 낮춤 (2페이즈를 보기 위함)
          gameState.bossHealth -= 25; 
          boss.material.color.setHex(0x00ff00); 
          const baseColor = gameState.isPhaseTwo ? 0x8b0000 : 0x333333;
          setTimeout(() => boss.material.color.setHex(baseColor), 200);
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

  renderer.render(scene, camera);
}

animate();