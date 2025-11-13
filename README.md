# 🧩 Code Quest

**Code Quest** é um jogo de cartas single-player com temática de programação, desenvolvido com **HTML**, **CSS** e **JavaScript puro (ES6)**.  
O jogador enfrenta inimigos representando “bugs” e “erros do sistema”, jogando cartas que simbolizam ataques, defesas e utilitários.

Cada turno, o jogador gasta **Memória (recurso)** para executar cartas e pode organizar suas ações na **Pilha de Execução** antes de finalizar o turno.

---

## 📂 Estrutura do Projeto

code-quest/
│
├── index.html # Estrutura HTML principal do jogo
├── style.css # Estilos visuais
└── script.js # Lógica principal do jogo

yaml
Copiar código

---

## 🕹️ Mecânica do Jogo

### Objetivo
Derrotar todos os inimigos (“bugs”) antes que o HP do jogador chegue a zero.

### Recursos principais
- **HP (Vida):** diminui quando o jogador recebe dano.
- **Memória:** recurso gasto para jogar cartas; recarrega a cada turno.
- **Deck:** conjunto de cartas disponíveis.
- **Mão:** cartas disponíveis para jogar durante o turno.
- **Pilha de Execução:** área onde o jogador organiza ações antes de executar.

---

## 🃏 Sistema de Cartas

As cartas são definidas no objeto `cardLibrary`:

```js
{
  id: 'attack_5',
  name: 'Patch Rápido',
  cost: 1,
  type: 'action',
  value: 5,
  description: 'Causa 5 de dano.'
}
Tipos de cartas
Tipo	Função	Exemplo
action	Ataques ou defesas básicas	Patch Rápido, Firewall Básico
utility	Efeitos especiais	Sair do Processo
permanent_upgrade	Melhorias permanentes	Overclock de RAM

Deck inicial
4× Patch Rápido

3× Firewall Básico

1× Firewall Avançado

1× Refatoração Agressiva

1× Sair do Processo

🤖 Sistema de Inimigos
Os inimigos são definidos no array enemyList, com nome, HP e intenções (ações do inimigo):

js
Copiar código
{
  name: 'Lag Spike Repetitivo',
  hp: 40,
  maxHp: 40,
  intent: [{ type: 'attack', value: 6, times: 2 }]
}
Tipos de ações
attack: causa dano ao jogador

defend: recupera HP ou bloqueio

🔄 Fluxo de Jogo
1. Inicialização
Define o estado inicial (gameState)

Embaralha o deck

Carrega o primeiro inimigo

Inicia o primeiro turno

2. Turno do jogador
Incrementa turnos

Atualiza memória

Reseta bloqueios e esquivas

Compra 5 cartas

3. Jogar cartas (playCard)
Move carta da mão para a pilha de execução

Subtrai custo da memória

Atualiza UI

4. Desfazer cartas (unplayCard)
Move carta da pilha de volta para a mão

Restaura memória

Atualiza UI

5. Encerrar turno (endTurn)
Executa ações da pilha

Executa ações do inimigo

Verifica vitória ou derrota

Descarte automático

6. Vitória / Derrota
Vitória: ganha memória permanente ou nova carta

HP parcialmente restaurado

Derrota reinicia o jogo

🧠 Estrutura de Dados: gameState
js
Copiar código
gameState = {
  player: {
    hp: 50,
    maxHp: 50,
    memory: 0,
    maxMemory: 3,
    block: 0,
    deck: [],
    hand: [],
    discard: [],
    exhausted: [],
    status: { isDodging: false }
  },
  enemy: { ... },
  currentEnemyIndex: 0,
  cardsPlayedCount: 0,
  turn: 0
}
🎨 Interface Dinâmica (UI)
updateUI() atualiza HP, memória, cartas e inimigo

renderCards(container, cards, isPlayerHand) cria elementos visuais das cartas

Cliques na mão jogam carta; cliques na pilha desfazem carta

🧮 Sistema de Pontuação
Fator	Peso
HP restante	até 60 pontos
Eficiência de jogadas	até 40 pontos

Pontuação final: 0–100

🧰 Extensibilidade
Possibilidade	Como fazer
Novas cartas	Adicione objetos ao cardLibrary e implemente efeitos em executePlayerActions()
Novos inimigos	Insira objetos no array enemyList
Novos efeitos de status	Amplie gameState.player.status
Melhorias visuais	Adicione animações CSS nas classes .card, .hp-bar e .hidden

🚀 Melhorias Futuras
Animações de cartas e dano

Novos tipos de cartas (cura, buffs/debuffs)

Sistema de progressão com múltiplos inimigos

Salvamento em localStorage

Estatísticas e histórico de partidas

🏁 Conclusão
Code Quest é um protótipo funcional de jogo de cartas estratégico, com foco em gerenciamento de recursos e planejamento de ações.
A arquitetura modular e o uso de objetos para cartas, inimigos e estado do jogo tornam o código legível, expansível e didático.