/*global updateBrowserHistory ai*/
if(typeof require !== 'undefined')
{
	var structures = require('./structures.js');
	var utilities = require('./utilities.js');
	var front = require('./interface.js');
	var pieces = require('./pieces.js');
}

/*global updateBrowserHistory*/

/**
 * Classe du plateau de jeu
 */
class Board {

 /**
  * Crée un nouveau plateau
  * @param {string} state Etat JSON d'un plateau
  */
	constructor(state) {
		this.fromJsonState(state);
		/** Liste des cases sélectionnées
		 * @member {Array}
		 */
		this.selectedTiles = [];
		/** Piece sélectionnée*/
		this.selectedPiece = undefined;
		/** Booléen désignant si le plateau a changé depuis la dernière évaluation de son état*/
		this.changed = true;
		/** Etat du plateau en Json*/
		this.etat = "";
	}
	/**
	* Crée un plateau virtuel à partir de ce plateau
	* @see {@link toJsonState} pour des informations sur la copie
	* @returns {Board}
	*/
	toBufferBoard()
	{
		if(this.changed)
		{
			this.etat = this.toJsonState();
			this.changed = false;
		}
		var b = new Board(this.etat);
		b.isBuffer = true;
		return b;
	}
	/**
	* Génère une version JSON du plateau réutilisable pour la confection d'un nouveau plateau
	* @returns {string} Etat du plateau en JSON
	*/
	toJsonState()
	{
		let state = {};
		state.turnColor = this.turnColor;
		state.moveHistory = this.moveHistory;
		state.pieceList = [];
		this.pieceList.forEach(function(piece)
		{
			let pstate = {};
			pstate.type = piece.toShortString();
			pstate.pos = piece.pos;
			pstate.color = piece.color;
			pstate.onBoard = piece.onBoard;
			pstate.hasNeverMoved = piece.hasNeverMoved;
			pstate.lastMoveIsDouble = piece.lastMoveIsDouble;

			state.pieceList.push(pstate);
		});
		return JSON.stringify(state);
	}
	/**
	* Modifie le plateau pour correspondre au plateau JSON passé en paramètre
	* @see {@link toJsonState} pour des informations sur la copie
	* @param {string} state État JSON à partir duquel faire les modification
	*/
	fromJsonState(state)
	{
		var stateObj;
		if(state && typeof state == 'string')
		{
			stateObj = JSON.parse(state);
		}
		/** Quelle couleur doit jouer
		 * @type {string}
		 * */
		this.turnColor = structures.PieceColor.white;
		/** Historique des mouvements*/
		this.moveHistory = [];
		if(stateObj)
		{
			this.turnColor = stateObj.turnColor;
			this.moveHistory = stateObj.moveHistory;
		}
		if(stateObj && stateObj.pieceList && stateObj.pieceList.constructor == Array && stateObj.pieceList.length > 0)
		{
			this.pieceList = [];
			this.pieceList.length = 0;
			this.currentBoard = [];
			this.currentBoard.length = 0;
			for(var i = 0; i < 8;i++)
			{
				this.currentBoard.push([]);
				for(var j=0; j<8;j++)
				{
					this.currentBoard[i].push(new structures.Tile({x:i,y:j}));
				}

			}
			var that = this;
			stateObj.pieceList.forEach(function(elmt)
			{
				var color = elmt.color || structures.PieceColor.white;
				var pos = elmt.pos || {x:0,y:0};
				var piece = undefined;
				switch(elmt.type)
				{
					case 'R':
						piece = new pieces.Rook(color, pos);
						break;
					case 'B':
						piece = new pieces.Bishop(color, pos);
						break;
					case 'Q':
						piece = new pieces.Queen(color, pos);
						break;
					case 'K':
						piece = new pieces.King(color, pos);
						break;
					case 'N':
						piece = new pieces.Knight(color, pos);
						break;
					case 'P':
						piece = new pieces.Pawn(color, pos);
						break;
					default :
						piece = undefined;
				}
				if(piece)
				{
					piece.hasNeverMoved = (elmt.hasNeverMoved !== undefined) ? elmt.hasNeverMoved : true;
					piece.onBoard = (elmt.onBoard !== undefined) ? elmt.onBoard :  false;
					piece.lastMoveIsDouble = (elmt.lastMoveIsDouble !== undefined) ? elmt.lastMoveIsDouble : false;
					piece.legalMovesCalculated = false;
					if(piece.onBoard)
						that.getTile(pos).piece = piece;
					that.pieceList.push(piece);
				}
			});

		}else
		{
			this.pieceList = [];
			this.currentBoard = this.generateBoard(structures.GameMode.classic.initialBoard);
		}

		this.isInLastState=true;
		this.needPromotion=undefined;
		this.partialMoveRecord="";
		this.whiteKing = this.getKing(structures.PieceColor.white);
		this.blackKing = this.getKing(structures.PieceColor.black);
		this.etat = "";
		this.changed = true;
	}


