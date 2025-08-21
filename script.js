
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFINIÇÃO DE DADOS EXPANDIDA ---

    const cardLibrary = {
        'attack_5': { id: 'attack_5', name: 'Patch Rápido', cost: 1, type: 'action', value: 5, description: 'Causa 5 de dano.' },
        'attack_12': { id: 'attack_12', name: 'Refatoração Agressiva', cost: 2, type: 'action', value: 12, description: 'Causa 12 de dano.' },
        'defend_8': { id: 'defend_8', name: 'Firewall Básico', cost: 1, type: 'action', value: 8, description: 'Ganha 8 de bloqueio.' },
        'defend_15': { id: 'defend_20', name: 'Firewall Avançado', cost: 2, type: 'action', value: 20, description: 'Ganha 20 de bloqueio.' },
        'exit_process': { id: 'exit_process', name: 'Sair do Processo', cost: 1, type: 'utility', description: 'Esquiva de todos os ataques neste turno.' },
        'mem_upgrade': { id: 'mem_upgrade', name: 'Overclock de RAM', cost: 1, type: 'permanent_upgrade', description: 'Aumenta sua Memória Máxima em 1 a 3 pontos. Esta carta é removida do jogo após o uso.' }
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

    // --- 3. FUNÇÕES PRINCIPAIS DO JOGO ---

    function initializeGame() {
        gameState = {
            player: {
                hp: 50, maxHp: 50,
                // ALTERAÇÃO 1: Começamos com 0 de memória para que o primeiro turno adicione a quantidade correta.
                memory: 0, maxMemory: 3,
                block: 0,
                deck: [], hand: [], discard: [], exhausted: [],
                status: { isDodging: false }
            },
            currentEnemyIndex: 0, cardsPlayedCount: 0, turn: 0 // Turno começa em 0 para a lógica funcionar
        };
        gameState.player.deck = [ 'attack_5', 'attack_5', 'attack_5', 'attack_5', 'defend_8', 'defend_8', 'defend_8', 'defend_20', 'exit_process', 'attack_12' ];
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
        gameState.turn++; // Incrementa o turno no início
        // ALTERAÇÃO 2: Em vez de resetar, somamos a memória máxima à que sobrou.
        gameState.player.memory += gameState.player.maxMemory;
        
        // Adicionando um limite para a memória não acumular infinitamente
        const memoryCap = 10;
        if (gameState.player.memory > memoryCap) {
            gameState.player.memory = memoryCap;
        }

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
            } else if (card.type === 'utility' && card.id === 'exit_process') {
                gameState.player.status.isDodging = true;
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

        if (Math.random() < 0.3) {
            grantRandomReward();
        }
        
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

    // --- 5. FUNÇÕES AUXILIARES ---

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
            gameState.player.hand.push(cardLibrary[cardId]);
        }
    }

    function playCard(card) {
        if (gameState.player.memory >= card.cost) {
            gameState.player.memory -= card.cost;
            gameState.cardsPlayedCount++;
            const cardIndex = gameState.player.hand.findIndex(c => c.id === card.id);
            gameState.player.hand.splice(cardIndex, 1);
            gameState.executionStack.push(card);
            updateUI();
        } else {
            alert("Memória insuficiente!");
        }
    }

    function unplayCard(cardIndex) {
        // Pega a carta da pilha de execução e a remove
        const [cardToReturn] = gameState.executionStack.splice(cardIndex, 1);
        
        // Devolve a carta para a mão do jogador
        gameState.player.hand.push(cardToReturn);

        // Retorna a memória gasta
        gameState.player.memory += cardToReturn.cost;
        
        // Decrementa o contador de cartas jogadas
        gameState.cardsPlayedCount--;

        // Atualiza a interface
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
    
    function renderCards(container, cards, isPlayerHand) {
        container.innerHTML = '';
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `<div class="card-name">${card.name}</div><div class="card-cost">${card.cost}</div><div class="card-description">${card.description}</div>`;
            if (isPlayerHand) { cardEl.onclick = () => playCard(card); }
            container.appendChild(cardEl);
        });
    }

    // --- 7. INICIALIZAÇÃO E EVENT LISTENERS ---
    endTurnBtn.addEventListener('click', endTurn);
    continueBtn.addEventListener('click', handleContinue);
    exitBtn.addEventListener('click', handleExit);
    restartBtn.addEventListener('click', initializeGame);
    addUpgradeBtn.addEventListener('click', handleAddUpgrade);
    
    initializeGame();
});