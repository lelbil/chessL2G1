"use strict";

/*global front ai reloadHistory*/

(function(){
	var root = this;
	var previous_utilities = root.utilities;

	/** Objet stockant des fonctions utilitaires*/
	var utilities = {
		/** Liste des popups*/
		popupList : [],
		/** toCoord - Convertit la référence (ou les coordonées) en coordonnées à partir du coin inférieur gauche et les vérifie
		 * @param {(string|{x:number,y:number})} val Coordonnées ou référence
		 * @returns {?{x:number,y:number}} Coordonnées*/
		toCoord : function(val)
		{
			if(val)
			{
				if(val.hasOwnProperty("x") && val.hasOwnProperty("y")) //Si la position passée est en coordonées x,y
				{
					if (val.x < 0 || val.x > 7 || val.y < 0 || val.y > 7) return undefined; //-> position non existante
					return { x:val.x, y:val.y};
				}else if(typeof val === 'string') //Si la position est en représentation classique de case de plateau
				{
					let p = val.toLowerCase();
					if(p.length == 2)
						if(p[0] >= 'a' && p[0] <= 'h')
							if(p[1] >= 1 && p[1] <= 8)
							{
								return { x:(p.charCodeAt(0)- 'a'.charCodeAt(0)), y:p[1]-'1'};
							}
				}
			}
			return undefined;
		},
		/** toTileReference - Convertit les coordonnées (ou la référence) en référence et la vérifie
		 * @param {(string|{x:number,y:number})} pos Coordonnées ou la référence
		 * @return {?string} Référence
		*/
		toTileReference : function(pos)
		{
			if(pos.hasOwnProperty("x") && pos.hasOwnProperty("y")) //Si la position passée est en coordonées x,y
			{
				return String.fromCharCode(65+pos.x).concat((pos.y+1).toString());
			}else if(typeof pos === 'string') //Si la position est en représentation classique de case de plateau
			{
				let p = pos.toLowerCase();
				if(p.length == 2)
					if(p[0] >= 'a' && p[0] <= 'h')
						if(p[1] >= 1 && p[1] <= 8)
						{
							return p;
						}
			}
			return "";
		},
		/** toMoveHistory - Agrège les enregistrements de mouvements pour en faire une chaine formatée
		 * @param {string} castleRec Enregistrement roque
		 * @param {string} oldPosRec Enregistrement position initiale
		 * @param {string} newPosRec Enregistrement position finale
		 * @param {string} pieceRec Enregistrement piece bougée
		 * @param {string} enPassantRec Enregistrement de prise en passant
		 * @param {string} captureRec Enregistrement de la pièce capturée
		 * @param {string} promoteRec Enregistrement de la promotion
		 * @returns {string} Enregistrement formaté
		*/
		toMoveHistory : function(castleRec, oldPosRec, newPosRec, pieceRec, enPassantRec, captureRec, promoteRec)
		{
			if(castleRec)
				return castleRec; //Si c'est un roque, on renvoi sa notation

			var str = "";

			str+=pieceRec+oldPosRec; //La piece et sa position initiale...
			if(captureRec && enPassantRec)
				str+="x"; //Si c'est une prise en passant, on ne met que un x
			else if(captureRec)
				str+="x"+captureRec; //Sinon on met aussi le type de pièce capturé
			str+=newPosRec; //On met la position d'arrivée
			if(enPassantRec)
				str+=enPassantRec; //Si c'est une prise en passant, on le signale
			if(promoteRec)
				str+=promoteRec; //Si c'est un promotion, on signale le type d'arrivée

			return str;
		},
		/** download - Permet de télécharger un fichier sur l'ordinateur
		 * @param {string} strData Données à télécharger
		 * @param {string} strFileName Nom du fichier
		 * @param {string} strMimeType Type MIME du fichier
		 * @returns {} Confirmation de réussite
		*/
		download : function(strData, strFileName, strMimeType) { //Source : http://stackoverflow.com/questions/16376161/javascript-set-file-in-download
			var D = document,	a = D.createElement("a");
			strMimeType= strMimeType || "application/octet-stream";


			if (navigator.msSaveBlob) { // IE10
				return navigator.msSaveBlob(new Blob([strData], {type: strMimeType}), strFileName);
			} /* end if(navigator.msSaveBlob) */


			if ('download' in a) { //html5 A[download]
				a.href = "data:" + strMimeType + "," + encodeURIComponent(strData);
				a.setAttribute("download", strFileName);
				D.body.appendChild(a);
				setTimeout(function() {
					a.click();
					D.body.removeChild(a);
				}, 1);
				return true;
			} /* end if('download' in a) */


			//do iframe dataURL download (old ch+FF):
			var f = D.createElement("iframe");
			D.body.appendChild(f);
			f.src = "data:" +  strMimeType   + "," + encodeURIComponent(strData);

			setTimeout(function() {
				D.body.removeChild(f);
			}, 333);
			return true;
		}, /* end download() */
		/** load - Permet de charger un fichier présent sur l'ordinateur et l'appliquer sur un plateau
		 * @param {FileList} files Fichier à charger
		 * @param {Board} board Plateau à modifier
		 */
		load : function(files, board)
		{
			if(board && utilities.gameIsLocal())
			{
				if(files && files.constructor== FileList && files.length > 0)
				{
					var fr = new FileReader();
					fr.readAsText(files[0]);
					fr.onload = function (evt) {
						console.log("File loaded");
						board.fromJsonState(evt.target.result);
						front.showTable(board);
						reloadHistory(board);
						if(utilities.getGameId() === "IA")
						{
							let selcolor = document.getElementById("colorselect");
							if(selcolor && selcolor.value)
							{
								ai.color = selcolor.value;
							}
							if(board.turnColor == ai.color)
							{
								ai.nextMoveAsync(board);
							}
						}
					};
					fr.onerror = function (evt) {
						console.log("error reading file");
					};
				}
			}
		},
		/** getGameId - Permet d'obtenir l'id de partie
		 * @memberof utilities
		 * @returns {?string} Id de partie
		 */
		getGameId()
		{
			let arr = window.location.toString().split('/');
			if(arr.length > 0)
				return arr[arr.length-1];
		},
		/** gameIsLocal - La partie est elle locale ?
		 * @memberof utilities
		 * @returns {bool} true si la partie est locale
		 */
		gameIsLocal()
		{
			if(typeof window !== 'undefined')
			{
				let arr = window.location.toString().split('/');
				return arr.findIndex(function(val){return val == 'local';}) !== -1;
			}else
			{
				return true;
			}

		},
		/** proceedPromote - Procède à la promotion du pion en attente de promotion
		 * @memberof utilities
		 * @param {(Queen|Knight|Bishop|Rook)} cons Constructeur de la classe de pièce en laquelle on promeut le pion
		 * @param {Board} board plateau
		 * @return {bool} true si tout s'est bien passé
		*/
		proceedPromote(cons, board)
		{
			if(board && board.needPromotion && board.needPromotion.promote)
			{
				if(cons.name === "Queen" || cons.name === "Rook" || cons.name === "Knight" || cons.name === "Bishop")
				{
					if(board.needPromotion.promote(cons, board))
					{
						board.needPromotion = undefined;
						if(typeof front !== 'undefined')
						{
							var buttons = document.getElementById("promoteButtons");
							if(buttons)
								buttons.style.display = "none";
						}
						return true;
					}
				}
			}
			return false;
		},
		/** generateRandomString - Génère une chaine aléatoire à partir d'un alphabet
		 * @memberof utilities
		 * @param {string} charset Alphabet à utiliser
		 * @param {number} length Longueur de la chaine à générer
		 * @returns {string} Chaine générée
		 * */
		generateRandomString(charset, length)
		{
			if(charset && typeof charset === 'string' && length)
			{
				var arr = [];
				for(var i=0; i < length; i++)
				{
					arr.push(charset.charAt(Math.random()*charset.length));
				}
				return arr.join("");
			}
		},
		/** setCookie - Attribue à une cookie une valeur
		 * @memberof utilities
		 * @param {string} cname Nom du cookie
		 * @param {string} cvalue Valeur du cookie
		 * @param {number} expHours Nombre d'heures avant expiration
		 */
		setCookie(cname, cvalue, expHours) {
			var expire = "";
			if(expHours)
			{
				let d = new Date();
				d.setTime(d.getTime() + expHours * 60 * 60 * 1000);
				expire = "expire=" + d.toUTCString()+";";
			}

			document.cookie = cname + "=" + cvalue + ";" + expire;
		},
		/** getCookie - récupère la valeur d'un cookie
		 * @memberof utilities
		 * @param {string} cname Nom du cookie
		 * @returns {string} Valeur du cookie
		 */
		getCookie(cname) {
			if(typeof document !== 'undefined')
			{
				var name = cname + "=";
				var decodedCookie = decodeURIComponent(document.cookie);
				var ca = decodedCookie.split(';');
				for(var i = 0; i <ca.length; i++) {
					var c = ca[i];
					while (c.charAt(0) == ' ') {
						c = c.substring(1);
					}
					if (c.indexOf(name) == 0) {
						return c.substring(name.length, c.length);
					}
				}
			}
			return "";
		},

  /**
   * generatePopup - Génère un popup
		* @memberof utilities
   *
   * @param {string}  [color=#aaa]        Couleur du fond du popup
   * @param {string}  [inner=]            Contenu HTML du popup
   * @param {number}  [duration=3000]     Durée du popup en millisecondes
   * @param {boolean} [cancellable=true]  Le popup est-il annulable ?
   * @param {function}    [cancellableCallback] En cas d'annulation, la fonction a appeler
   *
   * @returns {Object} Popup générée
   */
		generatePopup(color="#aaa", inner="", duration=3000, cancellable=true, cancellableCallback)
		{
			if(typeof require === 'undefined')
			{
				var popups =document.getElementById("popups");
				if(popups)
				{
					var popup = document.createElement("div");
					popup.remove = function(){
						let idx = utilities.popupList.indexOf(popup);
						if(idx !== -1)
							utilities.popupList.splice(idx, 1);
						if(utilities.popupList.length === 0)
						{
							popups.style.pointerEvents = "";
						}
						popups.removeChild(popup);
					};
					let p = document.createElement("div");
					popup.className = "popup alert-dismissible";
					popup.style.backgroundColor = color;
					if(popup.style.backgroundColor.length == 0)
						popup.style.backgroundColor = "#aaa";
					p.innerHTML = inner;
					popup.appendChild(p);
					popup.updateContent =function(value){
						p.innerHTML = value;
					};
					popups.style.pointerEvents = "auto";
					utilities.popupList.push(popup);
					if(duration < 0)
					{
						popup.style.animationDuration = "0.4s";
						popup.style.animationName = "fadein";
						if(cancellable)
						{
							let cancelButton = document.createElement('button');
							cancelButton.type="button";
							cancelButton.className="close";
							cancelButton.dataDismiss="alert";
							cancelButton.ariaLabel="Close";
							cancelButton.innerHTML = '<span aria-hidden="true" style="font-size:60px;">&times;</span>';
							cancelButton.style.float = "right";
							//cancelButton.className+=" btn btn-default";
							cancelButton.addEventListener("click", function(){
								if(cancellableCallback)
									cancellableCallback();
								popup.remove();
							});
							popup.appendChild(cancelButton);
						}
					}else
					{
						popup.dismiss = popup.click;
						popup.style.animationDuration = (duration/1000) + "s";
						var to = setTimeout(function(){
							let idx = utilities.popupList.indexOf(popup);
							if(idx !== -1)
								utilities.popupList.splice(idx, 1);
							if(utilities.popupList.length === 0)
							{
								popups.style.pointerEvents = "";
							}
							popups.removeChild(popup);
						}, duration);
						popup.addEventListener("click", function(){
							clearTimeout(to);
							popup.remove();
						});
					}

					popups.insertBefore(popup, popups.firstChild);
					let h = window.getComputedStyle(p).getPropertyValue("height");
					popup.style.height = (parseFloat(h) + 20) + "px";
				}
				return popup;
			}
		}
	};





	utilities.noConflict = function()
	{
		root.utilities = previous_utilities;
		return utilities;
	};

	if(typeof exports !== 'undefined')
	{
		if(typeof module !== 'undefined' && module.exports!== 'undefined')
		{
			exports = module.exports = utilities;
		}
		exports.utilities = utilities;
	}else
	{
		root.utilities = utilities;
	}
}).call(this);

Array.prototype.removeIf = function(callback) {
	var i = this.length;
	while (i--) {
		if (callback(this[i], i)) {
			this.splice(i, 1);
		}
	}
};