 /**
  * getTile - Recupère la case du plateau à la coordonnée spécifiée
  * @param {(string|{x:number,y:number})} pos Coordonnées à partir du coin inférieur gauche ou coordonnée d'échec (ex : A8)
  *
  * @returns {?Tile} Case du plateau
  */
	getTile(pos)
	{
		var posv = utilities.toCoord(pos);
		if(posv)
		{
			return this.currentBoard[posv.x][posv.y];
		}else
		return undefined;
	}

 /**
  * generateBoard - Permet de générer un plateau à partir d'un état basique
  * @param {Array<Array<string>>} board Tableau de 8*8 string désignant la position de chaque pièce
  *
  * @returns {Array<Array<Tile>>} Tableau de 8*8 cases contenant les pièces
  */
	generateBoard(board)
	{
		var tileBoard = [];
		if(board.constructor === Array && board.length == 8)
		{
			for(var i = 0; i < 8; i++)
			{
				tileBoard[i] =  [];
				if(board[i].constructor === Array && board.length == 8)
				{
					for(var j = 0; j < 8; j++)
					{
						var tile;
						var pos = {x:i, y:j};
						if(typeof board[i][j] === 'string' && board[i][j].length == 2)
						{
							var piece, color, tState = board[i][j].toUpperCase();

							if(tState.charAt(0) === 'B')
							{
								color = structures.PieceColor.black;
							}else
							{
								color = structures.PieceColor.white;
							}

							switch(tState.charAt(1))
							{
								case 'R':
									piece = new pieces.Rook(color, pos);
									break;
								case 'B':
									piece = new pieces.Bishop(color, pos);
									break;
								case 'Q':
									piece = new pieces.Queen(color, pos);
									break;
								case 'K':
									piece = new pieces.King(color, pos);
									break;
								case 'N':
									piece = new pieces.Knight(color, pos);
									break;
								case 'P':
									piece = new pieces.Pawn(color, pos);
									break;
								default :
									piece = undefined;
							}
							if(piece)
								this.pieceList.push(piece);
							tile = new structures.Tile(pos, piece);
						}else
						{
							tile = new structures.Tile(pos, undefined);
						}

						tileBoard[i][j] = tile;
					}
				}
			}
		}
		return tileBoard;
	}

 /**
  * getKing - Permet de récupérer le roi d'une certaine couleur
  * @param {string} side Couleur
  *
  * @returns {?Piece} Le roi de la couleur concernée
  */
	getKing(side)
	{
		if(side)
		{
			if(side === structures.PieceColor.white || side === structures.PieceColor.black)
			{
				for(var i=0; i < this.currentBoard.length; i++)
				{
					var kingTile = this.currentBoard[i].find(function(val)
					{
						return val.isOccupied() && val.piece.constructor == pieces.King && val.piece.color === side;
					});
					if(kingTile)
					{
						return kingTile.piece;
					}
				}
				return undefined;
			}
		}
	}

