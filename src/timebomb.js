function game(nb_players) {

	// RULES
	this.card_distribution = function(nb_players) {
		switch (nb_players) {
			case 4: return {'safe': 15, 'success': 4, 'bomb': 1};
			case 5: return {'safe': 19, 'success': 5, 'bomb': 1};
			case 6: return {'safe': 23, 'success': 6, 'bomb': 1};
			case 7: return {'safe': 27, 'success': 7, 'bomb': 1};
			case 8: return {'safe': 31, 'success': 8, 'bomb': 1};
		}
	}
	
	this.roles = function(nb_players) {
		switch (nb_players) {
			case 4:
			case 5: return {'good': 3, 'bad': 2};
			case 6: return {'good': 4, 'bad': 2};
			case 7:
			case 8: return {'good': 5, 'bad': 3};
		}
	}

	// PLAYERS
	this.nb_players = nb_players;
	this.free_player_slots = nb_players;
	this.roles_left = [];
	var roles_distr = this.roles(nb_players);
	for (var i = 0; i < roles_distr['good']; i++)
		this.roles_left.push('good');
	for (var i = 0; i < roles_distr['bad']; i++)
		this.roles_left.push('bad');
	this.players = [];

	// CARDS
	this.current_deck = [];
	var distr = this.card_distribution(nb_players);
	for (var i = 0; i < distr['safe']; i++)
		this.current_deck.push({'type': 'safe', 'revealed': false});
	for (var i = 0; i < distr['success']; i++)
		this.current_deck.push({'type': 'success', 'revealed': false});
	for (var i = 0; i < distr['bomb']; i++)
		this.current_deck.push({'type': 'bomb', 'revealed': false});

	// GAME LOGIC
	this.allahuakbar = 0;
	this.revealed_safe = 0;
	this.revealed_success = 0;
	this.current_turn = 0;
	this.revealed_this_turn = 0;
	this.game_inited = false;

	this.add_player = function(name) {
		if (!this.free_player_slots) {
			if (!this.game_inited) {
				this.init();
				this.game_inited = true;
			}
			return -1;
		}
		var role = this.roles_left.splice(Math.floor(Math.random()*this.roles_left.length),1)[0];
		this.players.push({'name': name, 'role': role, 'hand': [], 'pince': false});
		this.free_player_slots--;
		if (!this.free_player_slots) {
			if (!this.game_inited) {
				this.init();
				this.game_inited = true;
			}
		}
	}

	// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
	this.shuffle_deck = function () {
		var j, x, i;
		var a = this.current_deck;

		for (i = a.length - 1; i > 0; i--) {
	        	j = Math.floor(Math.random() * (i + 1));
	        	x = a[i];
	        	a[i] = a[j];
	        	a[j] = x;
	    	}
	}


	this.deal = function() {
		this.shuffle_deck();
		var card_num = this.current_deck.length / this.nb_players;
		for (var j = 0; j < this.players.length; j++) {
			for (var i = 0; i < card_num; i++) {
				var card = this.current_deck.splice(Math.floor(Math.random()*this.current_deck.length),1)[0];
				this.players[j]['hand'].push(card);
			}
		}
	}

	this.undeal = function() {
		for (var j = 0; j < this.players.length; j++) {
			var hand_length = this.players[j]['hand'].length;
			for (var i = 0; i < hand_length; i++) {
				var card = this.players[j]['hand'].splice(0,1)[0];
				this.current_deck.push(card);
			}
		}
	}

	this.init = function() {
		if (this.nb_players == this.players.length) {
			this.players[Math.floor(Math.random()*this.players.length)]['pince'] = true;
			this.deal();
			this.current_turn++;
		}
	}

	// BASICALLY THE STEP FUNCTION SINCE ONLY THE PLAYER WITH A PINCE CAN ADVANCE THE GAME
	this.reveal = function(source_name, target_name, card_id) {

		if (source_name === target_name)
			return 0;

		var source = this.players.filter(p => p.name === source_name)[0];
		
		if (this.allahuakbar)
			return 0;

		if (source['pince'] && this.revealed_this_turn < this.nb_players) {

			var target = this.players.filter(p => p.name === target_name)[0];

			source['pince'] = false;
			target['pince'] = true;
			var card = target['hand'].splice(card_id,1)[0];
			card['revealed'] = true;
			this.revealed_this_turn++;
			switch (card['type']) {
				case 'safe':
					this.revealed_safe++;
					break;
				case 'success':
					this.revealed_success++;
					break;
				case 'bomb':
					this.allahuakbar++;
					return 0;
			}

		}

		if (this.revealed_this_turn == this.nb_players) {
			this.undeal();
			this.current_turn++;
			this.deal();
			this.revealed_this_turn = 0;
			if (this.current_turn > 4) {
				this.allahuakbar++;
			}
		}
	}

}

exports.game = game;
