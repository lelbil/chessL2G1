"use strict";

(function(){
	var root = this;
	var previous_structures = root.structures;


	var has_require = typeof require !== 'undefined';
	var utilities = root.utilities;
	if( typeof utilities === 'undefined' ) {
		if( has_require ) {
			utilities = require('./utilities.js');
		}
		else throw new Error('structures requires utilities');
	}
/** Objet stockant les structures de base*/
	var structures = { //Initial board tourné à 90° car A1 est 0,0 et A8 est 0,7
		/**GameMode contient le plateau basique*/
		GameMode : {
			classic:{
				ruleset:"classic",
				initialBoard:[
					["WR", "WP", "  ", "  ", "  ", "  ", "BP", "BR"],
					["WN", "WP", "  ", "  ", "  ", "  ", "BP", "BN"],
					["WB", "WP", "  ", "  ", "  ", "  ", "BP", "BB"],
					["WQ", "WP", "  ", "  ", "  ", "  ", "BP", "BQ"],
					["WK", "WP", "  ", "  ", "  ", "  ", "BP", "BK"],
					["WB", "WP", "  ", "  ", "  ", "  ", "BP", "BB"],
					["WN", "WP", "  ", "  ", "  ", "  ", "BP", "BN"],
					["WR", "WP", "  ", "  ", "  ", "  ", "BP", "BR"]
				]
			}
		},
		Ruleset : {
			classic:[]
		},
		/** PieceColor permet d'avoir les même couleurs partout*/
		PieceColor : {white:"white", black:"black"},

		Piece :
		/** Classe de base de toutes les pièces
		 * @memberof structures
		 */
		class Piece{
			/**
			* Piece - Crée une nouvelle piece
			* @memberof structures.Piece
			* @param {string} color Couleur de la pièce
			* @param {({x:number,y:number}|string)} pos   Position de la pièce
			*/
			constructor(color, pos)
			{
				/**Position
				* @memberof structures.Piece
	 			* @instance
				*/
				this.pos = utilities.toCoord(pos) || {x:0, y:0};
				//this.type = type || structures.PieceType.pawn;
				/** Couleur
				* @memberof structures.Piece
	 			* @instance
				*/
				this.color = color || structures.PieceColor.white;
				/** La piece est elle sur le plateau ?
				* @memberof structures.Piece
	 			* @instance
				*/
				this.onBoard = true;
				/** Liste des mouvements légaux de la pièce
				* @memberof structures.Piece
	 			* @instance
				*/
				this.legalMoves = [];
				/** Est ce que la pièce n'a jamais bougé ?
				* @memberof structures.Piece
	 			* @instance
				*/
				this.hasNeverMoved=true;
				/** Les mouvements légaux ont-ils été calculés ?
				* @memberof structures.Piece
	 			* @instance
				*/
				this.legalMovesCalculated = false;
				/** Le dernier mouvement était-il double ? (pour les pions)
				* @memberof structures.Piece
	 			* @instance
				*/
				this.lastMoveIsDouble = false;
				/** Liste des positions de capture de la prise en passantc (pour les pions)
				* @memberof structures.Piece
	 			* @instance
				*/
				this.enPassantCapturePos = [];
				this.type = this.constructor.name;
			}

			/**
			* getColor - Recupère la couleur de la pièce
			* @memberof structures.Piece
			* @instance
			*
			* @returns {string} Couleur de la pièce
			*/
			getColor() {return this.color;}

			/**
			* calculateLegalMoves - Calcul les mouvements légaux de la pièce
			* @memberof structures.Piece
			* @instance
			*
			* @param {Board} board Plateau
			*/
			calculateLegalMoves(board)
			{
				//Fonction pour modifier la valeur de this.legalMoves afin de refleter les mouvements légaux de la pièce
				this.legalMoves = [];
			}

			/**
			* toString - Texte correspondant à la pièce
			* @memberof structures.Piece
			* @instance
			*
			* @returns {string} Version texte de la pièce
			*/
			toString()
			{
				return this.color + " " + this.type;
			}

			/**
			* decimateLegalMovesCheck - Retire les mouvements initialement calculés qui entraine un echec de son côté
			* @memberof structures.Piece
			* @instance
			*
			* @param {Board} boardInstance Plateau
			*
			*/
			decimateLegalMovesCheck(boardInstance)
			{
				if(this.legalMoves.length > 0)
				{
					if(!boardInstance.isBuffer)
					{
						var futureBoard;
						var that = this;
						var checkPassed = [];
						boardInstance.changed = true;
						boardInstance.etat = "";
						this.legalMoves.forEach(function(elmt)
						{
							futureBoard = boardInstance.toBufferBoard();
							if(futureBoard.turnColor === structures.PieceColor.white)
							{
								if(!futureBoard.whiteKing.wouldBeInCheck(futureBoard, that.pos, elmt))
									checkPassed.push(elmt);

							}else
							{
								if(futureBoard.turnColor === structures.PieceColor.black)
								{
									if(!futureBoard.blackKing.wouldBeInCheck(futureBoard, that.pos, elmt))
										checkPassed.push(elmt);

								}
							}
							futureBoard = undefined;

						});
						this.legalMoves = checkPassed;
					}
				}
			}

		},



		Tile :
		/** Classe des cases du plateau
		 * @memberof structures
		*/
		class Tile {

			/**
			* Tile - Crée une case
			* @memberof structures.Tile
			* @param {({x:number,y:number}|string)} pos   Position
			* @param {?structures.Piece} piece Pièce à mettre sur la case
			*
			*/
			constructor(pos, piece)
			{
				/**Position de la case
				 * @memberof structures.Tile
				 * @instance
				 */
				this.pos = utilities.toCoord(pos) || {x:0, y:0};
				/**Piece présente sur la case
				 * @memberof structures.Tile
				 * @instance
				 */
				this.piece=piece;
				/** (Déprécié) La case est-elle surlignée ?
				 * @memberof structures.Tile
				 * @instance
				 */
				this.highlighted=false;

			}

			/**
			* isOccupied - La case est elle occupée ?
			* @memberof structures.Tile
			* @instance
			* @returns {bool} Renvoi true si la case est occupée
			*/
			isOccupied() {
				return this.piece !== undefined;
			}

			/**
			* getPiece - Récupère la pièce présente sur la case
			* @memberof structures.Tile
			* @instance
			* @returns {structures.Piece} Piece
			*/
			getPiece()
			{
				return this.piece;
			}

			/**
			* (Déprécié) setHighlight - Gestion du surlignage
			* @memberof structures.Tile
			* @instance
			* @param {bool} bHighlight est surligné
			*
			*/
			setHighlight(bHighlight)
			{
				this.highlighted = bHighlight;
			}
		},

		State :
		/** (Déprécié) Class d'état de plateau
		* @memberof structures
		* @deprecated
		*/
		class State
		{
			constructor(record)
			{
				this.gamemode=structures.GameMode.classic;
				this.ruleset=structures.GameMode.classic.ruleset;
				this.board=structures.GameMode.classic.initialBoard;
				this.moveHistory = [];
				if(record)
					this.parseJsonState(record);

			}
			parseJsonState(record)
			{
				try
				{
					var obj = JSON.parse(record);
					if(structures[obj.gamemode.name])
						this.gamemode = obj.gamemode;
					if(obj.ruleset)
						this.ruleset = obj.ruleset;
					if(obj.board)
						this.board = obj.board;
					if(obj.moveHistory)
						this.moveHistory = obj.moveHistory;
					if(obj.turnColor)
						this.turnColor = obj.turnColor;
				}catch(e)
				{
					console.error("Cannot parse state, using default\n" + e.name + "\n"+ e.message);
				}

			}
		}
	};













	//Necessaire pour la compatibilité entre une utlisation avec Node ET avec le navigateur

	structures.noConflict = function()
	{
		root.stuctures = previous_structures;
		return structures;
	};

	if(typeof exports !== 'undefined')
	{
		if(typeof module !== 'undefined' && module.exports!== 'undefined')
		{
			exports = module.exports = structures;
		}
		exports.structures = structures;
	}else
	{
		root.structures = structures;
	}


	// Fin de la structure de compatibilité
}).call(this);
