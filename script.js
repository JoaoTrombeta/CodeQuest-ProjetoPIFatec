// --- Acessibilidade extra: preview, Enter nas cartas, e fala segura ---
/**
 * showPreview(card): mostra um box de pré-visualização na área de controles
 * clearPreview(): remove
 * safeSpeak(text): chama speak(text) somente se a função existir (definida no HTML)
 */

function safeSpeak(text) {
  if (typeof speak === 'function') {
    try { speak(text); } catch (e) { /* falha silenciosa */ }
  }
}

const controlsEl = document.querySelector('.controls') || document.body;

let previewBox = document.getElementById('cardPreviewBox');
if (!previewBox) {
  previewBox = document.createElement('div');
  previewBox.id = 'cardPreviewBox';
  previewBox.setAttribute('aria-hidden', 'true');
  previewBox.style.minWidth = '200px';
  previewBox.style.padding = '8px';
  previewBox.style.borderRadius = '8px';
  previewBox.style.background = 'rgba(255,255,255,0.95)';
  previewBox.style.border = '1px solid rgba(0,0,0,0.08)';
  previewBox.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
  previewBox.style.marginTop = '8px';
  previewBox.style.fontSize = '13px';
  previewBox.style.display = 'none';
  controlsEl.appendChild(previewBox);
}

function showPreview(card) {
  if (!card) return;
  previewBox.innerHTML = `<strong>${card.label}</strong><div style="font-size:13px;color:#445;margin-top:4px">${card.desc}</div>`;
  previewBox.style.display = 'block';
  previewBox.setAttribute('aria-hidden', 'false');
}

function clearPreview() {
  previewBox.style.display = 'none';
  previewBox.setAttribute('aria-hidden', 'true');
}

// permitir ENTER nas cartas (quando focadas)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && active.classList && active.classList.contains('card')) {
      active.click();
      e.preventDefault();
    }
  }
});




// Código do jogo: Código de Batalha! — Edição Didática
// Dois jogadores locais. Cada turno: montar até 3 cartas, executar (interpretador simples).

const MAX_HAND = 5;
const MAX_PROG = 3;
const START_HP = 20;
const START_ENERGY = 3;

let state = {
  deck: [],
  discard: [],
  hands: [[], []],
  progs: [[], []],
  hp: [START_HP, START_HP],
  energy: [START_ENERGY, START_ENERGY],
  defense: [0, 0], // 🛡️ acumula o número de defesas ativas por jogador
  defenseTurns: [0, 0], // 🛡️ contador de turnos desde a última defesa
  turn: 0
};

const CARD_TYPES = [
  { id: 'atacar', label: 'ATACAR', cost: 1, desc: 'Causa 3 de dano.', energy: 1 },
  { id: 'defender', label: 'DEFENDER', cost: 1, desc: 'Aumenta sua defesa cumulativamente por 2 turnos.', energy: 1 },
  { id: 'curar', label: 'CURAR', cost: 2, desc: 'Restaura 4 de HP.', energy: 2 },
  { id: 'sehp', label: 'SE VIDA < 10 ENTÃO 3X', cost: 0, desc: 'Se sua vida < 10, executa a próxima carta 3 vezes.', energy: 0 },
  { id: 'repetir2', label: 'REPETIR 2X', cost: 0, desc: 'Repete a próxima carta 2 vezes.', energy: 0 },
  { id: 'varforca', label: 'VAR FORÇA = 2', cost: 0, desc: 'Define a força para 2 (modifica ATACAR).', energy: 0 },
  { id: 'erro', label: 'ERRO', cost: 0, desc: 'Carta de erro: cancela a próxima carta se o oponente a usar.', energy: 0 }
];

// helpers de DOM
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const el = {
  hand1: qs('#hand1'), hand2: qs('#hand2'),
  prog1: qs('#prog1'), prog2: qs('#prog2'),
  log: qs('#log'),
  hp1: qs('#hp1'), hp2: qs('#hp2'),
  en1: qs('#en1'), en2: qs('#en2'),
  turnLabel: qs('#turnLabel'), runBtn: qs('#runBtn'), clearBtn: qs('#clearBtn'), endBtn: qs('#endBtn')
};

