"use strict";

if(typeof require !== 'undefined')
{
	var structures = require('./structures.js');
	var utilities = require('./utilities.js');
}


/** Structure contenant les logiques des pièces et leur constructeur*/
var pieces = {

	Pawn :
	/** Classe pour les pions
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class Pawn extends structures.Piece
	{

  /**
   * Pawn - Crée un pion
   *
   * @param {string} color Couleur
   * @param {(string|{x:number,y:number})} pos   Position
	 * @memberof pieces.Pawn
   */
		constructor(color, pos)
		{
			super(color, pos);
			this.lastMoveIsDouble = false;
		}

  /**
   * toShortString - Donne la représentation officielle de la pièce
   * @memberof pieces.Pawn
	 * @instance
   * @returns {string} Représentation de la pièce
   */
		toShortString()
		{
			return "P";
		}

  /**
   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
   * @memberof pieces.Pawn
	 * @instance
   *
   * @param {Board} boardInstance Plateau
   *
   */
		calculateLegalMoves(boardInstance)
		{
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testPos2, testTile, testTile2;

			//une case en avant
			var targetPosY = this.pos.y + ((this.color == structures.PieceColor.white)? (1) : (-1));
			testPos = {"x": this.pos.x, "y": targetPosY};
			testTile = boardInstance.getTile(testPos);
			if (testTile && !testTile.isOccupied()) this.legalMoves.push(testPos);

			// une case en diagonale-avant si la pièce qui occupe cette case est de l'autre couleur
			testPos = {"x": this.pos.x+1, "y": targetPosY };
			testTile = boardInstance.getTile(testPos);
			if(testTile)
			{
				if (testTile.isOccupied())
				{
					if(testTile.getPiece().getColor() != this.color)
						this.legalMoves.push(testPos);
				}else
				{
					testPos2 = {"x": this.pos.x+1, "y":this.pos.y};
					testTile = boardInstance.getTile(testPos2);
					if(testTile && testTile.isOccupied() && testTile.piece.constructor == this.constructor && testTile.piece.lastMoveIsDouble) //Prise en passant ?
					{
						this.enPassantCapturePos.push(testPos2);
						this.legalMoves.push(testPos);
					}
				}
			}

			testPos = {"x": this.pos.x-1, "y": targetPosY };
			testTile = boardInstance.getTile(testPos);
			if(testTile)
			{
				if (testTile.isOccupied())
				{
					if(testTile.getPiece().getColor() != this.color)
						this.legalMoves.push(testPos);
				}else
				{
					testPos2 = {"x": this.pos.x-1, "y":this.pos.y};
					testTile = boardInstance.getTile(testPos2);
					if(testTile && testTile.isOccupied() && testTile.piece.constructor == this.constructor && testTile.piece.lastMoveIsDouble) //Prise en passant ?
					{
						this.enPassantCapturePos.push(testPos2);
						this.legalMoves.push(testPos);
					}
				}
			}

			// Si le pion n'as pas bougé, et les deux cases en avant sont libres, il peut sauter deux cases en avant
			var targetPosY2 = this.pos.y + ((this.color == structures.PieceColor.white)? 2 : (-2));
			if (this.hasNeverMoved) {
				testPos = {"x": this.pos.x, "y": targetPosY};
				testPos2 = {"x": this.pos.x, "y": targetPosY2};
				testTile = boardInstance.getTile(testPos);
				testTile2 = boardInstance.getTile(testPos2);
				if (testTile && testTile2 && !testTile.isOccupied() && !testTile2.isOccupied())
					this.legalMoves.push(testPos2);
			}


			this.decimateLegalMovesCheck(boardInstance);
			this.legalMovesCalculated = true;
		}


  /**
   * promote - Promeut ce pion
   *
   * @param {pieces.Queen|pieces.Rook|pieces.Bishop|pieces.Knight} cons  Constructeur de la classe en laquelle le pion doit être promu
   * @param {Board} board Plateau
   *
   * @returns {bool} true si tout s'est bien passé
   */
		promote(cons, board)
		{
			if(this.pos.y === ((this.color === structures.PieceColor.white) ? 7 : 0))
			{
				var promTile = board.getTile(this.pos);
				if(promTile && promTile.isOccupied())
				{
					var newPiece = new cons(this.color, this.pos);
					promTile.piece = newPiece;
					var index = board.pieceList.indexOf(this);
					if(index !== -1)
					{
						board.pieceList[index] = newPiece;
						board.partialMoveRecord.promoteRec = newPiece.toShortString();
						board.afterPromote();
						return true;
					}
				}
			}
			return false;
		}
	},

	Rook :
	/** Classe pour les tours
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class Rook extends structures.Piece {
		/**
		 * toShortString - Donne la représentation officielle de la pièce
		 * @memberof pieces.Rook
		 * @instance
		 * @returns {string} Représentation de la pièce
		 */
		toShortString()
		{
			return "R";
		}
		/**
	   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
	   * @memberof pieces.Rook
		 * @instance
	   *
	   * @param {Board} boardInstance Plateau
	   *
	   */
		calculateLegalMoves(boardInstance) {
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testTile;

			var initPositions = [[0, -1], [0, 1], [1, 0], [-1, 0]];
			for (var j = 0; j < 4; j++) {
				testPos = utilities.toCoord({"x": this.pos.x + initPositions[j][0], "y": this.pos.y + initPositions[j][1]});
				for (var i = 0; testPos != undefined && i<7; i++) {
					testTile = boardInstance.getTile(testPos);
					if (!testTile.isOccupied()) {
						this.legalMoves.push(testPos);
						var modifierX=0, modifierY=0;
						switch(j) {
							case 0: modifierY=-1; break;
							case 1: modifierY=1; break;
							case 2: modifierX=1; break;
							case 3: modifierX=-1; break;
						}
						testPos = utilities.toCoord({"x": testPos.x + modifierX, "y": testPos.y + modifierY});
					}
					else {
						//si la pièce occupante est de couleur inverse, ajout de la position en legalMoves
						if (testTile.getPiece().getColor() != this.color) {
							this.legalMoves.push(testPos);
						}
						//sinon, ne rien faire
						//sortir de la boucle
						break;
					}
				}
			}
			this.decimateLegalMovesCheck(boardInstance);
			this.legalMovesCalculated = true;
		}
	},

	Bishop :
	/** Classe pour les fous
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class Bishop extends structures.Piece {
		/**
		 * toShortString - Donne la représentation officielle de la pièce
		 * @memberof pieces.Bishop
		 * @instance
		 * @returns {string} Représentation de la pièce
		 */
		toShortString()
		{
			return "B";
		}
		/**
	   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
	   * @memberof pieces.Bishop
		 * @instance
	   *
	   * @param {Board} boardInstance Plateau
	   *
	   */
		calculateLegalMoves(boardInstance) {
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testTile;
			var initPositions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
			for (var j = 0; j < 4; j++) {
				testPos = utilities.toCoord({"x": this.pos.x + initPositions[j][0], "y": this.pos.y + initPositions[j][1]});
				for (var i = 0; testPos != undefined && i<7; i++) {
					testTile = boardInstance.getTile(testPos);
					if (testTile && !testTile.isOccupied()) {
						this.legalMoves.push(testPos);
						var modifierX=0, modifierY=0;
						switch(j) {
							case 0: modifierX=1; modifierY=1; break;
							case 1: modifierX=1; modifierY=-1; break;
							case 2: modifierX=-1; modifierY=1; break;
							case 3: modifierX=-1; modifierY=-1; break;
						}
						testPos = utilities.toCoord({"x": testPos.x + modifierX, "y": testPos.y + modifierY});
					}
					else {
						//si la pièce occupante est de couleur inverse, ajout de la position en legalMoves
						if (testTile && testTile.getPiece().getColor() != this.color) {
							this.legalMoves.push(testPos);
						}
						//sinon, ne rien faire
						//sortir de la boucle
						break;
					}
				}
			}
			this.decimateLegalMovesCheck(boardInstance);
			this.legalMovesCalculated = true;
		}
	},

	Knight :
	/** Classe pour les cavaliers
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class Knight extends structures.Piece {
		/**
		 * toShortString - Donne la représentation officielle de la pièce
		 * @memberof pieces.Knight
		 * @instance
		 * @returns {string} Représentation de la pièce
		 */
		toShortString()
		{
			return "N";
		}
		/**
	   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
	   * @memberof pieces.Knight
		 * @instance
	   *
	   * @param {Board} boardInstance Plateau
	   *
	   */
		calculateLegalMoves(boardInstance) {
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testTile;
			var initPositions = [[1, 2], [1, -2], [2, 1], [2, -1], [-1, 2], [-1, -2], [-2, 1], [-2, -1]];
			for (var i = 0; i < initPositions.length; i++) {
				testPos = utilities.toCoord({"x": this.pos.x + initPositions[i][0], "y": this.pos.y + initPositions[i][1]});
				testTile = boardInstance.getTile(testPos);
				if (testTile && !testTile.isOccupied()) { //la case est sur la table et inoccupée
					this.legalMoves.push(testPos);
				}
				else if (testTile && testTile.getPiece().getColor() != this.color) {
					this.legalMoves.push(testPos);
				}

			}
			this.decimateLegalMovesCheck(boardInstance);
			this.legalMovesCalculated = true;
		}
	},

	Queen :
	/** Classe pour les reines
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class Queen extends structures.Piece {
		/**
		 * toShortString - Donne la représentation officielle de la pièce
		 * @memberof pieces.Queen
		 * @instance
		 * @returns {string} Représentation de la pièce
		 */
		toShortString()
		{
			return "Q";
		}
		/**
	   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
	   * @memberof pieces.Queen
		 * @instance
	   *
	   * @param {Board} boardInstance Plateau
	   *
	   */
		calculateLegalMoves(boardInstance) {
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testTile;

			var initPositions = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
			for (var j = 0; j < 8; j++) {
				testPos = utilities.toCoord({"x": this.pos.x + initPositions[j][0], "y": this.pos.y + initPositions[j][1]});
				for (var i = 0; testPos != undefined && i<7; i++) {
					testTile = boardInstance.getTile(testPos);
					if (!testTile.isOccupied()) {
						this.legalMoves.push(testPos);
						var modifierX=0, modifierY=0;
						switch(j) {
							case 0: modifierY=-1; break;
							case 1: modifierY=1; break;
							case 2: modifierX=1; break;
							case 3: modifierX=-1; break;
							case 4: modifierX=1; modifierY=1; break;
							case 5: modifierX=1; modifierY=-1; break;
							case 6: modifierX=-1; modifierY=1; break;
							case 7: modifierX=-1; modifierY=-1; break;
						}
						testPos = utilities.toCoord({"x": testPos.x + modifierX, "y": testPos.y + modifierY});
					}
					else {
						//si la pièce occupante est de couleur inverse, ajout de la position en legalMoves
						if (testTile.getPiece().getColor() != this.color) {
							this.legalMoves.push(testPos);
						}
						//sinon, ne rien faire
						//sortir de la boucle
						break;
					}
				}
			}
			this.decimateLegalMovesCheck(boardInstance);
			this.legalMovesCalculated = true;
		}
	},

	King :
	/** Classe pour les rois
	 * @extends structures.Piece
	 * @memberof pieces
	 * */
	class King extends structures.Piece {
		/**
		 * toShortString - Donne la représentation officielle de la pièce
		 * @memberof pieces.King
		 * @instance
		 * @returns {string} Représentation de la pièce
		 */
		toShortString()
		{
			return "K";
		}
		constructor(color, pos)
		{
			super(color, pos);
			this.bigCastle = false;
			this.smallCastle = false;
		}
		/**
	   * calculateLegalMoves - Calcul les mouvements légaux de la pièce
	   * @memberof pieces.King
		 * @instance
	   *
	   * @param {Board} boardInstance Plateau
	   *
	   */
		calculateLegalMoves(boardInstance) {
			if(!boardInstance || !(boardInstance.constructor && boardInstance.constructor.name === "Board"))
			{
				console.error("Board undefined for calculateLegalMoves()");
				return;
			}
			this.legalMoves.length = 0;
			var testPos, testTile;
			var initPositions = [[1, 1], [1, 0], [1, -1], [0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]];
			for (var i = 0; i < initPositions.length; i++) {
				testPos = {"x": this.pos.x + initPositions[i][0], "y": this.pos.y + initPositions[i][1]};
				testTile = boardInstance.getTile(testPos);
				if (testTile && !testTile.isOccupied()) { //la case est sur la table est inoccupée
					this.legalMoves.push(testPos);
				}
				else if (testTile && testTile.getPiece().getColor() != this.color) {
					this.legalMoves.push(testPos);
				}

			}

			this.decimateLegalMovesCheck(boardInstance);
			if((testPos = this.checkBigCastle(boardInstance)))
			{
				this.legalMoves.push(testPos);
				this.bigCastle = true;
			}
			if((testPos = this.checkLittleCastle(boardInstance)))
			{
				this.legalMoves.push(testPos);
				this.littleCastle = true;
			}

			this.legalMovesCalculated = true;
		}

  /**
   * isInCheck - Le roi est-il en échec ?
	 * @memberof pieces.King
	 * @instance
   *
   * @param {Board} boardInstance Plateau
   *
   * @returns {bool} true si le roi est en échec
   */
		isInCheck(boardInstance)
		{
			var testPos, testTile;

			//Test for pawns
			var testPosY = this.pos.y + ((this.color==structures.PieceColor.white) ? 1 : -1);
			testPos = {"x": this.pos.x+1, "y": testPosY};
			testTile = boardInstance.getTile(testPos);
			if(testTile && testTile.isOccupied())
			{
				if(testTile.piece.color !== this.color &&  testTile.piece.constructor === pieces.Pawn)
				{
					return true;
				}
			}
			testPos = {"x": this.pos.x-1, "y": testPosY};
			testTile = boardInstance.getTile(testPos);
			if(testTile && testTile.isOccupied())
			{
				if(testTile.piece.color !== this.color &&  testTile.piece.constructor === pieces.Pawn)
				{
					return true;
				}
			}

			//Test for Kings (pour la vérification de mouvement)
			var initPositions = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
			for(var i=0; i < initPositions.length; i++)
			{
				testPos = {x : this.pos.x + initPositions[i][0], y: this.pos.y + initPositions[i][1]};
				testTile = boardInstance.getTile(testPos);
				if(testTile && testTile.isOccupied() && testTile.piece.color !== this.color && testTile.piece.constructor === pieces.King)
				{
					return true;
				}
			}

			//Test for Vertical/Horizontal
			initPositions = [[1,0], [0,1], [-1,0], [0,-1]];
			for(i=0; i < initPositions.length; i++)
			{
				testPos = {x: this.pos.x + initPositions[i][0], y: this.pos.y + initPositions[i][1]};
				while((testTile = boardInstance.getTile(testPos)))
				{
					if (!testTile.isOccupied()) {
						var modifierX=0, modifierY=0;
						switch(i) {
							case 0: modifierX=1; break;
							case 1: modifierY=1; break;
							case 2: modifierX=-1; break;
							case 3: modifierY=-1; break;
						}
						testPos = utilities.toCoord({"x": testPos.x + modifierX, "y": testPos.y + modifierY});
					}
					else {
						if (testTile.getPiece().color != this.color && (testTile.piece.constructor === pieces.Rook || testTile.piece.constructor === pieces.Queen)) {
							return true;
						}
						break;
					}
				}
			}

			//Check for diagonal
			initPositions = [[1,1], [1,-1], [-1,1], [-1,-1]];
			for(i=0; i < initPositions.length; i++)
			{
				testPos = {x: this.pos.x + initPositions[i][0], y: this.pos.y + initPositions[i][1]};
				while((testTile = boardInstance.getTile(testPos)))
				{
					if (!testTile.isOccupied()) {
						modifierX=0, modifierY=0;
						switch(i) {
							case 0: modifierX=1; modifierY=1; break;
							case 1: modifierX=1; modifierY=-1; break;
							case 2: modifierX=-1; modifierY=1; break;
							case 3: modifierX=-1; modifierY=-1; break;
						}
						testPos = utilities.toCoord({"x": testPos.x + modifierX, "y": testPos.y + modifierY});
					}
					else {
						if (testTile.getPiece().getColor() != this.color && (testTile.piece.constructor === pieces.Bishop || testTile.piece.constructor === pieces.Queen)) {
							return true;
						}
						break;
					}
				}
			}

			//Check for knight
			initPositions = [[1,2],[2,1],[1,-2],[-2,1],[-1,2],[2,-1],[-1,-2],[-2,-1]];
			for(i=0; i<initPositions.length; i++)
			{
				testPos = {x: this.pos.x + initPositions[i][0], y: this.pos.y + initPositions[i][1]};
				testTile = boardInstance.getTile(testPos);
				if(testTile && testTile.isOccupied() && testTile.piece.constructor === pieces.Knight && testTile.piece.color !== this.color)
				{
					return true;
				}
			}

			return false;
		}

  /**
   * wouldBeInCheck - Si on effectue le mouvement spécifié, le roi serait-il en échec ?
	 * @memberof pieces.King
	 * @instance
   *
   * @param {Board} futureBoard Plateau virtuel
   * @param {(string|{x:number,y:number})} moveOldPos  Position de départ
   * @param {(string|{x:number,y:number})} moveNewPos  Position d'arrivée
   *
   * @returns {bool} true si le roi serait en échec
   */
		wouldBeInCheck(futureBoard, moveOldPos, moveNewPos)
		{
			if(futureBoard.isBuffer)
			{
				if(moveOldPos && moveNewPos)
				{
					var oldTile = futureBoard.getTile(moveOldPos);
					var newTile = futureBoard.getTile(moveNewPos);
					if(oldTile && newTile)
					{
						futureBoard.move(moveOldPos, moveNewPos);
						return this.isInCheck(futureBoard);
					}
				}
			}
		}

  /**
   * checkBigCastle - Vérifie si on peut effectuer un grand roque
	 * @memberof pieces.King
	 * @instance
   *
   * @param {Board} board Plateau
   *
   * @returns {?{x:number, y:number}} Position d'arrivée du roi en cas de grand roque
   */
		checkBigCastle(board)
		{
			if(this.hasNeverMoved && !this.isInCheck(board))
			{
				var row = (this.color === structures.PieceColor.white) ? 0 : 7;
				var rookTile = board.getTile({x:0, y:row});
				if(rookTile && rookTile.isOccupied() && rookTile.piece.constructor === pieces.Rook && rookTile.piece.hasNeverMoved)
				{
					var testTiles = [board.getTile({x:1, y:row}),board.getTile({x:2, y:row}),board.getTile({x:3, y:row})];
					if(testTiles.every(function(elmt)
					{
						return elmt && !elmt.isOccupied();
					}))
					{
						var testBoard = board.toBufferBoard();
						var piece = (this.color === structures.PieceColor.white) ? testBoard.whiteKing : testBoard.blackKing;
						testBoard.forceMove(piece.pos, testTiles[2].pos, false);
						piece = (this.color === structures.PieceColor.white) ? testBoard.whiteKing : testBoard.blackKing;
						if(!piece.isInCheck(testBoard))
						{
							testBoard.forceMove(piece.pos, testTiles[1].pos, false);
							piece = (this.color === structures.PieceColor.white) ? testBoard.whiteKing : testBoard.blackKing;
							if(!piece.isInCheck(testBoard))
							{
								return testTiles[1].pos;
							}
						}
					}
				}
			}
			return undefined;
		}
		/**
	   * checkLittleCastle - Vérifie si on peut effectuer un petit roque
	   * @memberof pieces.King
		 * @instance
	   *
	   * @param {Board} board Plateau
	   *
	   * @returns {?{x:number, y:number}} Position d'arrivée du roi en cas de petit roque
	   */
		checkLittleCastle(board)
		{
			if(this.hasNeverMoved && !this.isInCheck(board))
			{
				var row = (this.color === structures.PieceColor.white) ? 0 : 7;
				var rookTile = board.getTile({x:0, y:row});
				if(rookTile && rookTile.isOccupied() && rookTile.piece.constructor === pieces.Rook && rookTile.piece.hasNeverMoved)
				{
					var testTiles = [board.getTile({x:6, y:row}),board.getTile({x:5, y:row})];
					if(testTiles.every(function(elmt)
					{
						return elmt && !elmt.isOccupied();
					}))
					{
						var testBoard = board.toBufferBoard();
						var piece = (this.color === structures.PieceColor.white) ? testBoard.whiteKing : testBoard.blackKing;
						testBoard.forceMove(piece.pos, testTiles[1].pos, false);
						if(!piece.isInCheck(testBoard))
						{
							testBoard.forceMove(piece.pos, testTiles[0].pos, false);
							if(!piece.isInCheck(testBoard))
							{
								return testTiles[0].pos;
							}
						}
					}
				}
			}
			return undefined;
		}
	}

};

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = pieces;
