function onDrop (source, target, piece, newPos, oldPos, orientation) {
	console.log('Source: ' + source)
	console.log('Target: ' + target)
	console.log('Piece: ' + piece)
	console.log('New position: ' + Chessboard.objToFen(newPos))
	console.log('Old position: ' + Chessboard.objToFen(oldPos))
	console.log('Orientation: ' + orientation)
	console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
	prevFen = Chessboard.objToFen(oldPos);
	gameSocket.emit('make-move', `${source}-${target}`, Chessboard.objToFen(newPos));
}

let board = null;
let visualBoard = document.getElementById("myBoard");
let prevFen = null;

let gameSocket = io();

gameSocket.on('start-game', color => {
	console.log(`Received start-game with color: ${color}`);
	document.getElementById("starter-message").style.display = "none";
	let config = {
		pieceTheme: 'img/chesspieces/{piece}.png',
		draggable: true,
		dropOffBoard: 'snapback',
		onDrop: onDrop,
		position: 'start',
		orientation: color
	}
	// if(window.innerWidth <= window.innerHeight) {
	// 	console.log("changing width");
	// 	visualBoard.style.height = 'auto';
	// 	visualBoard.style.width = window.innerWidth;
	// }
	// else {
	// 	console.log("changing height");
	// 	visualBoard.style.width = 'auto';
	// 	visualBoard.style.height = window.innerHeight;
	// }
	board = Chessboard('myBoard', config);
});

gameSocket.on('move-made', (move) => {
	board.move(move);
});

gameSocket.on('false-move', (fen) => {
	console.log("A false move has been made");
	board.position(prevFen);
});

gameSocket.on('disconnect', () => {
	gameSocket.disconnect();
	document.getElementById("myBoard").style.display = "none";
	document.getElementById("disconnect-message").style.display = "block";
});

gameSocket.emit('get-game', 1);

// window.onresize = () =>{
// 	console.log(`Width: ${window.innerWidth}\tHeight: ${window.innerHeight}`);
// 	if(window.innerWidth <= window.innerHeight) {
// 		console.log("changing width");
// 		visualBoard.style.height = 'auto';
// 		visualBoard.style.width = window.innerWidth;
// 	}
// 	else {
// 		console.log("changing height");
// 		visualBoard.style.width = 'auto';
// 		visualBoard.style.height = window.innerHeight;
// 	}
// }