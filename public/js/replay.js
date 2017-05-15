/*global socket board:true Board utilities pieces front structures counter:true*/
if(!utilities.gameIsLocal())
{
	socket.on('connectedRoom', function(uselessData){
		if (!utilities.gameIsLocal() && board) {
			if (!window.board.calculateStatus()) {
				if (confirm("Est-ce que vous voulez revoir la partie ?")) {
					var rep = prompt("la vitesse des déplacements en secondes? (entre 1 et 15)");
					/*if (!isNaN(rep) && rep <= 15 && rep >= 1) {
					console.log("this is the chosen one: " + rep);
					} else {*/
					if (isNaN(rep) && rep < 1 || rep > 15) {
						alert("la valeur entrée n'était pas valide, les déplacements vont être faites toutes les 2 secondes");
						rep = 2;
					}
					var toBePlayed = board.moveHistory;
					document.getElementById("history-tbody").innerHTML = "<tr id=\"firsttd\"></tr>";
					counter=0;

					board = new Board();
					//afficher le board
					front.showTable(window.board);
					//set a time interval upon which make a new move everytime according to the toBePlayed array
					var interval = setInterval(function(){
						var moveToBeMade = toBePlayed.shift();
						//console.log(moveToBeMade);
						if (!moveToBeMade) {
							clearInterval(interval);
							return;
						}
						var ancienne = undefined;
						var nouvelle = undefined;
						var promoteTo = undefined;

						//parsing
						if(moveToBeMade == "O-O")
						{
							let row = (board.turnColor === structures.PieceColor.white) ? "1" : "8";
							ancienne = "E"+row;
							nouvelle = "G"+row;
						}else if(moveToBeMade == "O-O-O")
						{
							let row = (board.turnColor === structures.PieceColor.white) ? "1" : "8";
							ancienne = "E"+row;
							nouvelle = "C"+row;
						}else if(moveToBeMade[moveToBeMade.length-1]=='p' && moveToBeMade[moveToBeMade.length-2]=='e')
						{
							//Prise en passant
							ancienne = moveToBeMade[1] + moveToBeMade[2];
							nouvelle = moveToBeMade[4] + moveToBeMade[5];
						}else
						{
							ancienne = moveToBeMade[1]+moveToBeMade[2];
							if(moveToBeMade[3] == 'x')
							{
								//Capture
								nouvelle = moveToBeMade[5]+moveToBeMade[6];
							}else {
								nouvelle = moveToBeMade[3]+moveToBeMade[4];
							}
							if (isNaN(moveToBeMade[moveToBeMade.length-1]))
							{
								//Promotion
								promoteTo = moveToBeMade[moveToBeMade.length-1];
							}

						}

						//maintenant je dois trouver l'ancienne et la nouvelle position
						//var ancienne = moveToBeMade[1] + moveToBeMade[2];
						/*if (isNaN(moveToBeMade.slice(-1))) {
						console.log("promoteTo will be: " + moveToBeMade.slice(-1));
						var promoteTo = moveToBeMade.slice(-1);
						moveToBeMade = moveToBeMade.slice(0, -1);
					}*/
					//var nouvelle = moveToBeMade[moveToBeMade.length - 2] + moveToBeMade[moveToBeMade.length - 1];
						console.log("from : " + ancienne + " to : " + nouvelle + " prom : " + promoteTo);
						if (!window.board.move(ancienne, nouvelle)) console.log("move wasn't made, move function returned false");
						if (window.board.needPromotion && promoteTo) {
						//console.log("the board needs Promotion while promoto is: " + promoteTo);
						//var newPiece;
							switch(promoteTo){
								case 'Q': utilities.proceedPromote(pieces.Queen , board); break;
								case 'R': utilities.proceedPromote(pieces.Rook , board); break;
								case 'B': utilities.proceedPromote(pieces.Bishop , board); break;
								case 'N': utilities.proceedPromote(pieces.Knight , board); break;
								default: console.log("il y a un problème au niveau de la promotion: "+ promoteTo);
							}
						//window.board.afterPromote();
						}
					}, rep * 1000);
				//setTimeout(function() {clearInterval(interval)}, 9000);
					if (toBePlayed.length == 0) {
						clearInterval(interval);
					}
				}
			}
			else {
		//console.log("partie est toujours en jeu");
			}
		}
		else {
		//console.log("window.board is undefined or game is local");
		}
	});

}
