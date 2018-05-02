const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const escape = require('escape-html');
const path = require('path');

const timebomb = require('./src/timebomb.js');

var app = express();
app.use(cookieParser());
var urlencodedParser = bodyParser.urlencoded({extended: false});
var urlencodedJsonParser = bodyParser.json();

var games = {};
var players = {};

function uuidv4(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuidv4)}

app.get(
	'/',
	function (req, res) {
        if (!(req.cookies['uuid'] && players[req.cookies['uuid']])) {
            res.clearCookie('uuid');
            res.clearCookie('user_name');
        }
		res.status(200).sendFile(path.join(__dirname, "public/index.html"));
	}
);

app.post(
	'/signup', urlencodedJsonParser,
	function (req, res) {
		res.clearCookie('uuid');
		var player_uuid = uuidv4();
        var user_name = escape(req.body.user_name);
        console.log("Registering new player " + user_name + " " + player_uuid);
		players[player_uuid] = user_name;
		res.cookie('uuid', player_uuid);
        res.cookie('user_name', user_name);
		res.status(200).send('OK').end();
	}
);

app.get(
	'/games',
	function (req, res) {
        var gamelist = []
        for (uuid in games) {
            
            var players = [];
            for (var i = 0; i < games[uuid].game.players.length; i++)
                players.push(games[uuid].game.players[i].name)
            
            gamelist.push({
                id: uuid,
                name: games[uuid].name,
                creator: games[uuid].creator,
                date: games[uuid].date,
                nb_players: games[uuid].game.nb_players,
                players: players
            });
            
        }
		res.status(200).send(gamelist);
	}
);

app.post(
	'/create_game', urlencodedJsonParser,
	function (req, res) {
        if (req.cookies['uuid'] && players[req.cookies['uuid']]) {
            var game_id = uuidv4();
            var game = new timebomb.game(parseInt(escape(req.body.nb_players)));
            var creator = players[req.cookies['uuid']];
            game.add_player(creator);
            games[game_id] = {
                        "name": escape(req.body.game_name),
                        "creator": creator,
                        "date": new Date(),
                        "game": game
                    };
            res.status(200).send('OK').end();
        } else {
            res.clearCookie('uuid');
            res.clearCookie('user_name');
            res.status(401).send('KO').end();
        }
	}
);

app.get(
	'/join_game/:id',
	function (req, res) {
		if (req.cookies['uuid'] && players[req.cookies['uuid']]) {
			var player_id = req.cookies['uuid'];
			var game = games[req.params.id]['game'];
			if (game.players.filter(p => p.name === players[player_id])[0]) {
				res.redirect('/show_game/' + req.params.id);
			} else {
				game.add_player(players[player_id]);
				res.redirect('/show_game/' + req.params.id);
			}
		} else {
			res.send('Sign up : <form style = "display: inline;" action = "/signup" method = "POST"> <input type = "text" name = "user_name">'
				+ '<input type = "submit" value = "Submit"> </ form>')
		}
	}
)

app.get(
	'/show_game/:id',
	function (req, res) {
		var game_info = games[req.params.id];
		var game = game_info['game'];
		response = '<html><head><meta http-equiv="Refresh" content="1"></head><body>'
		response += 'Game ' + game_info.name + '. Created by ' + game_info.creator + ' on ' + game_info.date + '<br />';
		if ( game.players.length < game.nb_players ) {
			response += 'Players (' + game.players.length + '/' + game.nb_players + ') <br />';
			if (
				req.cookies['uuid'] && players[req.cookies['uuid']]
				&& !game.players.filter(p => p.name === players[req.cookies['uuid']])[0]
			) {
				response += '  <form style="display: inline;" action = "/join_game/'
				    + req.params.id + '"><input type="submit" value="Join"/></form><br />';
			} else {
				response += 'Waiting for more players';
			}
		} else {
			response += 'Current turn : ' + game.current_turn + '<br />';
			response += 'Safes : ' + game.revealed_safe + '<br />';
			response += 'Successes : ' + game.revealed_success + '<br />';
			if(game.allahuakbar)
				response += 'ALLAHUAKBAR!!! <br />';

			for (var i = 0; i < game.players.length; i++) {
				var p = game.players[i];
				if (p.name != players[req.cookies['uuid']]) {
					if (p.pince)
						response += "[*] ";
					else
						response += "[ ] ";

					response += p.name + " ";
					response += '<form style = "display: inline;" action = "/reveal" method = "POST">';
					response += '<input type = "hidden" name = "game_id" value = "' + req.params.id + '">';
					response += '<input type = "hidden" name = "target" value = "' + p.name + '">';
					for (var j = 0; j < p.hand.length; j++) {
						response += '<button type = "submit" name = "card" value = "' + j + '">' + j + '</button>';
					}
					response += '</form><br />';
				}
			}
			
			var req_player = game.players.filter(p => p.name === players[req.cookies['uuid']])[0];
			var player_hand = req_player.hand;
			response += 'You are ' + req_player.role + '<br />';
			if (req_player.pince)
				response += 'You have the pincer ! Choose a wire to cut !<br />';
			response += 'Your have : <br />';
			response += player_hand.filter(h => h.type === 'safe').length + ' safe cards <br />';
			response += player_hand.filter(h => h.type === 'success').length + ' success cards <br />';
			response += player_hand.filter(h => h.type === 'bomb').length + ' bomb cards <br />';
			
		}
		response += '</body></html>';
		res.send(response);
	}
)

app.post(
	'/reveal', urlencodedParser,
	function (req, res) {
		if (req.cookies['uuid'] && players[req.cookies['uuid']])
			games[escape(req.body.game_id)].game.reveal(players[req.cookies['uuid']], escape(req.body.target), escape(req.body.card));
		res.redirect('back');
	}
)

var server = app.listen(
	8001,
	function () {
		var host = server.address().address;
		var port = server.address().port;
		console.log('Time Bomb running at http://%s:%s', host, port);
	}
);

app.use(express.static(path.join(__dirname, '/public')));

app.use(function(err, req, res, next) {
	console.log(err);
	res.status(err.status || 500);
	res.send("Error\n");
});
