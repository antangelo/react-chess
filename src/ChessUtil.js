function defaultMoveCallback(squares, start, target) {
	let rank = target[0];
	let file = target[1];

	squares[rank][file].piece = squares[start[0]][start[1]].piece;
	squares[start[0]][start[1]].piece = null;
	squares[rank][file].piece.hasMoved = true;

	return squares;
};

function validPawnMove(piece, targetPiece, startPos, endPos, clearPath) {
	var pawnPromotionCallback = (squares, start, target) => {
		squares[start[0]][start[1]].piece.kind = 'Q';
		return defaultMoveCallback(squares, start, target);
	};

	var direction = piece.white ? 1 : -1;
	var moveN = spaces => endPos[0] - startPos[0] ===
		spaces * direction && 
		endPos[1] === startPos[1] && !targetPiece && clearPath;
	var capture = targetPiece &&
		Math.abs(endPos[1] - startPos[1]) === 1 &&
			endPos[0] - startPos[0] === direction;
	var reachedLastRank = piece.white ? 
		endPos[0] === 7 : endPos[0] === 0;
	return {
		canMove: moveN(1) || capture || 
		(!piece.hasMoved && moveN(2)),
		moveCallback: reachedLastRank ? 
		pawnPromotionCallback : defaultMoveCallback
	};
}

function validKingMove(piece, targetPiece, startPos, endPos, clearPath) {
	var castleCallback = (squares, start, target) => {
		let rookRank = target[0];
		let rookFile = target[1];
		let kingRank = start[0];
		let kingFile = start[1];

		let direction = Math.sign(rookFile - kingFile);
		let kingDest = kingFile + 2 * direction;

		squares[rookRank][rookFile].piece.hasMoved = true;
		squares[kingRank][kingFile].piece.hasMoved = true;

		squares[kingRank][kingDest].piece = squares[kingRank][kingFile].piece;
		squares[kingRank][kingDest - direction].piece = squares[rookRank][rookFile].piece;

		squares[rookRank][rookFile].piece = null;
		squares[kingRank][kingFile].piece = null;

		return squares;
	};

	var normal = Math.abs(startPos[0] - endPos[0]) <= 1 &&
		Math.abs(startPos[1] - endPos[1]) <= 1;
	var castle = targetPiece &&
		targetPiece.kind === 'R' && 
		targetPiece.white === piece.white &&
		!targetPiece.hasMoved &&
		!piece.hasMoved;
	return {
		canMove: clearPath && (normal || castle),
		moveCallback: castle ? castleCallback : 
		defaultMoveCallback
	};
}

function rookCanMove(startPos, endPos) {
	return startPos[0] === endPos[0] || startPos[1] === endPos[1];
}

function bishopCanMove(startPos, endPos) {
	return Math.abs(startPos[0] - endPos[0]) ===
		Math.abs(startPos[1] - endPos[1]);
}

function knightCanMove(startPos, endPos) {
	return (Math.abs(endPos[1] - startPos[1]) === 2 && 
		Math.abs(endPos[0] - startPos[0]) === 1) ||
		(Math.abs(endPos[0] - startPos[0]) === 2 &&
		Math.abs(endPos[1] - startPos[1]) === 1);
}

function movePathIsClear(piece, startPos, endPos) {
	var rankDirection = Math.sign(endPos[0] - startPos[0]);
	var fileDirection = Math.sign(endPos[1] - startPos[1]);

	if(piece && piece.kind === 'N') return [];

	var pieceCanMove = (piece, start, end) => { 
		switch(piece.kind) {
			case 'R': return rookCanMove(start, end);
			case 'B': return bishopCanMove(start, end);
			case 'Q': return rookCanMove(start, end) || bishopCanMove(start, end);
			case 'K': return validKingMove(piece, null, start, end, true).canMove;
			case 'N': return knightCanMove(start, end);
			case 'p': return validPawnMove(piece, null, start, end, true).canMove;
			default: return true;
	}};

	var validMoveSquares = [];
	var x = startPos[0] + rankDirection;
	var y = startPos[1] + fileDirection;

	while(x >= 0 && y >= 0 && x < 8 && y < 8 && 
		(x !== endPos[0] || y !== endPos[1])) {
		if(pieceCanMove(piece?.kind, startPos, [x, y]))
			validMoveSquares.push([x, y]);
		x += rankDirection;
		y += fileDirection;
	}

	return validMoveSquares;
}

