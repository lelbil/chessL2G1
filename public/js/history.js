
var realLastMove = "", counter = 0, rowCounter = 1;


/**
 * reloadHistory - Rafraichit l'historique à partir d'un plateau
 *
 * @param {Board} board Plateau
 *
 */
var reloadHistory = function(board)
{
	if(board && board.moveHistory)
	{
		var tbody = document.getElementById("history-tbody");
		while (tbody.firstChild && tbody.firstChild.id!=='firsttd') {
			tbody.removeChild(tbody.firstChild);
		}
		counter = 0;
		rowCounter = 1;
		board.moveHistory.forEach(function(val){
			var td2ID = "td2" + counter;
			if (counter % 2 == 0) {
				tbody.insertAdjacentHTML('afterbegin', "<tr><th scope=\"row\">"+ (rowCounter) +"</th><td>"+ val +"</td><td id=\""+("td2" + (counter + 1))+"\"></td></tr>");
				rowCounter++;
			}
			else {
				var td = document.getElementById(td2ID);
				td.innerHTML = val;
			}
			counter++;
		});
		realLastMove = board.moveHistory[board.moveHistory.length - 1];
	}

};

/**
 * updateBrowserHistory - Ajoute le dernier coup à l'historique
 *
 * @param {Board} board Plateau
 *
 */
var updateBrowserHistory = function(board){
	if(!board.isBuffer)
	{
		var lastMove = board.moveHistory[board.moveHistory.length - 1];
		if(lastMove && lastMove != realLastMove){
			//console.log("this move has been made: " + lastMove);
			realLastMove = lastMove;
			var tbody = document.getElementById("history-tbody");
			var td2ID = "td2" + counter;
			if (counter % 2 == 0) {
				tbody.insertAdjacentHTML('afterbegin', "<tr><th scope=\"row\">"+ (rowCounter) +"</th><td>"+ lastMove +"</td><td id=\""+("td2" + (counter + 1))+"\"></td></tr>");
				rowCounter++;
			}
			else {
				var td = document.getElementById(td2ID);
				td.innerHTML = lastMove;
			}
			counter++;
		}
	}
};
