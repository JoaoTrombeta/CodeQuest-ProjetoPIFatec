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

```
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
```
## 🤖 Sistema de Inimigos
Os inimigos são definidos no array enemyList, com nome, HP e intenções (ações do inimigo):

```
{
  name: 'Lag Spike Repetitivo',
  hp: 40,
  maxHp: 40,
  intent: [{ type: 'attack', value: 6, times: 2 }]
}
```
## Tipos de ações
attack: causa dano ao jogador

defend: recupera HP ou bloqueio

## 🔄 Fluxo de Jogo
1. Inicialização
> Define o estado inicial (gameState)
> 
> Embaralha o deck
> 
> Carrega o primeiro inimigo
> 
> Inicia o primeiro turno

<br>

2. Turno do jogador
> Incrementa turnos
> 
> Atualiza memória
> 
> Reseta bloqueios e esquivas
> 
> Compra 5 cartas

<br>
3. Jogar cartas (playCard)

> Move carta da mão para a pilha de execução
> 
> Subtrai custo da memória
> 
> Atualiza UI

<br>

4. Desfazer cartas (unplayCard)

> Move carta da pilha de volta para a mão
> 
> Restaura memória
> 
> Atualiza UI

5. Encerrar turno (endTurn)

> Executa ações da pilha
> 
> Executa ações do inimigo
> 
> Verifica vitória ou derrota
> 
> Descarte automático

6. Vitória / Derrota

> Vitória: ganha memória permanente ou nova carta
> 
> HP parcialmente restaurado
> 
> Derrota reinicia o jogo

<br>

🧠 Estrutura de Dados: gameState
```
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
```
<br>

# 🎨 Interface Dinâmica (UI)

__updateUI():__ 
> atualiza HP, memória, cartas e inimigo

__renderCards(container, cards, isPlayerHand):__
> cria elementos visuais das cartas

Cliques na mão selecionam a carta à ser jogada; cliques na pilha desfazem a seleção

<br>

# 🧮 Sistema de Pontuação
<table>
<tr>
    <td>Fator</td>
    <td>Peso</td>
</tr>
<tr>
    <td>
        HP restante
    </td>
    <td>
        até 60 pontos
    </td>
</tr>
<tr>
    <td>
        Eficiência de jogadas
    </td>
    <td>
        até 40 pontos
    </td>
</tr>
</table>
<h3><u> Pontuação final: 0–100</u></h3>