function log(msg) {
  const d = document.createElement('div');
  d.textContent = msg;
  el.log.prepend(d);
}

function buildDeck() {
  const deck = [];
  for (let i = 0; i < 8; i++) deck.push({ ...CARD_TYPES[0] });
  for (let i = 0; i < 6; i++) deck.push({ ...CARD_TYPES[1] });
  for (let i = 0; i < 5; i++) deck.push({ ...CARD_TYPES[2] });
  for (let i = 0; i < 3; i++) deck.push({ ...CARD_TYPES[3] });
  for (let i = 0; i < 3; i++) deck.push({ ...CARD_TYPES[4] });
  for (let i = 0; i < 2; i++) deck.push({ ...CARD_TYPES[5] });
  for (let i = 0; i < 2; i++) deck.push({ ...CARD_TYPES[6] });
  return deck;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function draw(n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (state.deck.length === 0) {
      state.deck = state.discard.splice(0);
      shuffle(state.deck);
      log('Embaralhando descarte de volta ao deck.');
      if (state.deck.length === 0) break;
    }
    out.push(state.deck.pop());
  }
  return out;
}

function startGame() {
  state.deck = buildDeck();
  shuffle(state.deck);
  state.discard = [];
  state.hands = [[], []];
  state.progs = [[], []];
  state.hp = [START_HP, START_HP];
  state.energy = [START_ENERGY, START_ENERGY];
  state.defense = [0, 0]; // 🛡️ resetar defesa
  state.defenseTurns = [0, 0]; // 🛡️ resetar contador
  state.turn = 0;
  state.hands[0] = draw(MAX_HAND);
  state.hands[1] = draw(MAX_HAND);
  renderAll();
  log('Jogo iniciado! Jogador 1 começa.');
}

function createCardElement(card, playerIndex) {
  const div = document.createElement('div');
  div.className = 'card';
  div.tabIndex = 0;
  div.setAttribute('role', 'button');
  div.setAttribute('aria-label', `Carta: ${card.label}. ${card.desc}. Custo de energia: ${card.energy}`);

  // adiciona a bolinha de custo no canto superior direito
  div.innerHTML = `
    <div class="energy-badge">${card.energy}</div>
    <strong>${card.label}</strong>
    <small>${card.desc}</small>
  `;

  // Função de seleção (clique ou ENTER)
  const selectCard = () => {
    if (state.turn === playerIndex) {
      if (state.progs[playerIndex].length < MAX_PROG) {
        state.progs[playerIndex].push(card);
        const idx = state.hands[playerIndex].indexOf(card);
        if (idx >= 0) state.hands[playerIndex].splice(idx, 1);
        renderAll();
        speak(`Carta ${card.label} selecionada. Energia total atualizada.`);
      } else {
        log('Área cheia — máximo 3 cartas.');
        speak('Área cheia. Máximo de três cartas.');
      }
    } else {
      log('Não é seu turno.');
      speak('Não é seu turno.');
    }
  };

  div.onclick = selectCard;
  div.onkeypress = e => { if (e.key === 'Enter') selectCard(); };

  // Feedback ao focar ou passar o mouse
  div.onfocus = () => speak(`Carta: ${card.label}. ${card.desc}. Custa ${card.energy} de energia.`);
  div.onmouseover = () => speak(`Carta: ${card.label}. ${card.desc}. Custa ${card.energy} de energia.`);

  return div;
}




