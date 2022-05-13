function onDrop (source, target, piece, newPos, oldPos, orientation) {
	console.log('Source: ' + source)
	console.log('Target: ' + target)
	console.log('Piece: ' + piece)
	console.log('New position: ' + Chessboard.objToFen(newPos))
	console.log('Old position: ' + Chessboard.objToFen(oldPos))
	console.log('Orientation: ' + orientation)
	console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
	gameSocket.emit('make-move', `${source}-${target}`);
}

var board = null;

var gameSocket = io();

gameSocket.on('start-game', color => {
	console.log(`Received start-game with color: ${color}`);
	document.getElementById("starter-message").style.display = "none";
	var config = {
		pieceTheme: 'img/chesspieces/{piece}.png',
		draggable: true,
		dropOffBoard: 'snapback',
		onDrop: onDrop,
		position: 'start',
		orientation: color
	}
	board = Chessboard('myBoard', config);
});

gameSocket.on('move-made', (move) => {
	board.move(move);
});

gameSocket.on('disconnect', () => {
	document.getElementById("myBoard").style.display = "none";
	document.getElementById("disconnect-message").style.display = "block";
})

gameSocket.emit('get-game', 1);