function enumerateValidMoves(squares, startPos) {
	var pieceInfo = {
		'R': {
			vector: [[1,0], [-1,0], [0,1], [0,-1]],
			limit: 7
		},
		'B': {
			vector:[[1,1], [-1,1], [1,-1], [-1,-1]],
			limit: 7
		},
		'N': {
			vector: [[1,2],[2,1],[-1,2],[-2,1],[-1,-2],[-2,-1],[1,-2], [2,-1]],
			limit: 1
		},
		'Q': {vector: [], limit: 7},
		'K': {vector: [], limit: 1},
		'p': {vector: [[1,0], [2,0], [1,1],[1,-1]], limit: 1}
	}

	pieceInfo.Q.vector = pieceInfo.R.vector.concat(pieceInfo.B.vector);
	pieceInfo.K.vector = pieceInfo.Q.vector;

	var validMoves = [];
	var piece = squares[startPos[0]][startPos[1]].piece;
	var index = 1;
	var pieceVector = pieceInfo[piece.kind].vector.slice();

	while(index <= pieceInfo[piece.kind].limit) {
		const indexRef = index;
		let candidates = pieceVector
			.map(v => [
				v[0] * indexRef + startPos[0],
				v[1] * indexRef + startPos[1]
			])
			.filter(c => c[0] >= 0 && c[0] < 8 && c[1] >= 0 && c[1] < 8)
			.filter(endPos => validMove(squares, piece, startPos, endPos).canMove);
;

		candidates.forEach(item => validMoves.push(item));		

		pieceVector = pieceVector.filter(coord => {
			let x = squares[coord[0] * indexRef + startPos[0]];
			let y = coord[1] * indexRef + startPos[1];
			return x && x[y] && !x[y].piece;
		});

		index += 1;
	}

	return validMoves;
}

function validMove(squares, piece, startPos, endPos) {
	if(startPos[0] === endPos[0] && startPos[1] === endPos[1])
		return {canMove: false};

	let targetPiece = squares[endPos[0]][endPos[1]]?.piece;

	if(targetPiece && piece.white === targetPiece.white
	&& !(piece.kind === 'K' && targetPiece.kind === 'R')) 
		return {canMove: false};

	let clearPath = piece.kind !== 'N' && 
		movePathIsClear(piece, startPos, endPos)
		.every(i => squares[i[0]][i[1]].piece === null);

	switch(piece.kind) {
		case 'R':
			return {
				canMove: clearPath && rookCanMove(startPos, endPos),
				moveCallback: defaultMoveCallback
			};
		case 'B':
			return {
				canMove: clearPath && bishopCanMove(startPos, endPos),
				moveCallback: defaultMoveCallback
			};
		case 'Q':
			return {
				canMove: clearPath && (bishopCanMove(startPos, endPos) || 
				rookCanMove(startPos, endPos)),
				moveCallback: defaultMoveCallback
			};
		case 'K':
			return validKingMove(piece, targetPiece, startPos, endPos, clearPath);
		case 'N':
			return {
				canMove: knightCanMove(startPos, endPos),
				moveCallback: defaultMoveCallback
			};
		case 'p':
			return validPawnMove(piece, targetPiece, startPos, endPos, clearPath);
		default:
			return {canMove: false};
	}
}

const chessUtil = {validMove: validMove, enumerateValidMoves: enumerateValidMoves};
export default chessUtil;