 /**
  * move - Effectue le mouvement de oldPos vers newPos (fais les vérifications nécessaires)
  * @param {({x:number,y:number}|string)} oldPos Position de la pièce à bouger
  * @param {({x:number,y:number}|string)} newPos Position d'arrivée
  *
  * @returns {bool} retourne vrai si le mouvement s'est bien passé
  */
	move(oldPos, newPos)
	{
		var oldPosRec, newPosRec, pieceRec, enPassantRec, castleRec, promoteRec, captureRec;

		let oldPosv = utilities.toCoord(oldPos);
		let newPosv = utilities.toCoord(newPos);

		if(newPosv && oldPosv)
		{
			let oldTile = this.getTile(oldPosv);
			let newTile = this.getTile(newPosv);
			if(oldTile && newTile && oldTile.isOccupied()) //Si les cases sont valides et une piece est sélectionnée
			{
				let piece = oldTile.getPiece();
				if(!piece.legalMovesCalculated) //On calcule les mouvements légaux si cela n'a pas été fait
				{
					piece.calculateLegalMoves(this);
				}
				if(piece.legalMoves.findIndex(function(val, index, arr){ return val.x===newPosv.x && val.y===newPosv.y;})!== -1) //On vérifie que le mouvement fait bien partie des mouvements légaux
				{
					if(newTile.isOccupied()) //Si une piece adverse est sur la case d'arrivée, elle est retirée du terrain
					{
						newTile.getPiece().onBoard = false;
						captureRec = newTile.piece.toShortString();
					}else //Sinon, on vérifie qu'il ne s'agit pas d'une prise en passant
					{
						if(this.enPassant(oldTile, newTile, piece.enPassantCapturePos))
						{
							enPassantRec = "ep";
							captureRec = "P";
						}

					}
					//On enregistre le mouvement et la piece qui bouge
					oldPosRec = utilities.toTileReference(oldPos);
					newPosRec = utilities.toTileReference(newPos);
					pieceRec = piece.toShortString();

					//On bouge la piece
					piece.pos = newPosv;
					newTile.piece = piece;
					oldTile.piece = undefined;

					//Si c'est un grand roque
					if(piece.bigCastle && ((oldPosv.x - newPosv.x) == 2))
					{
						this.forceMove({x:0, y:piece.pos.y}, {x:3, y:piece.pos.y}, false); //on bouge la tour
						castleRec="O-O-O";
					}

					//Si c'est un petit roque
					if(piece.littleCastle && ((oldPosv.x - newPosv.x) == -2))
					{
						this.forceMove({x:7, y:piece.pos.y}, {x:5, y:piece.pos.y}, false); //on bouge la tour
						castleRec="O-O";
					}

					//On remet à 0 les mouvements légaux des pieces
					//On devra recalculer les mouvements légaux de toutes les pieces
					piece.hasNeverMoved = false;
					this.pieceList.forEach(function(val){
						val.legalMovesCalculated = false;
						val.legalMoves.length = 0;
						val.enPassantCapturePos.length = 0;
						val.bigCastle = false;
						val.littleCastle = false;
					});


					//On met à false l'attribut des pions qui dit que leur premier mouvement est double pour le tour
					this.pieceList.forEach(function(val){
						val.lastMoveIsDouble=false;
					});

					//On reset l'affichage des cases légales
					this.selectedTiles.forEach(function(elmt){
						elmt.removeEventListener("click", front.handleClickedSelectedTile, true);
						elmt.style.backgroundColor="";
					});
					this.selectedTiles.length=0;

					if(!this.isBuffer && piece.constructor === pieces.Pawn && newPosv.y === ((piece.color === structures.PieceColor.white) ? 7 : 0))
					{
						this.needPromotion = piece;
						if(typeof front !== 'undefined')
							front.displayPromotion();
					}

					//Si la piece bougée est un pion et qu'il a bougé de 2, il peut etre pris en passant
					if(piece.constructor == pieces.Pawn && Math.abs(oldPosv.y - newPosv.y) == 2)
						piece.lastMoveIsDouble = true;

					if(!this.needPromotion)
					{
						//Si il n'y a pas besoin de promotion
						this.turnColor = (this.turnColor === structures.PieceColor.white) ? structures.PieceColor.black : structures.PieceColor.white; //C'est au tour de l'adversaire
						this.partialMoveRecord = undefined;
						this.moveHistory.push(utilities.toMoveHistory(castleRec, oldPosRec, newPosRec, pieceRec, enPassantRec, captureRec, promoteRec));
						if(!this.isBuffer)
						{
							if(typeof front !== 'undefined')
							{
								this.changed = true;
								this.etat = "";
								if(typeof require === 'undefined')
									updateBrowserHistory(this);
								front.showTable(this);
								if(typeof require === 'undefined')
									updateBrowserHistory(this);
								this.calculateStatus();
							}

						}

					}else
					{
						this.partialMoveRecord={castleRec:castleRec, oldPosRec:oldPosRec, newPosRec:newPosRec, pieceRec:pieceRec, enPassantRec:enPassantRec, captureRec:captureRec};
					}
					this.changed = true;
					this.etat = "";


					return true;


				}else
				{
					if(!this.isBuffer)
						utilities.generatePopup("red", "Ce mouvement n'est pas autorisé !", 1000);
					return false;
				}
			}
		}
	}

