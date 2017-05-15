/*global io*/
/*global Board*/
/*global board:true*/
/*global utilities*/
/*global front*/
/*global pieces*/
/*global $*/
/*global reloadHistory*/

if(!utilities.gameIsLocal())
{
	front.insereMessage({text : "<em>Connexion au chat en cours...</em>"}, false);
	/** Variable globale de la connexion socket au serveur*/
	var socket = undefined;
	var token = utilities.getCookie("token");
	if(token != "")
	{
		socket = io.connect({query : `gameId=${utilities.getGameId()}&token=${token}`});
	}else
	{
		socket = io.connect({query : `gameId=${utilities.getGameId()}`});
	}
	// Gestion de l'évenement new move
	socket.on('new move',	function(data){
		if(data.senderColor != board.turnColor)
		{
			return;
		}
		if(board.move(utilities.toTileReference(data.move.from), utilities.toTileReference(data.move.to)))
			board.state = "";
		if(!board.needPromotion)
		{
			//front.showTable(board);
			//board.calculateStatus();
		}
	});
	// Gestion de l'évènement new promotion
	socket.on('new promotion', function(data)
	{
		if(data && data.move && data.move.from && data.move.to && data.type && data.senderColor)
		{
			if(data.senderColor === board.turnColor)
			{
				if(board.needPromotion || board.move(data.move.from, data.move.to)) //Si le mouvement vient de nous, board.needPromotion != undefined
				{
					if(board.needPromotion)
					{
						switch(data.type)
						{
							case "Queen":
								utilities.proceedPromote(pieces.Queen, board);
								break;
							case "Bishop":
								utilities.proceedPromote(pieces.Bishop, board);
								break;
							case "Knight":
								utilities.proceedPromote(pieces.Knight, board);
								break;
							case "Rook":
								utilities.proceedPromote(pieces.Rook, board);
								break;
						}
					}
				}
			}
		}
		board.state = "";
		front.showTable(board);
		board.calculateStatus();
	});
	//Gestion de l'évènement connected room
	socket.on("connectedRoom", function(data)
	{
		utilities.generatePopup("#afa", data.message, 5000);
		board = new Board(data.board);
		reloadHistory(board);
		front.showTable(board);
		if(data.status)
			front.status = data.status;
		if(data.sessionToken)
			utilities.setCookie("token", data.sessionToken, 24);
		$.ajax({
			url:"/getusername",
			dataType : "json",
			data : {token:utilities.getCookie("token")}
		}).done(function(data, status, xhr){
			if(data && data.pseudo)
			{
				front.username = data.pseudo;
				front.chatSetupComplete(true);
			}
			else
			{
				front.username = "";
				front.chatSetupComplete(false);
			}

		}).fail(function(err){
		});
	});
	socket.on("otherConnected", function(data)
	{
		utilities.generatePopup("#aaa", data, 2000);
	});
	socket.on('message', function(data) {
		if(data.pseudo === "Systeme")
			front.insereMessage(data, false);
		else
			front.insereMessage(data, true);
	});

}else
{
	reloadHistory(board);
}
