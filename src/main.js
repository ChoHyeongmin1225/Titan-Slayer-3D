import * as THREE from 'three';
import { initScene } from './sceneSetup.js';
import { createEntities } from './entities.js';
import { initUI, updateHUD } from './ui.js';

// 1. 모듈 불러오기
const { scene, camera, renderer } = initScene();
const { player, boss, leftArm, rightArm } = createEntities(scene);
const uiElements = initUI();

// 2. ✨ 신규: 게임 상태 머신 (START, PLAYING, GAMEOVER, VICTORY)
const gameState = {
  status: 'START', 
  playerHealth: 20,
  bossHealth: 10000,
  maxBossHealth: 10000,
  isParryCooldown: false
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

// --- [✨ 신규: 게임 리셋(재시작) 함수] ---
function resetGame() {
  gameState.playerHealth = 20;
  gameState.bossHealth = 10000;
  gameState.isParryCooldown = false;
  
  player.position.set(0, 1.5, 5); // 플레이어 원위치
  player.material.color.setHex(0xFFD700);
  
  boss.material.color.setHex(0x333333);
  leftArmTargetX = 0; rightArmTargetX = 0; 
  leftArm.rotation.x = 0; rightArm.rotation.x = 0; 
  
  comboString = ""; 
  keys.a = false; keys.d = false;

  // 화면에 남은 장판과 탄막 싹 지우기
  warnings.forEach(w => scene.remove(w.mesh));
  warnings.length = 0;
  projectiles.forEach(p => scene.remove(p));
  projectiles.length = 0;

  gameState.status = 'PLAYING';
}

// --- [키보드 입력 제어] ---
window.addEventListener('keydown', (event) => {
  // ✨ 신규: 스페이스바를 눌렀을 때 화면이 밑으로 내려가는 브라우저 기본 동작 차단!
  if (event.code === 'Space') {
    event.preventDefault(); 
  }

  // ✨ 상태 화면 키 입력 처리 (시작 & 리스타트 및 전체화면)
  if (gameState.status === 'START' && event.key === 'Enter') {
    gameState.status = 'PLAYING';
    
    // ✨ 신규: Enter를 누르는 순간 전체화면(Fullscreen)으로 전환!
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

  // 게임 중이 아닐 때는 아래의 조작키 무시
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
    boss.material.color.setHex(0xffffff); 
    setTimeout(() => boss.material.color.setHex(0x333333), 100); 
  }

  if (comboString !== "") {
    comboTimer = setTimeout(() => { comboString = ""; }, COMBO_TIMEOUT);
  }
}

// --- [패턴 생성기 (✨상태 체크 추가)] ---
function spawnWarning() {
  if (gameState.status !== 'PLAYING') return; // 게임 중이 아니면 패턴 생성 안함
  const warnGeo = new THREE.PlaneGeometry(6, 6);
  const warnMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const warningMesh = new THREE.Mesh(warnGeo, warnMat);
  warningMesh.rotation.x = -Math.PI / 2;
  warningMesh.position.set(player.position.x, 0.01, 2); 
  scene.add(warningMesh);
  warnings.push({ mesh: warningMesh, startTime: Date.now(), duration: 1500 });
}
setInterval(spawnWarning, 3000);

function spawnProjectile() {
  if (gameState.status !== 'PLAYING') return; // 게임 중이 아니면 탄막 생성 안함
  const projGeo = new THREE.SphereGeometry(0.8);
  const projMat = new THREE.MeshBasicMaterial({ color: 0xff4500 }); 
  const projectile = new THREE.Mesh(projGeo, projMat);
  const randomX = (Math.random() - 0.5) * moveLimit * 2;
  projectile.position.set(randomX, 25, 5); 
  scene.add(projectile);
  projectiles.push(projectile);
}
setInterval(spawnProjectile, 800);

// --- [메인 애니메이션 루프] ---
function animate() {
  requestAnimationFrame(animate);

  // ✨ UI 화면 항상 업데이트
  updateHUD(uiElements, gameState);

  // ✨ 게임 중이 아닐 때는 여기서 루프 차단 (오브젝트 멈춤)
  if (gameState.status !== 'PLAYING') {
    renderer.render(scene, camera);
    return; 
  }

  // --- [여기서부터는 PLAYING 상태일 때만 실행됨] ---
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
          gameState.bossHealth -= 100; 
          boss.material.color.setHex(0x00ff00); 
          setTimeout(() => boss.material.color.setHex(0x333333), 200);
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

  // 팔 회전 보간
  leftArm.rotation.x += (leftArmTargetX - leftArm.rotation.x) * 0.2;
  rightArm.rotation.x += (rightArmTargetX - rightArm.rotation.x) * 0.2;

  // ✨ 승패 판정 로직
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