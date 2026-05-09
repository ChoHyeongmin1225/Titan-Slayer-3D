export function initUI() {
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'absolute';
  uiContainer.style.top = '0';
  uiContainer.style.left = '0';
  uiContainer.style.width = '100vw';
  uiContainer.style.height = '100vh';
  uiContainer.style.pointerEvents = 'none'; 
  uiContainer.style.fontFamily = 'sans-serif';
  document.body.appendChild(uiContainer);

  // --- [기존 HUD 요소들] ---
  const bossHpBarBg = document.createElement('div');
  bossHpBarBg.style.position = 'absolute';
  bossHpBarBg.style.top = '20px';
  bossHpBarBg.style.left = '50%';
  bossHpBarBg.style.transform = 'translateX(-50%)';
  bossHpBarBg.style.width = '80%';
  bossHpBarBg.style.height = '30px';
  bossHpBarBg.style.backgroundColor = '#333';
  bossHpBarBg.style.border = '3px solid #fff';
  uiContainer.appendChild(bossHpBarBg);

  const bossHpBar = document.createElement('div');
  bossHpBar.style.width = '100%';
  bossHpBar.style.height = '100%';
  bossHpBar.style.backgroundColor = '#ff0000';
  bossHpBar.style.transition = 'width 0.1s ease-out'; 
  bossHpBarBg.appendChild(bossHpBar);

  const bossHpText = document.createElement('div');
  bossHpText.style.position = 'absolute';
  bossHpText.style.width = '100%';
  bossHpText.style.textAlign = 'center';
  bossHpText.style.color = '#fff';
  bossHpText.style.fontWeight = 'bold';
  bossHpText.style.lineHeight = '30px';
  bossHpBarBg.appendChild(bossHpText);

  const playerHpUi = document.createElement('div');
  playerHpUi.style.position = 'absolute';
  playerHpUi.style.top = '60px';
  playerHpUi.style.left = '10%';
  playerHpUi.style.color = '#fff';
  playerHpUi.style.fontSize = '24px';
  playerHpUi.style.fontWeight = 'bold';
  playerHpUi.style.textShadow = '2px 2px 4px #000';
  uiContainer.appendChild(playerHpUi);

  const parryUi = document.createElement('div');
  parryUi.style.position = 'absolute';
  parryUi.style.bottom = '40px';
  parryUi.style.left = '50%';
  parryUi.style.transform = 'translateX(-50%)';
  parryUi.style.fontSize = '20px';
  parryUi.style.fontWeight = 'bold';
  parryUi.style.textShadow = '2px 2px 4px #000';
  uiContainer.appendChild(parryUi);

  // --- [✨ 신규: 게임 상태 오버레이 (시작/종료 화면)] ---
  const screenContainer = document.createElement('div');
  screenContainer.style.position = 'absolute';
  screenContainer.style.top = '0';
  screenContainer.style.left = '0';
  screenContainer.style.width = '100vw';
  screenContainer.style.height = '100vh';
  screenContainer.style.display = 'flex';
  screenContainer.style.flexDirection = 'column';
  screenContainer.style.justifyContent = 'center';
  screenContainer.style.alignItems = 'center';
  screenContainer.style.backgroundColor = 'rgba(0,0,0,0.75)'; // 반투명 검은 배경
  screenContainer.style.zIndex = '10'; // HUD보다 위에 표시
  document.body.appendChild(screenContainer);

  const titleText = document.createElement('h1');
  titleText.style.fontSize = '5rem';
  titleText.style.margin = '0 0 20px 0';
  titleText.style.textShadow = '4px 4px 10px #000';
  screenContainer.appendChild(titleText);

  const subText = document.createElement('p');
  subText.style.fontSize = '2rem';
  subText.style.color = '#fff';
  subText.style.animation = 'blink 1.5s infinite alternate'; // 깜빡임 효과
  screenContainer.appendChild(subText);

  // 깜빡임 CSS 애니메이션 동적 추가
  const style = document.createElement('style');
  style.innerHTML = `@keyframes blink { from { opacity: 1; } to { opacity: 0.2; } }`;
  document.head.appendChild(style);

  return { bossHpBar, bossHpText, playerHpUi, parryUi, screenContainer, titleText, subText };
}

// 상태값을 받아와서 화면에 그려주는 업데이트 함수
export function updateHUD(uiElements, state) {
  // HUD 업데이트
  const healthPercent = Math.max(0, (state.bossHealth / state.maxBossHealth) * 100);
  uiElements.bossHpBar.style.width = `${healthPercent}%`;
  uiElements.bossHpText.innerText = `BOSS HP : ${state.bossHealth} / ${state.maxBossHealth}`;
  uiElements.playerHpUi.innerText = `💚 HP: ${state.playerHealth}`;

  if (state.isParryCooldown) {
    uiElements.parryUi.innerText = "🛡️ 패링 쿨타임 중...";
    uiElements.parryUi.style.color = "#ff4500";
  } else {
    uiElements.parryUi.innerText = "🛡️ 패링 준비 완료 (Space)";
    uiElements.parryUi.style.color = "#00ffff";
  }

  // --- [✨ 신규: 게임 상태에 따른 오버레이 텍스트 변경] ---
  if (state.status === 'PLAYING') {
    uiElements.screenContainer.style.display = 'none'; // 겜 중에는 덮개 숨김
  } else {
    uiElements.screenContainer.style.display = 'flex'; // 덮개 표시
    if (state.status === 'START') {
      uiElements.titleText.innerText = 'TITAN SLAYER 3D';
      uiElements.titleText.style.color = '#fff';
      uiElements.subText.innerText = 'Press [Enter] to Start';
    } else if (state.status === 'GAMEOVER') {
      uiElements.titleText.innerText = 'YOU DIED';
      uiElements.titleText.style.color = '#ff0000';
      uiElements.subText.innerText = 'Press [R] to Restart';
    } else if (state.status === 'VICTORY') {
      uiElements.titleText.innerText = 'VICTORY!';
      uiElements.titleText.style.color = '#00ff00';
      uiElements.subText.innerText = 'Press [R] to Restart';
    }
  }
}