"use strict";

/*global structures utilities pieces Board board:true reloadHistory front*/
/*basé sur le tutoriel : https://medium.freecodecamp.com/simple-chess-ai-step-by-step-1d55a9266977*/

/**
 * reverseArray - Renverse un tableau
 *
 * @param {Array} array Tableau à inverser
 *
 * @returns {Array} Nouveau tableau inversé
 */
var reverseArray = function(array) {
	return array.slice().reverse();
};
/**
 * Instance de l'intelligence artificielle
 */
var ai = undefined;
if(typeof document !== 'undefined')
{
	if(typeof document.addEventListener !== 'undefined')
	{
		document.addEventListener("DOMContentLoaded", function(){
			let button = document.getElementById("newai");
			let selcolor = document.getElementById("colorselect");
			let seldiff = document.getElementById("difficultyselect");
			if(button)
			{
				button.addEventListener("click", function(){ //Le bouton nouvelle partie crée une nouvelle IA et remet à 0 le plateau
					let diff = (seldiff) ? seldiff.value : 3;
					let color = (selcolor) ? selcolor.value : "black";
					ai = new AI(diff);
					ai.color = color;
					board = new Board(board);
					reloadHistory(board);
					front.showTable(board);
					if(ai.color === board.turnColor)
					{
						ai.nextMoveAsync(board);
					}
				});
				button.click(); //Au chargement de la page, on déclenche la création de l'IA
			}
		});
	}
}

/**
 * Valeur des pieces blanches pour l'évaluation du plateau
 * @constant
 */