function renderPlayer(playerIndex) {
  const handEl = playerIndex === 0 ? el.hand1 : el.hand2;
  const progEl = playerIndex === 0 ? el.prog1 : el.prog2;
  const energyEl = playerIndex === 0 ? document.getElementById('energy1') : document.getElementById('energy2');

  handEl.innerHTML = '';
  progEl.innerHTML = '';
  let totalEnergy = 0;

  state.hands[playerIndex].forEach(c => handEl.appendChild(createCardElement(c, playerIndex)));
  
  state.progs[playerIndex].forEach((c, idx) => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `
      <div class="energy-cost">${c.energy}</div>
      <strong>${c.label}</strong>
      <small>${c.desc}</small>
    `;
    d.onclick = () => {
      if (state.turn === playerIndex) {
        state.hands[playerIndex].push(c);
        state.progs[playerIndex].splice(idx, 1);
        renderAll();
      }
    };
    progEl.appendChild(d);
    totalEnergy += c.energy;
  });

  energyEl.textContent = `Energia total: ${totalEnergy}`;
}



function renderAll() {
  renderPlayer(0);
  renderPlayer(1);
  el.hp1.textContent = state.hp[0];
  el.hp2.textContent = state.hp[1];
  el.en1.textContent = state.energy[0];
  el.en2.textContent = state.energy[1];
  el.turnLabel.textContent = `Turno: Jogador ${state.turn + 1}`;
  toggleVisibility();
}

function toggleVisibility() {
  const p1 = document.getElementById('player1');
  const p2 = document.getElementById('player2');
  if (!p1 || !p2) return;

  // os contêineres de status no seu HTML têm a classe "status"
  const p1Status = p1.querySelector('.status');
  const p2Status = p2.querySelector('.status');

  if (state.turn === 0) {
    // Jogador 1 ativo
    p1.classList.remove('blurred');
    p1.style.pointerEvents = 'auto';
    if (p1Status) { p1Status.style.visibility = 'visible'; p1Status.style.opacity = '1'; }

    p2.classList.add('blurred');
    p2.style.pointerEvents = 'none';
    if (p2Status) { p2Status.style.visibility = 'hidden'; p2Status.style.opacity = '0'; }
  } else {
    // Jogador 2 ativo
    p2.classList.remove('blurred');
    p2.style.pointerEvents = 'auto';
    if (p2Status) { p2Status.style.visibility = 'visible'; p2Status.style.opacity = '1'; }

    p1.classList.add('blurred');
    p1.style.pointerEvents = 'none';
    if (p1Status) { p1Status.style.visibility = 'hidden'; p1Status.style.opacity = '0'; }
  }
}




function applyDamage(targetIndex, dmg) {
  // 🛡️ aplicar defesa acumulada
  const reduction = state.defense[targetIndex] * 0.5; // cada defesa reduz 50% adicional (1 defesa = -50%, 2 defesas = -75%)
  const finalDamage = Math.ceil(dmg * Math.max(0, 1 - reduction));
  state.hp[targetIndex] = Math.max(0, state.hp[targetIndex] - finalDamage);
  log(`Jogador ${targetIndex + 1} recebeu ${finalDamage} de dano (${dmg} original, defesa x${state.defense[targetIndex]}).`);
}

