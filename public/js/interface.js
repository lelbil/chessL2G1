/*global utilities structures socket pieces Board $ ai*/
var board;

/**
* heure - Renvoi l'heure actuelle formatée
*
* @returns {string} Heure formatée
*/
function heure() {
	var date = new Date();
	var heure = date.getHours();
	var minutes = date.getMinutes();
	if(minutes < 10)
		minutes = "0" + minutes;
	return heure + "h" + minutes;
}
function fold() {
	var p =document.querySelector("#talk");
	p.style.display = "none";
}
function unfold() {
	var p =document.querySelector("#talk");
	p.style.display = "inline";
}
function toggle() {
	var p =document.querySelector("#talk");
	if (p.style.display == "none") unfold();
	else fold();
}

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

var tagOrComment = new RegExp(
	'<(?:'
	// Comment body.
	+ '!--(?:(?:-*[^->])*--+|-?)'
	// Special "raw text" elements whose content should be elided.
	+ '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
	+ '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
	// Regular name
	+ '|/?[a-z]'
	+ tagBody
	+ ')>',
	'gi');

/**
* removeTags - Assainit une chaine de caractère pour retirer les balises Html
*
* @param {string} html Chaine à assainir
*
* @returns {string} Chaine assainie
*/
function removeTags(html) {
	var oldHtml;
	do {
		oldHtml = html;
		html = html.replace(tagOrComment, '');
	} while (html !== oldHtml);
	return html.replace(/</g, '&lt;');
}
/** Variable d'interface de jeu*/
var front = {};
if(typeof require !== 'undefined')
{ //On est coté serveur
	front.handleClickedPiece = function(evt){};
	front.showTable = function(board){};
	front.displayPromotion = function(){};
	front.handleClickedSelectedTile = function(){};
	front.changeTexture = function(){};
}else
{
	/** Variable définissant le côté que l'on joue
	* @memberof front
	* */
	front.status = structures.PieceColor.white;

	/**
	* insereMessage - Insere un message dans le chat
	*
	* @param {string}    message         Message
	* @param {boolean} [escaping=true] Doit-on assainir le message ?
	*
	*/
	front.insereMessage = function(message, escaping=true) {
		var p;
		if(escaping)
		{
			let pseudo = removeTags(message.pseudo);
			let text = removeTags(message.text);
			if(text.trim().length > 0 && pseudo.trim().length > 0)
			{
				p = "<p><em>"+heure()+"</em><strong> " + pseudo + "</strong> : " + text + "</p>";
				$('#lazone').append(p);
			}
		}else
		{
			p = "<p>" + message.text + "</p>";
			$('#lazone').append(p);
		}


	};

	/**
	* handleClickedPiece - Fonction de gestion lorsque l'on clique sur une pièce
	*
	* @param {Event} evt Evenement de click
	*
	*/
	front.handleClickedPiece = function(evt) {
		if(!board.needPromotion){
			var clickedCoords = utilities.toCoord(evt.target.id);
			var clickedTile = board.getTile(clickedCoords);//admettant que board est une variable globale (qui n'existe pas encore)
			//si occupée, sélectionner toutes les cases sur lesquelles on peut aller
			if (clickedTile.isOccupied()) {
				var clickedPiece = clickedTile.getPiece();

				if((utilities.gameIsLocal()&& (typeof ai === 'undefined' || (ai && ai.color!==board.turnColor)) ||(front.status && front.status === board.turnColor)) && clickedPiece.getColor() === board.turnColor )
				{
					if(board.selectedPiece)
					{
						let oldTile = document.getElementById(utilities.toTileReference(board.selectedPiece.pos));
						if(oldTile)
						{
							oldTile.style.boxShadow = "";
						}
					}
					board.selectedPiece = clickedPiece;
					for(var i=0; i < board.selectedTiles.length; i++){
						board.selectedTiles[i].removeEventListener("click", front.handleClickedSelectedTile, true);
						board.selectedTiles[i].style.boxShadow="";
					}
					board.selectedTiles = [];
					if(!clickedPiece.legalMovesCalculated)
						clickedPiece.calculateLegalMoves(board);
					for (var j = 0; j<clickedPiece.legalMoves.length; j++) {

						//first highlight legal moves
						var hlId = utilities.toTileReference(clickedPiece.legalMoves[j]);//id of the tile to be highlighted
						var hlTile = document.getElementById(hlId);
						board.selectedTiles.push(hlTile);
						if(board.getTile(hlId).isOccupied())
						{
							hlTile.style.boxShadow = "0px 0px 20px 3px rgba(255, 255, 0, 0.9) inset";
						}else
						hlTile.style.boxShadow = "0px 0px 20px 3px rgba(0, 255, 0, 0.8) inset";
					}
					if(clickedPiece.legalMoves.length > 0)
					{
						evt.target.style.boxShadow = "0px 0px 20px 3px rgba(0, 0, 255, 0.8) inset";
					}
					else
					{
						evt.target.style.boxShadow = "0px 0px 20px 3px rgba(255, 0, 0, 0.8) inset";
					}

					//then if one of the is clicked, make the move, and show the new table
					//Je mets les eventListeners, logiquement ils vont être réinitialisés quand une autre case est cliquée
					for (j = 0; j < board.selectedTiles.length; j++ ) {
						board.selectedTiles[j].addEventListener("click", front.handleClickedSelectedTile, true);
					}
				}else
				{
					if(board.selectedTiles.findIndex(function(elmt){ return elmt.id === evt.target.id;}) === -1)
						utilities.generatePopup("yellow", "C'est au tour des " + ((board.turnColor === structures.PieceColor.white) ? "blancs" : "noirs") + " !" , 2000);
				}
			}
		}
		evt.stopPropagation();
	};

	/**
	* handleClickedSelectedTile - Fonction de gestion de click sur une case
	*
	* @param {Event} event Evenement de click
	*
	*/
	front.handleClickedSelectedTile = function(event){
		var targetPos = utilities.toCoord(event.target.id);
		if(!utilities.gameIsLocal())
			socket.emit('send move', {
				move:{
					"from": board.selectedPiece.pos,
					"to": targetPos
				},
				room:utilities.getGameId()
			});
		else
		{
			board.move(board.selectedPiece.pos, targetPos);
			if(!board.needPromotion && utilities.getGameId() === 'IA' && typeof ai !== 'undefined')
			{
				ai.nextMoveAsync(board);
			}
		}

	};

	/**
	* tileClicked - Ajoute la gestion des click sur pieces
	*/
	var tileClicked = function(board) {
		var tds = document.querySelectorAll("#plateau td");
		for (var i = 0; i < tds.length; i++) {
			tds[i].addEventListener("click", front.handleClickedPiece ,true);
		}
	};


	/**
	* chatSetupComplete - Fonction de fin de chargement du chat, gère le pseudo
	*
	* @param {bool} hasUsername true si l'utilisateur est connecté et donc a son pseudo
	*
	*/
	front.chatSetupComplete = function(hasUsername){
		let usernameInput = $('#username')[0];
		if(usernameInput)
		{
			if(hasUsername)
			{
				usernameInput.value = front.username;
				usernameInput.disabled = true;
			}else
			{
				if(usernameInput.value.trim().length > 0)
				{
					front.username = usernameInput.value.trim();
					usernameInput.disabled = true;
				}
			}

		}
		front.insereMessage({text:"<em>Connecté en tant que " + ((front.username && front.username.length > 0)? front.username : "inconnu") + "</em>"}, false);
	};

	/**
	* showTable - Affiche le plateau
	*
	* @param {Board} board plateau
	*/
	front.showTable = function (board) {
		let elmts = document.querySelectorAll("#plateau td");
		for(var i = 0; i < elmts.length; i++)
		{
			var piece = board.getTile(elmts[i].id).piece;
			elmts[i].style.color="red";
			if(piece) {
				//elmt.innerHTML = piece.toString(); //we don't need this line anymore

				//change the style of these
				//might use a switch depending on the piece type
				//but must be sure which colour is the piece
				//I reckon the tile selector's name is elmt, use that
				var bgPosX = "";
				switch (piece.type) {
					case "Pawn": bgPosX = "100%"; break;
					case "Rook": bgPosX = "80%"; break;
					case "Bishop": bgPosX = "40%" ; break;
					case "Knight": bgPosX = "60%"; break;
					case "King": bgPosX = "0%"; break;
					case "Queen": bgPosX = "20%"; break;
				}
				elmts[i].style = ("background-image: url(../img/Chess_Pieces_Sprite.svg); background-repeat: no-repeat; background-position: " + bgPosX +" " + ((piece.color == structures.PieceColor.white)? "0%" : "100%") +";background-size: 600% 200%;");
			}
			else
			elmts[i].style ="";
		}
	};

	/**
	* displayPromotion - Affiche les boutons de promotion
	*
	*/
	front.displayPromotion = function()
	{
		document.getElementById("promoteButtons").style.display = "";
	};

	document.addEventListener("DOMContentLoaded", function(){
		if(utilities.gameIsLocal())
		{
			let tab = document.getElementById("tab");
			let chat = document.getElementById("chat");
			let mask = document.getElementById("mask");
			let remotesave = document.getElementById("buttonRemoteSave");
			if(tab)
				tab.style.display = "none";
			if(chat)
				chat.style.display = "none";
			if(mask)
				mask.style.display = "none";
			if(remotesave)
				remotesave.style.display = "none";
		}else
		{
			let newgamebtn = document.getElementById("newgamebtn");
			if(newgamebtn)
				newgamebtn.style.display = "none";
		}
		var fontbutton = document.getElementById("theme");
		if(fontbutton!==undefined)
		{
			fontbutton.addEventListener("click", front.changeTexture);
		}

		document.querySelectorAll('#chat button')[0].addEventListener("click",function(e) {
			e.preventDefault();
			let m = document.getElementById("m");
			let usernameInput = $('#username')[0];
			if(usernameInput)
			{
				if(usernameInput.value.trim().length !== 0 && usernameInput.value !== "Systeme")
				{
					var message = {
						pseudo : usernameInput.value,
						text : m.value,
						room:utilities.getGameId()
					};
					//socket.emit('chat-message', message);
					//$('#m').val('');
					if (message.text.trim().length !== 0) {
						front.username = usernameInput.value;
						usernameInput.disabled = true;
						socket.emit('chat-message', message);
						m.value = "";
					}
					//insereMessage(message.text);

				}
			}

			m.focus();
		});

		/** Variable globale du plateau*/
		board = new Board();
		front.showTable(board);

		if(utilities.gameIsLocal())
		{
			var div = document.getElementById("downloadDiv");
			if(div)
			{
				var p = document.createElement("p");
				p.innerHTML = 'Charger depuis l\'ordinateur : <input type="file" id="buttonLocalLoad"></input>';
				div.appendChild(p);
				document.getElementById("buttonLocalLoad").addEventListener("change", function(evt)
				{
					utilities.load(evt.target.files, board);
				});
			}
		}


		var buttons = document.getElementById("promoteButtons");
		if(buttons)
		{
			board.needPromotion = undefined;
			buttons.style.display = "none";


			var queenButton = document.getElementById("btnQueen");
			if(queenButton)
			{
				queenButton.addEventListener("click", function()
				{
					if(utilities.proceedPromote(pieces.Queen, board))
					{
						if(!utilities.gameIsLocal())
							socket.emit('promote', {
								"type": "Queen",
								room:utilities.getGameId()
							});
					}
				});
			}
			var rookButton = document.getElementById("btnRook");
			if(rookButton)
			{
				rookButton.addEventListener("click", function()
				{
					if(utilities.proceedPromote(pieces.Rook, board))
					{
						if(!utilities.gameIsLocal())
							socket.emit('promote', {
								"type": "Rook",
								room:utilities.getGameId()
							});
					}
				});
			}
			var knightButton = document.getElementById("btnKnight");
			if(knightButton)
			{
				knightButton.addEventListener("click", function()
				{
					if(utilities.proceedPromote(pieces.Knight, board))
					{
						if(!utilities.gameIsLocal())
							socket.emit('promote', {
								"type": "Knight",
								room:utilities.getGameId()
							});
					}
				});
			}
			var bishopButton = document.getElementById("btnBishop");
			if(bishopButton)
			{
				bishopButton.addEventListener("click", function()
				{
					if(utilities.proceedPromote(pieces.Bishop, board))
					{
						if(!utilities.gameIsLocal())
							socket.emit('promote', {
								"type": "Bishop",
								room:utilities.getGameId()
							});
					}
				});
			}
			var localSaveButton = document.getElementById("buttonLocalSave");
			if(localSaveButton)
			{
				localSaveButton.addEventListener("click", function()
				{
					utilities.download(board.toJsonState(), "local.json", "text/plain");
				});
			}

			var remoteSaveButton = document.getElementById("buttonRemoteSave");
			if(remoteSaveButton)
			{
				remoteSaveButton.addEventListener("click", function()
				{
					var xhttp = new XMLHttpRequest();
					xhttp.open("POST", "/p/"+utilities.getGameId()+"/save", false);
					xhttp.send();
					//window.location = window.location.toString() + "/save";

				});
			}

		}
		tileClicked(board);
	});
}

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = front;
/* * * * * *

*  changeTexture : Gestion des textures du plateau et couleur des thèmes

*/
var textcmpt = 0; //Compteur
front.changeTexture = function()
{
	/* Récupération des éléments à modifier */
	//Fond du plateau
	var font = document.getElementById("plateau");
	//Background des boutons
	var bgAspect = document.querySelectorAll(".newgame, #difficultyselect, #newai, #colorselect,section#chat div button, #quit, #theme, #btSave, #mask, #buttonRemoteSave, #buttonLocalSave, #btnQueen, #btnRook, #btnBishop, #btnKnight");
	//bord des boutons
	var bcAspect = document.querySelectorAll("#lazone, section#chat div input, #quit, #theme, #btSave, #mask, #buttonRemoteSave, #buttonLocalSave, .panel-body");
	//Titres
	var fontcolor = document.querySelectorAll(".chatTitle, .panel-title");
	//Incrémentation du compteur à chaque click
	textcmpt++;
	//Vérification si on arrive au dernier click
	if(textcmpt>4)
	{
		textcmpt=0;
	}
	//Application des nouvelles textures et couleurs
	switch (textcmpt) {
		case 0 :
			font.style = ("background-image: url(../img/Texture_Fond/Fond_Bois.png);");
			for (var i = bgAspect.length - 1; i >= 0; i--) {
				bgAspect[i].style.backgroundColor = "#8e5736"; //backgrounds
			}
			for (i = bcAspect.length - 1; i >= 0; i--) {
				bcAspect[i].style.border = "1px solid #8e5736"; //border
			}
			for (i = fontcolor.length - 1; i >= 0; i--) {
				fontcolor[i].style.color = "#8e5736"; //titres
			}
			break;
		case 1 :
			font.style = ("background-image: url(../img/Texture_Fond/Fond_Marbre_Noir.png);");
			for (i = bgAspect.length - 1; i >= 0; i--) {
				bgAspect[i].style.backgroundColor = "#525559";
			}
			for (i = bcAspect.length - 1; i >= 0; i--) {
				bcAspect[i].style.border= "1px solid #525559";
			}
			for (i = fontcolor.length - 1; i >= 0; i--) {
				fontcolor[i].style.color = "#525559";
			}
			break;
		case 2 :
			font.style = ("background-image: url(../img/Texture_Fond/Fond_Marbre_Bleu.png);");
			for (i = bgAspect.length - 1; i >= 0; i--) {
				bgAspect[i].style.backgroundColor = "#3e5775";
			}
			for (i = bcAspect.length - 1; i >= 0; i--) {
				bcAspect[i].style.border= "1px solid #3e5775";
			}
			for (i = fontcolor.length - 1; i >= 0; i--) {
				fontcolor[i].style.color = "#3e5775";
			}
			break;

		case 3 :
			font.style = ("background-image: url(../img/Texture_Fond/Fond_Marbre_Rouge.png);");
			for (i = bgAspect.length - 1; i >= 0; i--) {
				bgAspect[i].style.backgroundColor = "#9e1f2e";
			}
			for (i = bcAspect.length - 1; i >= 0; i--) {
				bcAspect[i].style.border= "1px solid #9e1f2e";
			}
			for (i = fontcolor.length - 1; i >= 0; i--) {
				fontcolor[i].style.color = "#9e1f2e";
			}
			break;
		case 4 :
			font.style = ("background-image: url(../img/Texture_Fond/Fond_Marbre_Vert.png);");
			for (i = bgAspect.length - 1; i >= 0; i--) {
				bgAspect[i].style.backgroundColor = "#236b40";
			}
			for (i = bcAspect.length - 1; i >= 0; i--) {
				bcAspect[i].style.border = "1px solid #236b40";
			}
			for (i = fontcolor.length - 1; i >= 0; i--) {
				fontcolor[i].style.color = "#236b40";
			}
			break;
	}
};
