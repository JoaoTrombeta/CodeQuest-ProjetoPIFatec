document.addEventListener('DOMContentLoaded', () => {
  // --- 1. DEFINIÇÃO DE DADOS ---
  const cardLibrary = {
      'attack_5': { id: 'attack_5', name: 'Patch Rápido', cost: 1, type: 'action', value: 5, description: 'Causa 5 de dano.' },
      'attack_12': { id: 'attack_12', name: 'Refatoração Agressiva', cost: 2, type: 'action', value: 12, description: 'Causa 12 de dano.' },
      'defend_8': { id: 'defend_8', name: 'Firewall Básico', cost: 1, type: 'action', value: 8, description: 'Ganha 8 de bloqueio.' },
      'defend_15': { id: 'defend_15', name: 'Firewall Avançado', cost: 2, type: 'action', value: 15, description: 'Ganha 15 de bloqueio.' },
      'exit_process': { id: 'exit_process', name: 'Sair do Processo', cost: 1, type: 'utility', description: 'Esquiva de todos os ataques inimigos neste turno.' },
      'mem_upgrade': { id: 'mem_upgrade', name: 'Overclock de RAM', cost: 1, type: 'permanent_upgrade', description: 'Aumenta sua Memória Máxima em 1 a 3 pontos. Esta carta é removida do jogo após o uso.' },
      'heal_structural': { id: 'heal_structural', name: 'Correção Estrutural', cost: 2, type: 'utility', description: 'Recupera de 3 a 8 pontos de vida.'}
  };

  const enemyList = [
      { name: 'Lag Spike Repetitivo', hp: 40, maxHp: 40, intent: [{ type: 'attack', value: 6, times: 2 }] },
      { name: 'Firewall Corrompido', hp: 60, maxHp: 60, intent: [{ type: 'defend', value: 10 }, { type: 'attack', value: 8 }] },
      { name: 'Processo Fantasma', hp: 50, maxHp: 50, intent: [{ type: 'attack', value: 18 }] },
      { name: 'Bug Mestre', hp: 100, maxHp: 100, intent: [{ type: 'attack', value: 8 }, { type: 'defend', value: 8 }, { type: 'attack', value: 8 }] }
  ];

  let gameState;

  // --- 2. ELEMENTOS DO DOM ---
  const playerHpText = document.getElementById('player-hp-text'), playerHpBar = document.getElementById('player-hp-bar');
  const memoryText = document.getElementById('memory-text'), playerHandDiv = document.getElementById('player-hand');
  const deckCountText = document.getElementById('deck-count'), enemyName = document.getElementById('enemy-name');
  const enemyHpText = document.getElementById('enemy-hp-text'), enemyHpBar = document.getElementById('enemy-hp-bar');
  const enemyIntentDiv = document.getElementById('enemy-intent'), executionStackDiv = document.getElementById('execution-stack');
  const endTurnBtn = document.getElementById('end-turn-btn');
  const victoryScreen = document.getElementById('victory-screen'), victoryTitle = document.getElementById('victory-title');
  const scoreDisplay = document.getElementById('score-display'), continueBtn = document.getElementById('continue-btn');
  const exitBtn = document.getElementById('exit-btn'), restartBtn = document.getElementById('restart-btn');
  const specialRewardDisplay = document.getElementById('special-reward-display');
  const rewardText = document.getElementById('reward-text');
  const addUpgradeBtn = document.getElementById('add-upgrade-btn');

  // NOVOS ELEMENTOS DE UI
  const accessibilityToggle = document.getElementById('accessibility-toggle');
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const closeHelpBtn = document.getElementById('close-help-btn');

  // --- 3. FUNÇÕES PRINCIPAIS DO JOGO ---

  function initializeGame() {
      gameState = {
          player: {
              hp: 50, maxHp: 50, memory: 0, maxMemory: 3, block: 0,
              deck: [], hand: [], discard: [], exhausted: [],
              status: { isDodging: false }
          },
          currentEnemyIndex: 0, cardsPlayedCount: 0, turn: 0
      };
      // DECK INICIAL REBALANCEADO
      gameState.player.deck = [
          'attack_5', 'attack_5', 'attack_5', 'attack_5', 'attack_5','attack_5', 'attack_5', 'attack_5', 'attack_5', 'attack_5',
          'defend_8', 'defend_8', 'defend_8', 'defend_8',
          'attack_12', 'defend_15',
          'exit_process', 
          'heal_structural'
      ];
      shuffleDeck(gameState.player.deck);
      loadEnemy();
      startTurn();
      victoryScreen.classList.add('hidden');
      restartBtn.classList.add('hidden');
      exitBtn.classList.remove('hidden');
      continueBtn.classList.remove('hidden');
      scoreDisplay.textContent = '';
  }

  function loadEnemy() {
      const enemyData = enemyList[gameState.currentEnemyIndex];
      gameState.enemy = JSON.parse(JSON.stringify(enemyData));
  }
  
  function startTurn() {
      gameState.turn++;
      gameState.player.memory += gameState.player.maxMemory;
      const memoryCap = 10 + gameState.turn; // Sua lógica de cap
      if (gameState.player.memory > memoryCap) { gameState.player.memory = memoryCap; }
      gameState.player.block = 0;
      gameState.player.status.isDodging = false;
      gameState.executionStack = [];
      drawCards(5);
      updateUI();
  }

  function endTurn() {
      executePlayerActions();
      if (gameState.enemy.hp > 0) { executeEnemyAction(); }
      checkGameEnd();
      if (gameState.player.hp > 0 && gameState.enemy.hp > 0) {
          const handToDiscard = gameState.player.hand.map(c => c.id);
          gameState.player.discard.push(...handToDiscard);
          gameState.player.hand = [];
          const stackToDiscard = gameState.executionStack.filter(c => c.type !== 'permanent_upgrade').map(c => c.id);
          const stackToExhaust = gameState.executionStack.filter(c => c.type === 'permanent_upgrade').map(c => c.id);
          gameState.player.discard.push(...stackToDiscard);
          gameState.player.exhausted.push(...stackToExhaust);
          startTurn();
      }
  }

  function executePlayerActions() {
      for (const card of gameState.executionStack) {
          if (card.type === 'action') {
              if (card.name.includes('Patch') || card.name.includes('Refatoração')) { gameState.enemy.hp -= card.value; } 
              else if (card.name.includes('Firewall')) { gameState.player.block += card.value; }
          } 
          else if (card.type === 'utility') {
              if (card.id === 'exit_process') { gameState.player.status.isDodging = true; }
              if (card.id === 'heal_structural') {
                  const healAmount = Math.floor(Math.random() * 6) + 3; // Cura de 3 a 8
                  gameState.player.hp += healAmount;
                  if(gameState.player.hp > gameState.player.maxHp) {
                      gameState.player.hp = gameState.player.maxHp;
                  }
              }
          } 
          else if (card.type === 'permanent_upgrade') {
              const memoryBoost = Math.floor(Math.random() * 3) + 1;
              gameState.player.maxMemory += memoryBoost;
          }
      }
  }

  function executeEnemyAction() {
      gameState.enemy.intent.forEach(action => {
          if (action.type === 'attack') {
              let damage = action.value * (action.times || 1);
              if (gameState.player.status.isDodging) { damage = 0; }
              const damageToPlayer = Math.max(0, damage - gameState.player.block);
              gameState.player.hp -= damageToPlayer;
          } else if (action.type === 'defend') {
              gameState.enemy.hp = Math.min(gameState.enemy.maxHp, gameState.enemy.hp + action.value);
          }
      });
  }
  
  function checkGameEnd() {
      if (gameState.enemy.hp <= 0) { showVictoryScreen(); } 
      else if (gameState.player.hp <= 0) {
          alert('Você foi derrotado! O sistema caiu.');
          initializeGame();
      }
  }

  // --- 4. FUNÇÕES DE RECOMPENSA E PONTUAÇÃO ---
  function showVictoryScreen() {
      specialRewardDisplay.classList.add('hidden');
      addUpgradeBtn.classList.add('hidden');
      if (Math.random() < 0.3) { grantRandomReward(); }
      victoryScreen.classList.remove('hidden');
      if (gameState.currentEnemyIndex >= enemyList.length - 1) {
          victoryTitle.textContent = "TODOS OS BUGS FORAM CORRIGIDOS!";
          continueBtn.classList.add('hidden');
          exitBtn.textContent = "Ver Pontuação Final";
      }
  }
  function grantRandomReward() {
      specialRewardDisplay.classList.remove('hidden');
      const memoryBoost = Math.floor(Math.random() * 2) + 1;
      if (Math.random() < 0.5) {
          rewardText.textContent = `Você otimizou o sistema e encontrou um Módulo de RAM! Sua Memória Máxima aumentou em ${memoryBoost}.`;
          gameState.player.maxMemory += memoryBoost;
      } else {
          rewardText.textContent = `Você encontrou uma brecha para um Overclock de RAM! Adicione uma carta de upgrade permanente ao seu baralho.`;
          addUpgradeBtn.classList.remove('hidden');
      }
  }
  function handleAddUpgrade() {
      gameState.player.deck.push('mem_upgrade');
      shuffleDeck(gameState.player.deck);
      rewardText.textContent = "Carta 'Overclock de RAM' adicionada ao seu baralho!";
      addUpgradeBtn.classList.add('hidden');
      updateUI();
  }
  function handleContinue() {
      victoryScreen.classList.add('hidden');
      gameState.currentEnemyIndex++;
      loadEnemy();
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 15);
      startTurn();
  }
  function handleExit() {
      const score = calculateScore();
      scoreDisplay.textContent = `Sua pontuação final: ${score} / 100`;
      continueBtn.classList.add('hidden');
      exitBtn.classList.add('hidden');
      restartBtn.classList.remove('hidden');
      specialRewardDisplay.classList.add('hidden');
  }
  function calculateScore() {
      const hpPercent = gameState.player.hp / gameState.player.maxHp;
      const hpScore = Math.round(hpPercent * 60);
      const expectedCards = (gameState.currentEnemyIndex + 1) * 8;
      const actionScore = Math.max(0, 40 - (gameState.cardsPlayedCount - expectedCards) * 2);
      return Math.max(0, Math.min(100, hpScore + actionScore));
  }

  // --- 5. FUNÇÕES AUXILIARES (CARTAS) ---
  function shuffleDeck(deck) {
      for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
      }
  }
  function drawCards(amount) {
      for (let i = 0; i < amount; i++) {
          if (gameState.player.hand.length >= 10) break;
          if (gameState.player.deck.length === 0) {
              if (gameState.player.discard.length === 0) break;
              gameState.player.deck = gameState.player.discard;
              gameState.player.discard = [];
              shuffleDeck(gameState.player.deck);
          }
          const cardId = gameState.player.deck.pop();
          if (cardLibrary[cardId]) {
              gameState.player.hand.push(cardLibrary[cardId]);
          } else {
              console.warn(`Tentativa de comprar carta com ID inválido: ${cardId}`);
          }
      }
  }
  function playCard(card) {
      if (gameState.player.memory >= card.cost) {
          gameState.player.memory -= card.cost;
          gameState.cardsPlayedCount++;
          const cardIndex = gameState.player.hand.findIndex(c => c.id === card.id);
          const [playedCard] = gameState.player.hand.splice(cardIndex, 1);
          gameState.executionStack.push(playedCard);
          updateUI();
      } else {
          alert("Memória insuficiente!");
      }
  }
  function unplayCard(cardIndex) {
      const [cardToReturn] = gameState.executionStack.splice(cardIndex, 1);
      gameState.player.hand.push(cardToReturn);
      gameState.player.memory += cardToReturn.cost;
      gameState.cardsPlayedCount--;
      updateUI();
  }

  // --- 6. FUNÇÃO DE ATUALIZAÇÃO DA INTERFACE (UI) ---
  function updateUI() {
      playerHpText.textContent = `${Math.max(0, gameState.player.hp)} / ${gameState.player.maxHp}`;
      playerHpBar.style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
      memoryText.textContent = `${gameState.player.memory} / ${gameState.player.maxMemory}`;
      deckCountText.textContent = gameState.player.deck.length;
      if (gameState.enemy) {
          enemyName.textContent = gameState.enemy.name;
          enemyHpText.textContent = `${Math.max(0, gameState.enemy.hp)} / ${gameState.enemy.maxHp}`;
          enemyHpBar.style.width = `${(gameState.enemy.hp / gameState.enemy.maxHp) * 100}%`;
          enemyIntentDiv.innerHTML = gameState.enemy.intent.map(action => `<span>${action.type.toUpperCase()}: ${action.value}${action.times > 1 ? ` (x${action.times})` : ''}</span>`).join(' | ');
      }
      renderCards(playerHandDiv, gameState.player.hand, true);
      renderCards(executionStackDiv, gameState.executionStack, false);
  }
  
  // =======================================================
  // === FUNÇÕES DE ACESSIBILIDADE ADICIONADAS ===
  // =======================================================
  
  // Função helper para falar o texto
  function speak(text) {
      // Verifica se a acessibilidade está ligada
      if (!accessibilityToggle.checked) return;
      
      // Cancela qualquer fala anterior para não sobrepor
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
  }

  // Cria o texto a ser falado para uma carta
  function getCardSpeech(card) {
      return `Carta: ${card.name}. Custo: ${card.cost} de memória. Descrição: ${card.description}`;
  }

  function renderCards(container, cards, isPlayerHand) {
      container.innerHTML = '';
      cards.forEach((card, index) => {
          const cardEl = document.createElement('div');
          cardEl.className = 'card';
          cardEl.innerHTML = `<div class="card-name">${card.name}</div><div class="card-cost">${card.cost}</div><div class="card-description">${card.description}</div>`;
          
          // Define a ação (jogar ou desfazer)
          const action = isPlayerHand ? () => playCard(card) : () => unplayCard(index);

          // Adiciona eventos de clique
          cardEl.onclick = action;

          // --- Adiciona eventos de Acessibilidade ---
          
          // 1. Torna a carta "focável" pelo teclado
          cardEl.tabIndex = 0; 
          cardEl.setAttribute('role', 'button');
          cardEl.setAttribute('aria-label', getCardSpeech(card));

          // 2. Adiciona "fala" ao passar o mouse ou focar
          cardEl.addEventListener('mouseover', () => speak(getCardSpeech(card)));
          cardEl.addEventListener('focus', () => speak(getCardSpeech(card)));

          // 3. Adiciona seleção por teclado (Enter ou Espaço)
          cardEl.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault(); // Impede a página de rolar (com a barra de espaço)
                  action(); // Executa a mesma ação do clique
              }
          });

          container.appendChild(cardEl);
      });
  }

  // --- 7. INICIALIZAÇÃO E EVENT LISTENERS ---
  endTurnBtn.addEventListener('click', endTurn);
  continueBtn.addEventListener('click', handleContinue);
  exitBtn.addEventListener('click', handleExit);
  restartBtn.addEventListener('click', initializeGame);
  addUpgradeBtn.addEventListener('click', handleAddUpgrade);
  
  // NOVOS EVENT LISTENERS
  accessibilityToggle.addEventListener('change', () => {
      document.body.classList.toggle('accessibility-mode', accessibilityToggle.checked);
      // Para a fala se o usuário desligar
      if (!accessibilityToggle.checked) {
          window.speechSynthesis.cancel();
      }
  });
  helpBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
  });
  closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
  });

  // Inicia o jogo
  initializeGame();
});