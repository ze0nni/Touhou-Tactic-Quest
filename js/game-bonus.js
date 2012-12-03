if (typeof game==='undefined') {
	game = {};
}

game.bonus = {};

game.bonus.healing = {
	price: 200,
	select: function() {
		for (var x in game.savesSlot.chars) {
			var char = game.savesSlot.chars[x];
			char.hp = char.character.hp;
			return true;
		}
	}
};

function gameBonusAddChar(char) {
	var base;
	if (!(base=game.characters[char])) {
		alert('bad character ' + char);
		return false;
	}
	if (game.savesSlot.chars.length>=6) {
		alert(format('to big party'));
		return false;
	}
	game.savesSlot.chars.push(
		new character(base, undefined, undefined, true)
	);
	return true;
}

game.bonus.chen =  {
	price: 300,
	select: function() {
		return gameBonusAddChar('chen');
	}
};

game.bonus.yuyuko = {
	price: 1500,
	select: function() {
		return gameBonusAddChar('yuyuko');
	}
}


game.bonus.marisa = {
	price: 1500,
	select: function() {
		return gameBonusAddChar('marisa');
	}
}

game.bonus.ran = {
	price: 700,
	select: function() {
		return gameBonusAddChar('ran');
	}
}
