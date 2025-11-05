const socket = io();
let playerIndex = null;
let currentTurn = 0;
let selectedCards = [];

// inicialização
socket.on("init", (data) => {
  playerIndex = data.playerIndex;
  updateUI(data.gameState);
  addLog(`Você é o Jogador ${playerIndex + 1}`);
});

// atualizações gerais
socket.on("updateState", (state) => {
  updateUI(state);
});

socket.on("turnChange", (turn) => {
  currentTurn = turn;
  const label = document.getElementById("turnLabel");
  label.textContent = `Turno: Jogador ${turn + 1}`;
  toggleTurnEffects();
});

socket.on("log", (msg) => addLog(msg));

// renderização simples do deck (exemplo estático)
const hand = [
  { id: 1, label: "Ataque", desc: "Causa 3 de dano", damage: 3 },
  { id: 2, label: "Defesa", desc: "Bloqueia 2 de dano", shield: 2 },
  { id: 3, label: "Cura", desc: "Recupera 2 HP", heal: 2 },
];

function renderHand() {
  const handDiv = document.getElementById(`hand${playerIndex + 1}`);
  handDiv.innerHTML = "";
  hand.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${card.label}</strong><small>${card.desc}</small>`;
    div.addEventListener("click", () => toggleSelect(div, card));
    handDiv.appendChild(div);
  });
}

function toggleSelect(div, card) {
  if (currentTurn !== playerIndex) return;
  div.classList.toggle("selected");
  const already = selectedCards.find(c => c.id === card.id);
  if (already) {
    selectedCards = selectedCards.filter(c => c.id !== card.id);
  } else {
    selectedCards.push(card);
  }
}

renderHand();

// botão Executar
document.getElementById("runBtn").addEventListener("click", () => {
  if (currentTurn !== playerIndex) {
    addLog("⏳ Aguardando sua vez...");
    return;
  }

  if (selectedCards.length === 0) {
    addLog("Selecione ao menos uma carta!");
    return;
  }

  socket.emit("executeTurn", { player: playerIndex, actions: selectedCards });
  selectedCards = [];
  document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
});

function addLog(msg) {
  const log = document.getElementById("log");
  const entry = document.createElement("div");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function updateUI(state) {
  document.getElementById("hp1").textContent = state.hp[0];
  document.getElementById("hp2").textContent = state.hp[1];
  document.getElementById("en1").textContent = state.energy[0];
  document.getElementById("en2").textContent = state.energy[1];
  currentTurn = state.turn;
  toggleTurnEffects();
}

function toggleTurnEffects() {
  const me = document.getElementById(`player${playerIndex + 1}`);
  const opp = document.getElementById(`player${playerIndex === 0 ? 2 : 1}`);
  if (currentTurn === playerIndex) {
    me.classList.remove("blurred");
    opp.classList.add("blurred");
  } else {
    me.classList.add("blurred");
    opp.classList.remove("blurred");
  }
}
