/** Module de gestion des sockets
 * @module SocketManagement
 * */
var structures = require('../../public/js/structures.js');
var utilities = require("../../public/js/utilities.js");
var pieces = require("../../public/js/pieces.js");

var g = require('./global.js');
var rooms = g.rooms;
var sessions = g.sessions;
var RoomInfo = g.RoomInfo;
var SessionInfo = g.SessionInfo;
var io = g.io;

module.exports = function(socket,a ,b) {
	var gameId = socket.handshake.query.gameId;
	//var initialBoard = socket.handshake.query.initialBoard;
	var status, room = {}, token = socket.handshake.query.token;
	var session = undefined, assigned = false;
	if(token)
	{
		session = sessions.find(function(val)
		{
			if(val.id == token)
				return val;
		});
	}
	if(token && session)
	{
		var roomSide = session.roomsSides[gameId];
		if(roomSide && roomSide.side)
		{
			room = rooms[gameId];
			if(room)
			{
				switch(roomSide.side)
				{
					case "white":
						room.white = socket.id;
						status = "white";
						break;
					case "black":
						room.black = socket.id;
						status = "black";
						break;
					case "spectator":
					default :
						room.specs.push(socket.id);
						status = "spectator";
						break;
				}
				socket.join(gameId);
				assigned = true;
			}
		}
	}else
	{
		do
		{
			token = utilities.generateRandomString("AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn0123456789", 64);
		}while(sessions.find(function(val){return val.id == token;}));
		session = new SessionInfo(token);
		sessions.push(session);
	}
	if(!assigned)
	{
		if(rooms[gameId] || io.nsps['/'].adapter.rooms[gameId])
		{
			socket.join(gameId);
			room = rooms[gameId];
			if(room)
			{
				if(room.white)
				{
					if(room.black)
					{
						status = "spectator";
						room.specs.push(socket.id);
						session.roomsSides[gameId] = {room : gameId, side : "spectator"};
					}else
					{
						room.black = socket.id;
						session.roomsSides[gameId] = {room : gameId, side : "black"};
						status = "black";
					}
				}else
				{
					room.white = socket.id;
					session.roomsSides[gameId] = {room : gameId, side : "white"};
					status = "white";
				}
			}

		}else
		{
			socket.join(gameId);
			room = new RoomInfo(gameId);
			room.id = gameId;
			room.white = socket.id;
			session.roomsSides[gameId] = {room : gameId, side : "white"};
			rooms[gameId] = room;
			status = "white";
		}
	}


	socket.emit('connectedRoom', {message : `Connecté à la partie ${gameId} en tant que ${status}`, board: room.board.toJsonState(), sessionToken:token, status:status});
	socket.broadcast.to(gameId).emit('otherConnected', `Un client s'est connecté en tant que ${status}`);
	console.log(`User ${socket.id} connected to room ${gameId} as ${status}`);



	//send move
	socket.on('send move', function(data){
		if(data && data.room && data.move && data.move.from && data.move.to)
		{
			let roomVar = rooms[data.room];
			if(roomVar)
			{
				var senderColor = (roomVar.white == socket.id) ? structures.PieceColor.white : (roomVar.black == socket.id) ? structures.PieceColor.black : undefined;
				if(senderColor && roomVar.board.turnColor == senderColor && roomVar.board.move(data.move.from, data.move.to))
				{
					if(roomVar.board.needPromotion)
					{
						roomVar.promotionMove = data.move;
						socket.emit('new move', {move: data.move, "senderColor": senderColor});
					}else
					{
						roomVar.promotionMove = undefined;
						io.in(roomVar.id).emit('new move', {move: data.move, "senderColor": senderColor});
					}

				}
			}
		}
	});
	socket.on('promote', function(data)
	{
		let promoted = false;
		if(data && data.type && data.room)
		{
			let room = rooms[data.room];
			if(room && room.board && room.board.needPromotion)
			{
				let color = (room.white === socket.id) ? structures.PieceColor.white : (room.black === socket.id) ? structures.PieceColor.black : undefined;
				if(room.board.turnColor === color)
				{
					switch(data.type)
					{
						case "Queen":
							promoted = utilities.proceedPromote(pieces.Queen, room.board);
							break;
						case "Bishop":
							promoted = utilities.proceedPromote(pieces.Bishop, room.board);
							break;
						case "Knight":
							promoted = utilities.proceedPromote(pieces.Knight, room.board);
							break;
						case "Rook":
							promoted = utilities.proceedPromote(pieces.Rook, room.board);
							break;
						default :
							promoted = false;
							break;
					}
					if(promoted)
					{
						io.in(room.id).emit('new promotion', {
							move: room.promotionMove,
							type: data.type,
							senderColor : color
						});
						room.promotionMove = undefined;
					}
				}
			}
		}
	});
	socket.on('chat-message', function(message){
		if(message && message.text && message.room && message.pseudo && message.pseudo !== "Systeme")
		{
			let roomVar = rooms[message.room];
			if(roomVar)
			{
				if(roomVar.white == socket.id || roomVar.black == socket.id)
				{
					io.in(roomVar.id).emit('message', message);
				}else
				{
					socket.emit('message', {text:'<strong><em>Les spectateurs ne peuvent pas parler sur le chat réservé aux joueurs</em></strong>', pseudo: 'Systeme', room : message.room});
				}
			}
		}
	});
};