 /**
  * forceMove - force le mouvement d'une pièce sans vérification
  * @param {({x:number,y:number}|string)} oldPos     Position de la pièce à bouger
  * @param {({x:number,y:number}|string)} newPos     Position d'arrivée
  * @param {bool} changeTurn Le coté doit etre changé
  *
  */
	forceMove(oldPos, newPos, changeTurn)
	{
		var oldTile = this.getTile(oldPos), newTile = this.getTile(newPos);
		if(oldTile && newTile && oldTile.isOccupied())
		{
			if(newTile.isOccupied())
			{
				newTile.piece.onBoard = false;
			}
			if(oldTile.piece.constructor !== pieces.King && oldTile.piece.constructor !== pieces.Rook)
			{
				console.warn("Using forceMove for anything else than castle isn't recommended !");
			}
			let piece = oldTile.getPiece();
			piece.pos = newTile.pos;
			piece.hasNeverMoved = false;
			newTile.piece = piece;
			oldTile.piece = undefined;
			this.changed = true;
			this.etat = "";
			if(changeTurn)
			{
				this.turnColor = (this.turnColor == structures.PieceColor.black)? structures.PieceColor.white : structures.PieceColor.black;
			}


		}
	}

 /**
  * afterPromote - Fonction de routine à executer après une promotion
  */
	afterPromote()
	{
		this.changed = true;
		this.etat = "";
		this.moveHistory.push(utilities.toMoveHistory(this.partialMoveRecord.castleRec, this.partialMoveRecord.oldPosRec,this.partialMoveRecord.newPosRec,this.partialMoveRecord.pieceRec, this.partialMoveRecord.enPassantRec,this.partialMoveRecord.captureRec,this.partialMoveRecord.promoteRec));
		this.partialMoveRecord = undefined;
		this.changed = true;
		this.etat = "";
		if(typeof require === 'undefined')
			updateBrowserHistory(this);
		front.showTable(this);
		if(typeof require === 'undefined')
			updateBrowserHistory(this);
		this.calculateStatus();
		this.turnColor = (this.turnColor === structures.PieceColor.white) ? structures.PieceColor.black : structures.PieceColor.white; //C'est au tour de l'adversaire
		if(utilities.getGameId() === 'IA' && typeof ai !== 'undefined')
		{
			ai.nextMoveAsync(this);
		}
	}

 /**
  * calculateStatus - Calcule l'état de la partie
  * @returns {bool} Renvoie faux si la partie est terminée
  */
	calculateStatus()
	{
		//On vérifie que si l'adversaire peut faire un mouvement
		var that = this;
		if(this.pieceList.every(function(elmt)
		{
			if(elmt.color !== that.turnColor)
				return true; //Mes pieces ne m'interessent pas
			else
			{
				if(elmt.onBoard)
				{
					elmt.legalMovesCalculated = false;
					elmt.calculateLegalMoves(that); //On calcule les mouvements de la piece de l'adversaire
					return elmt.legalMoves.length === 0; //On continue si la pièce ne peut pas bouger
				}
				else
					return true;
			}
		}))
		{
			if(typeof require === 'undefined')
			{
				//Il ne peut pas faire de mouvement
				if(this.turnColor === structures.PieceColor.white) //Si l'adversaire est blanc
				{
					if(this.whiteKing.isInCheck(this)) //Si le roi blanc est en échec
					{
						alert("Echec et mat ! 0-1"); //Echec et mat ! Les noirs gagnent
					}else
					{
						alert("Pat ! ½-½"); //Roi pas en échec : pat !
					}
				}else
				{
					if(this.blackKing.isInCheck(this)) //Si le roi noir est en échec
					{
						alert("Echec et mat ! 1-0"); //Echec et mat ! Les blancs gagnent
					}else
					{
						alert("Pat ! ½-½"); //Roi pas en échec : pat !
					}
				}
				return false; //retourne false pour dire que la partie est finie
			}
		}
		return true;
	}

 /**
  * enPassant - Effectue une capture de prise en passant si valide
  * @param {({x:number,y:number}|string)} oldTile    Position de départ
  * @param {({x:number,y:number}|string)} newTile    Position d'arrivée
  * @param {({x:number,y:number}|string)} capturePos Position de la pièce à capturer
  *
  * @returns {bool} Retourne true si la prise en passant est valide
  */
	enPassant(oldTile, newTile, capturePos)
	{
		if(capturePos && capturePos.constructor == Array && capturePos.length > 0)
		{
			var capPos = capturePos.find(function(val){
				if(val.hasOwnProperty("x"))
				{
					return val.x === newTile.pos.x;
				}
				return false;
			});
			var captureTile = this.getTile(capPos);
			if(oldTile && newTile && captureTile)
			{
				if(oldTile.isOccupied() && oldTile.piece.constructor == pieces.Pawn)
				{
					if(!newTile.isOccupied() && captureTile.isOccupied() && captureTile.piece.constructor == pieces.Pawn && captureTile.piece.lastMoveIsDouble)
					{
						captureTile.piece.onBoard = false;
						captureTile.piece = undefined;
						return true;
					}
				}
			}
		}
		return false;
	}
}

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = Board;
