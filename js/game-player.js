/**
 * Игрок
 */

function player(team) {
	this.getTeam = function() {
		return team;
	}

	this.chars = [];
	this.activeCharIndex = -1;
}

humanPlayer = player;

/**
 * Добавляем персонажа 
 */
player.prototype.add = function(char) {
	if (this.chars.indexOf(char)==-1) {
		this.chars.push(char);
		char.player=this;
		game.map.updateTurnOrder();
	}
}

/**
 * Удаляем персонажа
 */
player.prototype.remove = function(char) {
	var index = this.chars.indexOf(char);
	if (index!=-1) {
		delete this.chars[index];
		char.player = undefined;
		game.map.updateTurnOrder();
	}
}

/**
 * Получаем текущего игрового персонажа
 */
player.prototype.getActiveChar = function() {
	return this.chars[this.activeCharIndex];
}

/**
 * Получаем следующего игрового персонажа
 */
player.prototype.getNextChar = function() {
	if (this.getCharsCount()==0) return undefined;
	var i = this.activeCharIndex;
	var char;
	do {
		this.activeCharIndex++;
		if (this.activeCharIndex>this.chars.length)
			this.activeCharIndex=0;
		if (char=this.chars[this.activeCharIndex])
			return char;
	} while(i != this.activeCharIndex);
	return undefined;
}

player.prototype.getCharsCount = function() {
	var out=0;
	for (var i in this.chars) {
		if (this.chars[i]) out++;
	}
	return out;
}

//
player.prototype.win = function() {
	if (this.onWin) this.onWin();
}

player.prototype.onWin = undefined;

/**
 * Возврощает порядок ходов персонажей
 */
player.prototype.getCharsOrder = function() {

}

/**
 * Событие вызывается при переходе хода
 */
player.prototype.onNextTurn = function(p) {
}

/**
 * Функция вызывается при окончании одного цикла ходов
 */
player.prototype.onEndTurn = function() {
	for (var x in this.chars) {
		this.chars[x].setPower(this.chars[x].power+1);
	}
}
/**
 * Компьютер
 */
function cpuPlayer(team) {
	this.getTeam = function() {
		return team;
	}
}

cpuPlayer.prototype = new player();

cpuPlayer.prototype.onNextTurn = function(p) {
	if (p==this) {
		game.events.doDelay();
		game.events.doCpuTurn(this);
	}
}
