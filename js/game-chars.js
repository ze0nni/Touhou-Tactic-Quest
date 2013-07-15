(function () {

'use strick';

/**
 * Базовые характеристики игрового персонажа
 *
 * @param {url} адрес для загрузки данных
 */
window.characterBase = function(url, ready) {
	var cdata =$.ajax({
		url: url,
		dataType: 'text',
		cache: false,
		async: false
		});
	var cobj = eval('('+cdata.responseText+')');
	
	//копируем данные из cobj
	this.data = {};
	for (var x in cobj) {
		this.data[x] = cobj[x];
	}
	//извлекаем имя
	this.name = url.match(/(\w+?).js/)[1];
	//загрузка анимации	
	this.sprite = cobj.sprite;
	this.sprite.image = new Image();
	this.sprite.image.onload = ready;
	this.sprite.image.async = false;
	this.sprite.image.src = this.sprite.src;
	this.animations = {};
	var frame;
	for (var aname in cobj.animations) {
		this.animations[aname] = [];
		for (var x in cobj.animations[aname]) {
			frame = cobj.animations[aname][x];
			this.animations[aname].push({
				x:frame[1]*this.sprite.width,
				y:frame[0]*this.sprite.height,
				width:this.sprite.width,
				height:this.sprite.height});
		}
	}
}

/**
 * Игровой персонаж
 */
window.character = function(base, player, ready, nosprite) {
	this.base = base;
	this.player = player;

	this._inventory = []; //Инвентарь
	this._equip = []; //Надетые на персонажа предметы
	this._buffs =  []; //баффы и эффекты

	//иногда спрайты не нужны
	if (!nosprite) {
		//анимация по умолчанию
		this.idleAnimation = 'idle';
		this.idleScale = player.getTeam()==0?[1,1]:[-1,1];
		//Создаем спрайт
		//var img = new Image();
		//img.onload = (function() {
		this.viewGroup = new Kinetic.Group(
			
		);
		this.sprite = new Kinetic.Sprite({
			x:0,
			y:0,
			detectionType: 'pixel',
			image: base.sprite.image,
			animation: this.idleAnimation,
			animations: base.animations,
			frameRate: 7,
			offset: [base.sprite.width/2,base.sprite.height*Math.round(0.8)],
			scale: this.idleScale
		});
		var charVar = this;
		this.sprite.on('mouseover touchstart', function() {
			//todo: проверка что нет событий
			var cell;
			if (cell=game.map.cells[charVar.cell.y][charVar.cell.x]) {
				if (cell.char) cell.char.viewGroup.setAlpha(1);
			}
			if (cell=game.map.cells[charVar.cell.y+1][charVar.cell.x]) {
				if (cell.char) cell.char.viewGroup.setAlpha(0.4);
			}
		});
		this.sprite.on('mouseout touchend', function() {
			var cell;
			if (cell=game.map.cells[charVar.cell.y+1][charVar.cell.x]) {
				if (cell.char) cell.char.viewGroup.setAlpha(1);
			}
		});

		var hpWidth = Math.floor(game.map.tileSize/6);
		var hpHeight = Math.floor(game.map.tileSize/3);
		this.viewBar = new Kinetic.Rect({
			listening: false,
			x:Math.floor((game.map.tileSize/2.5)*this.idleScale[0]),
			y:0,
			width: hpWidth,
			height: hpHeight,
			offset: [hpWidth/2, 0],
			scale: [1, -1],
			stroke: '#121',
			strokeWidth:1,
			fill: '#fff',
		});
		this.viewHpBar = new Kinetic.Rect({
			listening: false,
			x:this.viewBar.getX(),
			y:this.viewBar.getY(),
			width: hpWidth/2,
			height: hpHeight/2,
			offset: this.viewBar.getOffset(),
			scale: [1,-1],
			stroke: '#121',
			strokeWidth:1,
			fill: '#e22',
		});
		this.viewExpBar = new Kinetic.Rect({
			listening: false,
			x:this.viewBar.getX()+hpWidth/2,
			y:this.viewBar.getY(),
			width: hpWidth/2,
			height: hpHeight/2,
			offset: this.viewBar.getOffset(),
			scale: [1,-1],
			stroke: '#121',
			strokeWidth:1,
			fill: '#22e',
		});
		
		this.viewLevelGroup = new Kinetic.Group({});
		game.loadImage('./i/numbers.png', false, (function(img){
			this.viewLevelBox = new Kinetic.Rect({
				x: this.viewBar.getX(),
				y: -this.viewBar.getHeight()-4,
				offset: [4,4],
				width:7,
				height:7,
				fill: '#000'
			});
			this.viewLevel = new Kinetic.Sprite({
				x: this.viewBar.getX(),
				y: -this.viewBar.getHeight()-4,
				offset: [3, 3],
				image: img,
				animation: 'def',
				animations: createTileAtimation({def:[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,1]]}, 5, 5),
				index: this.level+1,
			});
			this.viewLevelGroup.add(this.viewLevelBox);
			this.viewLevelGroup.add(this.viewLevel);
		}).bind(this));

		this.viewPower = [];
		for (var i=0; i<5; i++) {
			this.viewPower[i] = new Kinetic.Rect({
				listening: false,
				x: this.viewBar.getX()-this.viewBar.getWidth()*this.idleScale[0],
				y: this.viewBar.getY() - i*this.viewBar.getHeight()/5,
				width: this.viewBar.getWidth(),
				height: this.viewBar.getHeight()/5,
				offset: [this.viewBar.getWidth()/2, this.viewBar.getWidth()/2],
				fill: '#f80',
				stroke:'#000',
				strokeWidth:1
			});
		}


		this.viewGroup.add(this.sprite);
		this.viewGroup.add(this.viewBar);
		this.viewGroup.add(this.viewHpBar);
		this.viewGroup.add(this.viewExpBar);
		this.viewGroup.add(this.viewLevelGroup);
		for (var i in this.viewPower) 
			this.viewGroup.add(this.viewPower[i]);
		game.getLayer(1).add(this.viewGroup);
		this.sprite.saveImageData();
		this.sprite.start();
	}
	//}).bind(this);
	//img.src = base.sprite.src;
	//начитаем
	this.setPower(0);
	this.setLevel(0);
	this.setExp(0);
	if (ready) {
		ready.apply(this);
	}
}


/**
 * Делает копию текущего характера и помещает его на поле cells
 */
window.characterBase.cloneState  = function(char, cells) {
	if (!char) return undefined;
	var c = {};
	c.level = char.level;
	c.hp = char.hp;
	c.exp = char.exp;
	c.power = char.power;
	c.base = char.base;
	c.player = char.player;
	c.character = char.character;
	c.cells = cells;
	if (cells) {
		c.cell = cells[char.cell.y][char.cell.x];
		c.cell.char = c;
	}
	return c;
}


window.characterBase.changeCell = function(char, x, y) {
	if (char.cell) char.cell.char = undefined;
	char.cell = char.cells[y][x];
	char.cell.char = char;
}

character.prototype.setPower = function(pow) {
	pow = pow||0;
	pow = Math.min(5, pow);
	if (pow<0) pow = 0;
	if (pow>=3) game.tutor('3power');
	this.power = pow;
	for (var i in this.viewPower)
		if (i<=(pow-1))
			this.viewPower[i].show();
		else	
			this.viewPower[i].hide();

}

/**
 * Устанавливает характерисики персонажа соответственно его уровню в base
 */
character.prototype.setLevel = function(l) {
	l = Math.min(l, this.base.data.maxLevel-1);
	this.level = l;
	this.character = {};
	for (var x in this.base.data.character) {
		var c = this.base.data.character[x];
		//максимальная характерика
		this.character[x] = l>c.length-1?c[c.length-1]:c[l];
	}
	this.setHp(this.character.hp);
	//this.setExp(0);
	if (this.viewLevel) {
		this.viewLevel.setIndex(this.level+1);
	}
}

/**
 * Врзвращает true если персонаж достиг максимального вровня
 */
character.prototype.isMaxLevel = function() {
	return this.level < this.base.data.maxLevel;
}

character.prototype.doAnimation = function(aname) {
	if (!this.base.animations[aname] || !this.sprite) return;
	this.sprite.setAnimation(aname);
	var char = this;
	this.sprite.afterFrame(this.base.animations[aname].length-1, function() {
		char.sprite.setAnimation(char.idleAnimation);
	});
}

/**
 * Поиск ближайшей клетки по заданному условию
 */
character.prototype.getNearCell = function(cells, x, y, f) {
	var v = cells[y][x];
	var cell;
	if (cell=cells[y][x+1]) if (f(v, cell||{})) return cell;
	if (cell=cells[y][x-1]) if (f(v, cell||{})) return cell;
	if (cell=cells[y+1]) if (f(v, cell[x]||{})) return cell[x];
	if (cell=cells[y-1]) if (f(v, cell[x]||{})) return cell[x];
	return null;
}

/**
 * Поиск ближайшей клетки, waypoints который ниже
 */
character.prototype.getLoweCell = function(cells, x, y) {
	if (!cell) return undefined;
	return this.getNearCell(cell, x, y, function(a,b) { return ((a.waypoints||false) && (b.waypoints||false) && (a.waypoints > b.waypoints))});
}

/**
 * Поиск ближайшей клетки waypoints которой выше
 */
character.prototype.getHighCell = function(cell, x, y) {
	if (!cell) return undefined;
	return this.getNearCell(cell, x, y, function(a,b) { return ((a.waypoints||false) && (b.waypoints||false) && (a.waypoints < b.waypoints))});
}

character.prototype.searchWayRec = function(cells, x, y, steps) {
	var cell = cells[y][x];
	if (!cell) return;
	if (cell.char && cell.char!=this) {
		if (cell.char.player.getTeam() != this.player.getTeam()) {
			cell.waypoints = 'enemy';
		}
		return;
	}
	cell.act = mapCellCheck(this, cell);
	if (!cell.waypoints || cell.waypoints<steps)
		cell.waypoints = steps;
	steps--;
	if (steps==0) return;
	if (cell=cells[y][x+1]) this.searchWayRec(cells, x+1, y, steps);
	if (cell=cells[y][x-1]) this.searchWayRec(cells, x-1, y, steps);
	if (cell=cells[y+1]) this.searchWayRec(cells, x, y+1, steps);
	if (cell=cells[y-1]) this.searchWayRec(cells, x, y-1, steps);
}

character.prototype.searchWay = function(cells) {
	cells = cells||game.map.cells;
	for (var i in cells) {
		for (var j in cells[i]) {
			if (cells[i][j]) {
				cells[i][j].waypoints = undefined;
				cells[i][j].act=[];
			}
		}
	}
	//this.searchWayRec(cells, this.cell.x, this.cell.y, (this.getAttr('spd')||0)+1);
	this.searchWayRec(cells, this.cell.x, this.cell.y, (this.waypoints||0)+1);
}

/**
 * обновляет информацию на карте о передвижении персонажа
 */
character.prototype.changeCell = function(x, y, cells) {
	cells = cells||game.map.cells;
	if (this.cell && this.cell.x == x && this.cell.y == y) {
		return;
	}
	if (this.cell) this.cell.char = undefined;
	this.cell = cells[y][x];
	this.cell.char = this;
	// todo: notifi char move
}

character.prototype.setXY = function(x, y) {
	var pos = game.map.cellToLayer(x,y);
	//this.sprite.clearImageData();
	this.viewGroup.setPosition(pos.x, pos.y);
	
	this.changeCell(x, y);
	//this.sprite.move(pos.x, pos.y);
	this.sprite.saveImageData();
}

character.prototype.moveXY = function(x, y) {
	this.viewGroup.setPosition(x, y);
	//this.sprite.move(pos.x, pos.y);
	this.sprite.saveImageData();
}

/**
 * смерть персонажа.
 */
character.prototype.die = function() {
	//удаляем у игрока
	this.player.remove(this);
	//удаляем с поля
	this.cell.char = undefined;
	//красиво визуальные объекты
	if (this.viewGroup) {
		var char = this;
		this.viewGroup.setListening(false);
		this.viewGroup.transitionTo({
			x: this.viewGroup.getX(),
			y: this.viewGroup.getY()-game.map.tileSize*2,
			alpha: 0,
			scale: {x:1.3, y:1.3},
			duration: 1.5,
			callback: function() {
				game.getLayer(1).remove(char.viewGroup);
			}
		});
	}
	//просто событие
	if (this.doDie) this.doDie();
}

window.characterBase.getAttr = function(char, attr, def) {
	return	char.character[attr]||def;
}

character.prototype.getAttr = function(attr) {
	var value = this.character[attr];
	//todo модификаторы
	return value;
}

/**
 * проверка атаки
 *
 * @return {0||1||2} двойка в случае критической атаки
 */
character.prototype.tryAttack = function(person, attack) {
	type=type||'';
	//получем атаку
	var att = this.getAttr(attack);
	//получем защиту от атаки типа type или общую защиту
	var type = this.getAttr(attack+'type')||'kick';
	var def = person.getAttr('def'+type)||person.getAttr('def');
	//получаем случайные величины
	var atest = Math.floor(Math.random()*(att+1));
	var dtest = Math.floor(Math.random()*(def+1));
	if (atest>dtest) {
		//Если атака>0.8 а защита<0.2 то критическая атака
		return (atest/att>0.9 && dtest/def<0.1)?2:1;
	} else {
		return 0;
	}
}
/**
 * Проводим атаку без проверки на base.doAttackX
 *
 * @param {char} Атакующий персонаж
 * @param {person} Атакуемый персонаж
 * @param {а} атака 1 или 2
 * @param {fast} в этом случае изменение не происходит, но возвращается числовое значение эффективность хода
 */
window.characterBase.doAttackRaw = function(char, person, a, fast) {
	//Для альтернативной атаки отнимаем три энергии
	if (a==2) {
		char.power = char.power-3;
		if (char.setPower) char.setPower(char.power);
	}
	//проверяем результат атаки, для fast всегда 1
	var res = fast?1:char.tryAttack(person, 'att'+a);
	if (res==0) {
		//если атака не удалась
		if (!fast && char.doAnimation)
			char.doAnimation('attack'+a);
		if (!fast && person.doAnimation)
			person.doAnimation('block');
	} else {
		//если удалась — считаем повреждение
		var dmg = characterBase.getAttr(char, 'dmg'+a, [char.l, char.l]);
		//для быстрой атаки возвращаем эффективность
		if (fast) {
			var persMod = char.player.index==person.player.index?-1:1;
			if (person.hp<=dmg[1]) {
				//если персонаж умирает
				return dmg[1]/person.hp*characterBase.getExpAmmount(person)*2*persMod;
			} else {
				//если нет
				return dmg[1]/person.hp*characterBase.getExpAmmount(person)*persMod;
			}
		}
		//для обычной атаки расчитываем наносимое повреждение
		var dmgVal = Math.floor(Math.random() * (dmg[1]-dmg[0]+1) + dmg[0])*res;
		if (person.setDmg) {
			person.setDmg(char, dmgVal);
		} else {
			person.hp -=dmgVal;
		}
		if (!fast && char.doAnimation)
			char.doAnimation('attack'+a);
		if (!fast && person.doAnimation) 
			person.doAnimation('dmg');
	}	
}

/**
 * Проводит атаку и по возможности играет анимацию
 * 
 * @param {char} Атакующий персонаж
 * @param {person} Атакуемый персонаж
 * @param {а} атака 1 или 2
 * @param {fast} в этом случае изменение не происходит, но возвращается числовое значение эффективность хода
 */
window.characterBase.doAttack = function(char, person, a, fast) {
	//проверяем, есть ли перехватчик
	var attHandler;
	if (attHandler=char.base.data['doAttack'+a]) {
		console.log(char);
		return attHandler(char, person, fast);
	}
	return characterBase.doAttackRaw(char, person, a, fast);
}

window.characterBase.doAction = function(char, cell, act, fast) {
	var actHandler;
	if (actHandler=char.base.data.doAction) {
		return actHandler(char, cell, act, fast);
	}
	console.debug(char.base.name, 'have not doAction handler');
	return 0;
}

character.prototype.doAttack1 = function(person) {
	return characterBase.doAttack(this, person, 1);
}

character.prototype.doAttack2 = function(person) {
	return characterBase.doAttack(this, person, 2);
}

window.characterBase.getExpAmmount = function(char) {
	var l = char.level;
	return (characterBase.getAttr(char, 'hp', l) + 
	 	characterBase.getAttr(char, 'att1', l) +
	 	characterBase.getAttr(char, 'att2', l) +
	 	characterBase.getAttr(char, 'def', l) +
	 	characterBase.getAttr(char, 'dmg1', [l,l])[1] +
	 	characterBase.getAttr(char, 'dmg', [l,l])[1])/5
}

/**
 * Сколько очков опыта дают за убийство персонажа
 */
character.prototype.getExpAmmount = function() {
	return characterBase.getExpAmmount(this);
}
//
character.prototype.setHp = function(hp, dieCallback) {
	var diff = this.hp;
	this.hp = Math.min(hp, this.character.hp);
	diff=this.hp-diff;
	if (this.viewBar && this.viewHpBar) {
		//изменяем бар
		this.viewHpBar.setHeight(this.viewBar.getHeight()/this.character.hp*this.hp);
	}
	if (this.hp <= 0) {
		if (dieCallback) dieCallback();
		this.die();
	}
}

character.prototype.addHp = function(hp, dieCallback) {
	//добавляем анимацию
	var text = new Kinetic.Text({
		x:0,
		y:-game.map.tileSize/3,
		width: game.map.tileSize*3,
		offset: [game.map.tileSize*1.5, 15],
		height: 30,
		fontSize: 12,
		align: 'center',
		textFill: hp>0?'#0f0':'#f00',
		stroke: '#fff',
		strokeWidth: 1,
		text: hp.toString(),
	});
	this.viewGroup.add(text);
	text.transitionTo({
		x: 0,
		y: -game.map.tileSize*2,
		scale: {x:2, y:2},
		alpha: 0,
		duration: 1.5,
		callback: function() {
			text.parent.remove(text);
		}
	});
	this.setHp(this.hp+hp, dieCallback);
}

character.prototype.setDmg = function(from, dmg) {
	var exp = this.getExpAmmount();
	from.addExp(exp/this.getAttr('hp')*dmg);
	this.addHp(-dmg, function() {
		from.addExp(exp/5);
	});
}

character.prototype.levelUp = function() {
	this.setLevel(this.level+1);
	if (this.onLeveUp) this.onLeveUp();
}

character.prototype.setExp = function(exp) {
	this.exp = exp;
	while (this.exp >= this.character.exp) {
		this.exp -= this.character.exp;
		this.levelUp();
	}
	if (this.viewBar && this.viewExpBar) {
		//изменяем бар
		this.viewExpBar.setHeight(this.viewBar.getHeight()/this.character.exp*this.exp);
	}
}

character.prototype.addExp = function(exp) {
	this.setExp(this.exp+exp);
}

// ========================================================

window.characterBase.showCharInfoDialog = function(char) {
	var root = document.createElement('div');
	root.id="char-attributes";
	
	var img = document.createElement('img');
	root.appendChild(img);
	
	var table = document.createElement('table');
	root.appendChild(table);

	for (var attr in char.character) {
		var val = char.character[attr];
		table.appendChild(
			getAttrElement(attr, val));
	}

	iBox.show(root, char.base.data.title);
}

function getAttrElement(attr, val) {
	var element = document.createElement('tr');
	
	var name = document.createElement('td');
	name.innerHTML = format('attr_'+attr);
	name.className = "attr";

	var value = document.createElement('td');
	value.innerHTML = val;
	value.className = "value";

	element.appendChild(name);
	element.appendChild(value);

	return element;
}

})();
