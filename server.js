const express = require("express");
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Chess = require("chessboard-engine");

app.use('/', express.static('public'));

const GameMaster = {
	globalGameId: 0,
	currentPlayerCount: 0,
	currentGames: [],
	addGame: function(){
		console.log("Creating new game");
		let game = new Game(this.globalGameId++);
		this.currentGames.push(game)
		return game;
	},
	getOpenGame: function() {
		console.log("Getting open game");
		return this.currentGames[this.currentGames.length - 1];
	},
	removeGame: function (id) {
		for(let i = 0; i < this.currentGames.length; i++){
			if(this.currentGames[i].id == id){
				this.currentGames[i].close();
				this.currentGames.splice(i, 1);
			}
		}
	},
	clearGames: function () {
		console.log("Clearing games");
		this.currentGames.forEach(game => {
			game.close();
		})
		this.clearGames = [];
	}
};

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('disconnect', () => {
		console.log('user disconnected');
		if(socket.game && !socket.game.closed) GameMaster.removeGame(socket.game.id);
	});
	socket.on('get-game', (id) => {
		if (GameMaster.currentPlayerCount % 2 == 0){
			console.log("New game needed");
			socket.game = GameMaster.addGame();
			socket.game.addPlayer(socket);
			socket.color = 'white';
		}else{
			console.log("Adding player to game");
			socket.game = GameMaster.getOpenGame();
			if(!socket.game) console.log("Game not found");
			socket.game.addPlayer(socket);
			socket.color = 'black';
		}
	});
	socket.on('make-move', (move, fen) => {
		console.log(`Move: ${move}, Fen: ${fen}`);
		socket.game.move(socket.color, move, fen);
	});
});

function Game(id){
	this.playerWhite = null,
	this.playerBlack = null,
	this.id = id;
	this.closed = false;
	this.board = new Chess.Game();
	this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR' // The start state
	this.turn = 'white';

	this.addPlayer = function (player){
		if(this.playerBlack) return;
		if(this.playerWhite) {
			this.playerBlack = player;
			GameMaster.currentPlayerCount++;
			this.startGame();
			return;
		};
		this.playerWhite = player;
		GameMaster.currentPlayerCount++;
	}

	this.startGame = function() {
		this.playerWhite.emit("start-game", 'white');
		this.playerBlack.emit("start-game", 'black');
	}

	this.move = function (color, move, fen){
		// If the wrong player makes a move, then tell them to undo that move;
		if(this.turn != color){
			if(color == 'white') this.playerWhite.emit('false-move', 1);
			else this.playerBlack.emit('false-move', 1);
			return
		}

		let split = move.split("-");
		let check = this.board.move({from: split[0],to: split[1]})

		if(check.success){
			this.fen = fen;
			if(color == 'white'){
				this.playerBlack.emit('move-made', move);
				this.turn = 'black'
			} 
			else {
				this.playerWhite.emit('move-made', move);
				this.turn = 'white'
			}
		}else{
			if(color == 'white'){
				this.playerWhite.emit('false-move', 1);
			} 
			else {
				this.playerBlack.emit('false-move', 1);
			}
		}
	}

	this.close = function () {
		if(this.closed) return;
		console.log(`Game ${this.id} closing`);
		if(this.playerWhite) {
			this.playerWhite.disconnect();
			GameMaster.currentPlayerCount--;
		}
		if(this.playerBlack) {
			this.playerBlack.disconnect();
			GameMaster.currentPlayerCount--;
		}
		this.closed = true;
	}

	this.print = function(){
		console.log(`Id: ${this.id}`);
		console.log(`White: ${this.playerWhite?'connected':'not connected'}`);
		console.log(`Black: ${this.playerBlack?'connected':'not connected'}`);
	}
}

server.listen(3080);

// If process receives SIGTERM, close the server
process.on('SIGTERM', () => {
	console.log('SIGTERM signal received: closing HTTP server')
	server.close(() => {
		console.log('HTTP server closed')
	})
	GameMaster.clearGames();
})

// If process receives SIGUSR2, close the server
process.on('SIGUSR2', () => {
	console.log('SIGUSR2 signal received: closing HTTP server')
	server.close(() => {
		console.log('HTTP server closed')
	})
	GameMaster.clearGames();
})