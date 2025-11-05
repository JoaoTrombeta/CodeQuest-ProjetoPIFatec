import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));

let players = [];
let gameState = {
  turn: 0,
  hp: [20, 20],
  energy: [3, 3],
};

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  // atribui índice 0 ou 1
  const playerIndex = players.length;
  players.push(socket.id);

  // envia estado inicial
  socket.emit("init", { playerIndex, gameState });

  // notifica todos
  io.emit("log", `Jogador ${playerIndex + 1} entrou no jogo!`);

  // jogador executa código
  socket.on("executeTurn", (data) => {
    const { player, actions } = data;

    // valida se é o turno dele
    if (player !== gameState.turn) return;

    // exemplo: ação simples
    const totalDamage = actions.reduce((sum, card) => sum + (card.damage || 0), 0);
    const opponent = player === 0 ? 1 : 0;
    gameState.hp[opponent] = Math.max(0, gameState.hp[opponent] - totalDamage);

    io.emit("log", `Jogador ${player + 1} executou ${actions.length} carta(s)!`);
    io.emit("updateState", gameState);

    // passa turno
    gameState.turn = opponent;
    io.emit("turnChange", gameState.turn);
  });

  socket.on("disconnect", () => {
    console.log("Jogador saiu:", socket.id);
    players = players.filter(id => id !== socket.id);
  });
});

server.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
