import React from 'react';
import './ChessBoard.css';
import chessUtil from './ChessUtil.js';

class Square extends React.Component {
	render() {
		let pieceKind = this.props.piece?.kind;
		pieceKind = pieceKind ? pieceKind : "";
		return (
			<button className={(this.props.lightSquare ? 
					'lightSquare' : 'darkSquare') + ' square'}
				onClick={this.props.onClick}>
			<div className={"square " + 
				(this.props.piece?.white ? "whitePiece" : "")}>
				{this.props.highlighted ? (pieceKind + '*') : pieceKind}
			</div>
			</button>
		);
	}
};

class ChessBoard extends React.Component {	
	constructor(props) {
		super(props);

		var defaultBoard = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

		var createFile = (rank, file) => {
			var getPiece = () => {
				if(rank > 1 && rank < 6) return null;
				else if(rank === 1 || rank === 6) 
					return {
						kind: 'p',
						white: (rank === 1),
						hasMoved: false
					};
				else if(rank === 0 || rank === 7)
					return {
						kind: defaultBoard[file],
						white: (rank === 0),
						hasMoved: false
					};
			};

			return {
			rank: rank,
			file: file,
			piece: getPiece(rank, file),
			highlighted: false
		}};

		var createRank = (rank) => {
			return [...Array(8).keys()].map(file => createFile(rank, file));
		};

		this.state = {
			squares: [...Array(8).keys()].map(createRank),
			activePiece: null,
			whiteToMove: true
		};
	}
	
	handleClick(rank, file) {
		var activePiece = this.state.activePiece;
		const whiteToMove = this.state.whiteToMove;
		const squares = this.state.squares.slice();

		if(!activePiece && squares[rank][file].piece && 
			squares[rank][file].piece.white === whiteToMove) {
			let x = chessUtil.enumerateValidMoves(squares, [rank, file]);
			for(let coord of x) {
				squares[coord[0]][coord[1]].highlighted = true;
			}
			squares[rank][file].highlighted = true;

			this.setState({squares: squares, activePiece: [rank, file], whiteToMove: whiteToMove});
		}
		else if(activePiece && rank === activePiece[0] && file === activePiece[1]) {
			let x = chessUtil.enumerateValidMoves(squares, [rank, file]);
			for(let coord of x) {
				squares[coord[0]][coord[1]].highlighted = false;
			}
			squares[rank][file].highlighted = false;

			this.setState({squares: squares, activePiece: null, whiteToMove: whiteToMove});
		}
		else if(activePiece) {
			let piece = squares[activePiece[0]][activePiece[1]].piece;
			let pieceCanMove = chessUtil.validMove(
				squares,
				piece,
				activePiece, [rank, file]
			);
			
			if((piece.white === this.state.whiteToMove) && pieceCanMove.canMove) 
			{
				let x = chessUtil.enumerateValidMoves(squares, activePiece);
				for(let coord of x) {
					squares[coord[0]][coord[1]].highlighted = false;
				}
				squares[activePiece[0]][activePiece[1]].highlighted = false;
			
				let newSquares = pieceCanMove.moveCallback(
					squares, activePiece, [rank, file]);

				this.setState({squares: newSquares, activePiece: null, whiteToMove: !whiteToMove});
			}
		}	
	}

	renderRank(rank) {
		return (
			<div className='row'>
			{rank.map(file => <Square
				onClick={() => this.handleClick(file.rank, file.file)}
				highlighted={file.highlighted}
				piece={file.piece} 
				lightSquare={(file.rank + file.file) % 2 !== 0}
				/>)}
			</div>
		);
	}

	render() {
		return (
			<div>
			{this.state.squares.reverse().map(rank => this.renderRank(rank))}
			</div>
		);
	}
};

export default ChessBoard;