const WHITEPIECEVALUE = Object.freeze({
	PAWN : Object.freeze({
		val : 10,
		pval : [
			[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
			[1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],
			[0.5, 0.5, 1.0, 2.5, 2.5, 1.0, 0.5, 0.5],
			[0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
			[0.5,-0.5,-1.0, 0.0, 0.0,-1.0,-0.5, 0.5],
			[0.5, 1.0, 1.0,-2.0,-2.0, 1.0, 1.0, 0.5],
			[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
		]
	}),
	KNIGHT : Object.freeze({
		val : 30,
		pval : [
			[-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
			[-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
			[-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
			[-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
			[-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
			[-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
			[-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
			[-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
		]
	}),
	BISHOP : Object.freeze({
		val : 30,
		pval : [
			[ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
			[ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
			[ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
			[ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
			[ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
			[ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
			[ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
			[ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
		]
	}),
	ROOK : Object.freeze({
		val : 50,
		pval : [
			[  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
			[  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
			[ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
			[ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
			[ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
			[ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
			[ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
			[  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
		]
	}),
	QUEEN : Object.freeze({
		val : 90,
		pval : [
			[ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
			[ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
			[ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
			[ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
			[  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
			[ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
			[ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
			[ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
		]
	}),
	KING : Object.freeze({
		val:900,
		pval : [
			[ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
			[ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
			[ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
			[ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
			[ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
			[ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
			[  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
			[  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
		]
	})
});
/**
 * Valeur des pieces blanches pour l'évaluation du plateau
 * @constant
 */
const BLACKPIECEVALUE = Object.freeze({
	PAWN : Object.freeze({
		val : WHITEPIECEVALUE.PAWN.val,
		pval : reverseArray(WHITEPIECEVALUE.PAWN.pval)
	}),
	KNIGHT : Object.freeze({
		val : WHITEPIECEVALUE.KNIGHT.val,
		pval : WHITEPIECEVALUE.KNIGHT.pval
	}),
	BISHOP : Object.freeze({
		val : WHITEPIECEVALUE.BISHOP.val,
		pval : reverseArray(WHITEPIECEVALUE.BISHOP.pval)
	}),
	ROOK : Object.freeze({
		val : WHITEPIECEVALUE.ROOK.val,
		pval : reverseArray(WHITEPIECEVALUE.ROOK.pval)
	}),
	QUEEN : Object.freeze({
		val : WHITEPIECEVALUE.QUEEN.val,
		pval : WHITEPIECEVALUE.QUEEN.pval
	}),
	KING : Object.freeze({
		val : WHITEPIECEVALUE.KING.val,
		pval : reverseArray(WHITEPIECEVALUE.KING.pval)
	}),
});

/** Classe de l'IA*/
class AI
{

 /**
  * Crée une nouvelle instance de l'IA
  *
  * @param {number} [difficulty=2] Difficulté : 0 aléatoire, 1 Recherche simple à 1 niveau, 2+ Minimax à <difficulty> niveaux
  */
	constructor(difficulty=2)
	{
		/**Difficulté */
		this.difficulty = difficulty;
		/**Nombre de mouvements étudiés*/
		this.calc = 0;
	}

 /**
  * getGeneratedMoves - Récupère la liste des mouvements disponibles
  *
  * @param {Board} board Plateau actuel
  *
  * @returns {Array<Object>} Liste des coups possibles
  */
	getGeneratedMoves(board)
	{
		if(board && board.pieceList)
		{
			var moves = [];
			board.pieceList.forEach(function(val){
				if(val.onBoard && val.color === board.turnColor)
				{
					if(!val.legalMovesCalculated)
					{
						val.calculateLegalMoves(board);
					}
					val.legalMoves.forEach(function(pos){
						if(val.constructor.name === 'Pawn' && pos.y === ((val.color === structures.PieceColor.white) ? 7 : 0)) //Si le mouvement est une promotion, on propose toutes les promotions
						{
							moves.push({from : val.pos, to: pos, promote : 'Q'});
							moves.push({from : val.pos, to: pos, promote : 'N'});
							moves.push({from : val.pos, to: pos, promote : 'R'});
							moves.push({from : val.pos, to: pos, promote : 'B'});
						}else
						{
							moves.push({from : val.pos, to: pos, promote : ''});
						}

					});
				}
			});
			return moves;
		}
		return undefined;
	}

 /**
  * calculateBestMove - Calcul le meilleur coup à jouer
  * @param {Board} board Plateau actuel
  *
  * @returns {Object} Meilleur coup
  */
	calculateBestMove(board)
	{
		var moves = this.getGeneratedMoves(board);
		var move = undefined;
		// Processing...
		if(this.difficulty < 1)
		{
			//Aléatoire
			move =  moves[Math.floor(Math.random()*moves.length)];
		}else if(this.difficulty == 1)
		{
			//Recherche simple
			let bestMoves = [];
			let bestMoveStrength = -9999;
			for(var i=0; i < moves.length; ++i) //On prend le mouvement qui a la meilleure valeur
			{
				let value = this.valueMove(moves[i], board);
				if(value > bestMoveStrength)
				{
					bestMoves.length = 0;
					bestMoves.push(moves[i]);
					bestMoveStrength = value;
				}else if (value == bestMoveStrength)
				{
					bestMoves.push(moves[i]);
				}
			}
			move = bestMoves[Math.floor(Math.random()*bestMoves.length)];
		}else
		{
			//Recherche minimax avec profondeur
			move = this.minimaxRoot(this.difficulty, board, true);
		}
		// End Processing
		return move;
	}

 /**
  * minimaxRoot - Racine de l'algorithme minimax
  * @param {number} depth Profondeur de l'algorithme
  * @param {Board} board Plateau actuel
  * @param {bool} isMax Le coup doit il etre maximisé ?
  *
  * @returns {Object} Meilleur coup
  */
	minimaxRoot(depth, board, isMax)
	{
		let moves = this.getGeneratedMoves(board);
		let bestValue = -99999;
		let bestMoves = [];
		if(moves)
		{
			for(var i=0; i<moves.length; ++i) //On prend le mouvement qui a le plus grand score
			{
				let bufferBoard = board.toBufferBoard();
				this.executeMove(moves[i], bufferBoard);
				let value = this.minimax(depth-1, bufferBoard,-100000, 100000, !isMax);
				if(value > bestValue)
				{
					bestMoves.length = 0;
					bestMoves.push(moves[i]);
					bestValue = value;
				}else if(value == bestValue)
				{
					bestMoves.push(moves[i]);
				}
			}
			return bestMoves[Math.floor(Math.random()*bestMoves.length)];
		}
	}

 /**
  * minimax - Algorithme minimax
  * @param {number} depth Profondeur
  * @param {Board} board Plateau actuel
  * @param {number} alpha Borne alpha
  * @param {number} beta  Borne beta
  * @param {bool} isMax Le coup doit il etre maximisé ?
  *
  * @returns {number} Valeur du meilleur coup pour ce tour
  */
	minimax(depth, board, alpha,beta, isMax)
	{
		this.calc++;


		let moves = this.getGeneratedMoves(board);

		if(isMax)
		{
			if(depth === 0)
			{
				return this.calculateValue(board, board.turnColor);
			}
			let bestValue = -99999;
			for (let i = 0; i < moves.length; i++) {

				let bufferBoard = board.toBufferBoard();
				this.executeMove(moves[i], board);
				//let nextDepth = -this.minimax(depth-1, bufferBoard,-beta, -alpha);
				let nextDepth = this.minimax(depth-1, bufferBoard,alpha, beta, !isMax);

				if(nextDepth > bestValue)
				{
					bestValue = nextDepth;
				}
				if(alpha < bestValue)
				{
					alpha = bestValue;
				}
				if(alpha >= beta)
				{
					return bestValue;
				}
			}
			return bestValue;
		}
		else
		{
			if(depth === 0)
			{
				return -this.calculateValue(board, board.turnColor);
			}
			let bestValue = 99999;
			for (let i = 0; i < moves.length; i++) {

				let bufferBoard = board.toBufferBoard();
				this.executeMove(moves[i], board);
				let nextDepth = -this.minimax(depth-1, bufferBoard,alpha, beta, !isMax);
				if(nextDepth < bestValue)
				{
					bestValue = nextDepth;
				}
				if(beta > bestValue)
				{
					beta = bestValue;
				}
				if(alpha >= beta)
				{
					return bestValue;
				}
			}
			return bestValue;
		}

	}

 /**
  * nextMove - Calcule (et execute si synchrone) le prochain mouvement
  * @param {Board}    board          Plateau actuel
  * @param {boolean} [isAsync=false] Est synchrone
  *
  * @returns {Object} Prochain mouvement
  */
	nextMove(board, isAsync=false)
	{
		if(board)
		{
			var nextMove = this.calculateBestMove(board);
			if(!isAsync){
				this.executeMove(nextMove, board);
			}
			return nextMove;
		}
	}

 /**
  * nextMoveAsync - Calcule et execute le prochain mouvement de manière asynchrone
  *
  * @param {Board} board Plateau actuel
  */
	nextMoveAsync(board)
	{
		if(board)
		{


			this.calc = 0;
			var popup = utilities.generatePopup("yellow", "L'ordinateur réfléchit...", -1, false);
			var that = this;
			setTimeout(function(){
				var t0 = performance.now();
				that.executeMove(that.nextMove(board, true), board);
				var t1 = performance.now();
				console.log("Mouvements analysés : " + that.calc);
				console.log("Temps : " + (t1-t0) + " millisecondes");
				console.log("Op/s : " + that.calc/((t1-t0)/1000) );
				popup.remove();
			}, 10);
		}
	}

 /**
  * executeMove - Execute un mouvement sur un plateau
  * @param {Object} move  Mouvement
  * @param {Board} board Plateau
  */
	executeMove(move, board)
	{
		if(move && move.from && move.to && board.move(move.from, move.to))
		{
			if(board.needPromotion && move.promote !== '')
			{
				switch(move.promote)
				{
					case 'Q':
						utilities.proceedPromote(pieces.Queen, board);
						break;
					case 'N':
						utilities.proceedPromote(pieces.Knight, board);
						break;
					case 'R':
						utilities.proceedPromote(pieces.Rook, board);
						break;
					case 'B':
						utilities.proceedPromote(pieces.Bishop, board);
				}
			}
		}
	}

 /**
  * valueMove - Détermine la valeur d'un mouvement de manière simple
  * @param {Object} move  Mouvement
  * @param {Board} board Plateau
  *
  * @returns {number} Valeur du mouvement
  */
	valueMove(move, board)
	{
		if(move && board && move.from && move.to && board.toBufferBoard)
		{
			let bufferBoard = board.toBufferBoard();
			if(bufferBoard && bufferBoard.isBuffer)
			{
				let currentColor = bufferBoard.turnColor;
				this.executeMove(move, bufferBoard);
				return this.calculateValue(bufferBoard, currentColor);
			}
		}
		return -99999;
	}

 /**
  * calculateValue - Calcule la valeur d'un plateau pour une couleur particulière
  * @param {Board} board Plateau
  * @param {string} color Couleur
  *
  * @returns {number} Valeur du plateau
  */
	calculateValue(board, color)
	{
		if(color && board && board.pieceList)
		{
			let value = 0;
			board.pieceList.forEach(function(val){
				if(val.onBoard)
				{
					let colorValue = undefined;
					let type = undefined;
					if(val.color === structures.PieceColor.white)
					{
						colorValue = WHITEPIECEVALUE;
					}else
					{
						colorValue = BLACKPIECEVALUE;
					}
					type = val.constructor.name.toUpperCase();
					//console.log(colorValue[type]);
					if(colorValue[type])
					{
						if(val.color === color)
						{
							value = value + colorValue[type].val + colorValue[type].pval[7-val.pos.y][val.pos.x]; //Rotation de 90° pour avoir la position dans le tableau de valeur
						}else
						{
							value = value - colorValue[type].val - colorValue[type].pval[7-val.pos.y][val.pos.x];
						}
					}
				}
			});
			return value;
		}
	}
}