function interpretProgram(playerIndex) {
  const ops = state.progs[playerIndex].map(c => c.id);
  const result = { actions: [], usedEnergy: 0 };
  let varForca = 1;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op === 'varforca') {
      varForca = 2;
      log('Variável: Força definida para 2.');
    } else if (op === 'atacar') {
      const cost = 1;
      result.usedEnergy += cost;
      const dmg = 3 * varForca;
      result.actions.push({ type: 'damage', target: 1 - playerIndex, amount: dmg });
      log(`ATACAR -> prepara ${dmg} de dano.`);
    } else if (op === 'defender') {
      const cost = 1;
      result.usedEnergy += cost;
      result.actions.push({ type: 'defend', target: playerIndex });
      log('DEFENDER -> acumula defesa.');
    } else if (op === 'curar') {
      const cost = 2;
      result.usedEnergy += cost;
      result.actions.push({ type: 'heal', target: playerIndex, amount: 4 });
      log('CURAR -> prepara cura de 4 HP.');
    } else if (op === 'sehp') {
      const next = ops[i + 1];
      if (state.hp[playerIndex] < 10 && next) {
        log('SE VIDA < 10: condição verdadeira — executando próxima carta 3 vezes.');
        for (let r = 0; r < 3; r++) {
          if (next === 'atacar') {
            result.usedEnergy += 1;
            const dmg = 3 * varForca;
            result.actions.push({ type: 'damage', target: 1 - playerIndex, amount: dmg });
          } else if (next === 'curar') {
            result.usedEnergy += 2;
            result.actions.push({ type: 'heal', target: playerIndex, amount: 4 });
          } else if (next === 'defender') {
            result.usedEnergy += 1;
            result.actions.push({ type: 'defend', target: playerIndex });
          }
        }
      } else {
        log('SE VIDA < 10: condição falsa — próxima carta ignorada.');
        i++; // pular a próxima carta
      }
    } else if (op === 'repetir2') {
      const next = ops[i + 1];
      if (next) {
        log('REPETIR 2X: repetindo próxima carta 2 vezes.');
        for (let r = 0; r < 2; r++) {
          if (next === 'atacar') {
            result.usedEnergy += 1;
            const dmg = 3 * varForca;
            result.actions.push({ type: 'damage', target: 1 - playerIndex, amount: dmg });
          } else if (next === 'curar') {
            result.usedEnergy += 2;
            result.actions.push({ type: 'heal', target: playerIndex, amount: 4 });
          }
        }
      }
      i++;
    } else if (op === 'erro') {
      log('ERRO: próxima carta cancelada.');
      i++;
    }
  }
  return result;
}

function executeTurn() {
  const p = state.turn;
  const program = state.progs[p];
  if (program.length === 0) {
    log('Programação vazia — nenhuma ação executada.');
    return endTurn();
  }

  const interp = interpretProgram(p);

  if (interp.usedEnergy > state.energy[p]) {
    log('Energia insuficiente — parte do código será ignorada.');
  }

  interp.actions.forEach(act => {
    if (act.type === 'damage') applyDamage(act.target, act.amount);
    else if (act.type === 'heal') {
      state.hp[act.target] = Math.min(START_HP, state.hp[act.target] + act.amount);
      log(`Jogador ${act.target + 1} recuperou ${act.amount} de HP.`);
    } else if (act.type === 'defend') {
      state.defense[act.target]++; // 🛡️ acumula defesa
      state.defenseTurns[act.target] = 0; // 🛡️ zera o contador de duração
      log(`Jogador ${act.target + 1} aumentou a defesa para ${state.defense[act.target]}.`);
    }
  });

  state.energy[p] = Math.max(0, state.energy[p] - Math.min(interp.usedEnergy, state.energy[p]));
  state.discard.push(...state.progs[p]);
  state.progs[p] = [];

  renderAll();

  if (state.hp[1 - p] <= 0) {
    log(`Jogador ${p + 1} venceu a batalha!`);
    alert(`🎉 Jogador ${p + 1} venceu!`);
    startGame();
    return;
  }

  endTurn();
}

function endTurn() {
  const current = state.turn;
  const next = 1 - current;

  // 🛡️ atualizar duração da defesa
  state.defenseTurns[current]++;
  if (state.defenseTurns[current] >= 2) {
    state.defense[current] = 0;
    log(`Defesa do Jogador ${current + 1} expirou.`);
  }

  state.turn = next;
  state.energy[next] = Math.min(START_ENERGY, state.energy[next] + 1);

  while (state.hands[next].length < MAX_HAND) {
    const d = draw(1);
    if (d.length === 0) break;
    state.hands[next].push(...d);
  }

  log(`Agora é o turno do Jogador ${next + 1}.`);
  renderAll();
}

// Botões
el.runBtn.addEventListener('click', () => {
  if (state.turn !== null) executeTurn();
});
el.clearBtn.addEventListener('click', () => {
  state.progs[state.turn] = [];
  renderAll();
});
el.endBtn.addEventListener('click', () => {
  log('Jogador passou o turno.');
  endTurn();
});

// Inicialização
startGame();

console.log('Dica: cada carta é uma instrução. A ordem e a lógica mudam o resultado. Explique sequência, condição e repetição.');
