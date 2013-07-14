/**
 * Игровая карта
 */
function gameMap(p1, p2) {
	/**
	 * Размер тайла
	 */
	this.tileSize = 40;
	/**
	 * Клетки
	 */
	this.width=0;
	this.height=0;
	this.cells=[];
	this.players = [p1,p2];
	p1.index = 0;
	p2.index = 1;
	/**
	 * id игрока, который ходит
	 */
	this.playerTurn = -1;
	/**
	 * Состояние текущего ходa
	 */
	this.turnState = '';
	/**
	 * Выделенный персонаж
	 */
	this.selectionChar = undefined;
	this.selectionCharIndex = -1;
	/**
	 * очередь сыбытий
	 */
	this.eventQueue = [];
	this.moveSpeed = 10;


	game.onFrame = this.onFrame;

	this.getPlayers = function(n) {
		return this.players[n];
	}

	this.getActivePlayer = function() {
		return this.players[this.playerTurn];
	}
}

gameMap.prototype.isEventQueueEmpty = function() {
	return this.eventQueue.length==0;
}

gameMap.prototype.speedLim = function(a, s) {
	s = s||this.moveSpeed;
	if (a>0) return Math.max(a, s);
	if (a<0) return Math.min(a, -s);
	return 0;
}

gameMap.prototype.onFrame = function(frame) {
	//рисуем слой с эффектами
	//game.getLayer(2).draw();
	//если событий нет, то выходим
	if (game.map.eventQueue.length == 0) return;
	//обработка ближайшего события
	var e = game.map.eventQueue[0];
	var fin = false;
	var eHandler;
	if (eHandler=game.eventHandlers[e.type]) {
		fin = eHandler(e);
	} else {
		console.debug('wrong event', e.type);
	}

	//если fin, то удаляем событие
	if (fin && e.ready) e.ready();
	if (fin && game.map) game.map.eventQueue.shift();
}


//изменяем размер карты
gameMap.prototype.setSize = function(w, h) {
	this.clearCells();
	this.cells = [];
	this.spriteCells = [];
	this.width = w;
	this.height = h;
	for (var i=0; i<h; i++) {
		this.cells.push([]);
		this.spriteCells.push([]);
		for (var j=0; j<w; j++) {
			this.cells[i].push({
				type:'empty',	//тип поверхности
				char:undefined, //персонаж или какой-нибудь объект (например кмень или дерево)
				x:j,		//координаты
				y:i,
				//viewRect	//прямоугольник
				//viewGroup	//видимая группа
				//viewText	//видимый текст
			});
		}
	}
}

/**
 * Генерация препядствий на уже созданной карте
 */
gameMap.prototype.generateMap = function(seed) {
	var x, y;
	console.log('todo: generateMap');
	for (var i=0; i<this.height-1; i++) {
		x = Math.floor(Math.random()*this.width);
		y = Math.floor(Math.random()*this.height);
		if (this.cells[y][x] && !this.cells[y][x].char) {
			this.cells[y][x].viewGroup.removeChildren();
			this.cells[y][x] = undefined;
			game.loadImage('i/mapobjects.png', false, (function(img) {
				var pos = game.map.cellToLayer(this.x, this.y);
				var sprite = new Kinetic.Sprite({
					listening: false,
					x: pos.x,
					y: pos.y,
					offset: [20, 55],
					image: img,
					animation: 'idle',
					animations: createTileAtimation({idle:[[0,0],[0,1],[0,2]]}, 40, 60),
					index: Math.floor(Math.random()*3),
				});
				this.map.spriteCells[this.y][this.x] = sprite;
				game.getLayer(1).add(sprite);
			}).bind({x:x, y:y,map:this}));
		}
	}
	this.updateSpritesZOrder();
}

gameMap.prototype.clearCells = function() {
	for (var i in this.cells) {
		for (var j in this.cells[i]) {
			var cell = this.cells[i][j];
			if (cells.viewRect) {
				cells.viewRect.parent.remove(cells.viewRect);
			}
			delete this.cells[i][j];
		}
		delete this.cells[i];
	}
}

gameMap.prototype.showCells = function(parent) {
	parent = parent||game.getLayer(0);
	for (var i=0;i<this.width;i++) {
		for (j=0;j<this.height;j++){
			var group = new Kinetic.Group({
				x: i*this.tileSize+8,
				y: j*this.tileSize+32,
			});
			var rect = new Kinetic.Rect({
				width: this.tileSize,
				height: this.tileSize,
				stroke: game.ui.color.cellStroke,
				strokeWidth: 1,
				fill: game.ui.color.cell,
				alpha: 0.5,
			});
			this.cells[j][i].viewRect = rect;
			this.cells[j][i].viewGroup = group;
			//this.cells[j][i].viewText = text;
			
			group.add(rect);
			//group.add(text);
			parent.add(group);

			rect.cellX = i;
			rect.cellY = j;
			rect.on('click tap', function() {
				game.map.cellClick(this.cellX, this.cellY);
			});
		}
	}
	parent.draw();
}

gameMap.prototype.updateCellsView = function() {
	for (var i in this.cells) {
		for (var j in this.cells[i]) {
			var cell = this.cells[i][j];
			if (!cell) continue;
			if (cell.waypoints) {
				switch (cell.waypoints) {
				case 'enemy':
					if (cell.viewText)
						cell.viewText.setText('');
					cell.viewRect.setFill(game.ui.color.enemyCell);
					break;
				default:
					if (cell.viewText)
						cell.viewText.setText(cell.waypoints.toString());
					if (cell.char==this.selectionChar) {
						cell.viewRect.setFill(game.ui.color.ownCell);
					} else {
						cell.viewRect.setFill(game.ui.color.hoverCell);
					}
					break;
				}
			} else {
				if (cell.viewText)
					cell.viewText.setText('');
				cell.viewRect.setFill(game.ui.color.cell);
			}
		}
	}
}

gameMap.prototype.updateSpritesZOrder = function(col) {
	if (!col) {
	//обновляем все
	for (var i in this.cells) 
		for (var j in this.cells[i]) {
			if (cell=this.spriteCells[i][j]) {
				cell.moveToTop();
			}
			if (cell=this.cells[i][j]) {
				if (cell.char) cell.char.viewGroup.moveToTop();
			}
				
		}
	} else {
	//обновляем только столбец col
		for (var i in this.cells) {
			if (cell=this.cells[i][col]) {
				if (cell.char) cell.char.viewGroup.moveToTop();
			}
		}
	}
	
}

gameMap.prototype.cellToLayer = function(x, y) {
	return {
		x: (parseInt(x)+0.5)*this.tileSize+8,
		y: parseInt(y)*this.tileSize+64
	};
}

gameMap.prototype.characterClick = function(char) {
	if (!this.isEventQueueEmpty()) return;
	if (this.selectionChar) {
		this.cellClick(char.cell.x, char.cell.y);
		return;
		if (char==this.selectionChar) {
			char.doAnimation('attack2');
		} else {
			this.selectionChar.doAttack1(char);
		}
		this.selectionChar = undefined;
	} else {
		this.selectionChar = char;
		char.searchWay();
		this.updateCellsView();
		game.getLayer(0).draw();
	}
}

/**
 * Переход хода
 */
gameMap.prototype.nextTurn = function() {
	this.selectionCharIndex++;
	if (this.selectionCharIndex > this.turnOrder.length-1) {
		this.selectionCharIndex = 0;
		this.onEndTurn();
	}
	this.selectionChar = this.turnOrder[this.selectionCharIndex];
	this.playerTurn = this.selectionChar.player.index;
	

	this.selectionChar.waypoints = this.selectionChar.getAttr('spd')||0;
	this.selectionChar.eventpoints = 1;
	
	if (this.players[0].getCharsCount()==0) {
		this.players[1].win();
		game.events.doEndButtle(this.players[1]);
		return;
	}

	if (this.players[1].getCharsCount()==0) {
		this.players[0].win();
		game.events.doEndButtle(this.players[0]);
		return;
	}

	for (var i in this.players) 
		this.players[i].onNextTurn(this.getActivePlayer());
	
	this.selectionChar.searchWay();
	this.updateCellsView();
	game.getLayer(0).draw();
}

//очередь ходов персонажей
gameMap.prototype.turnOrder = [];

Math.sign = function(a) {
	if (a > 0) return 1;
	if (a < 0) return -1;
	return 0;
}

gameMap.prototype.updateTurnOrder = function() {
	this.turnOrder = [];
	var char;
	for (var i in game.map.players) {
		for (var j in game.map.players[i].chars)
			if (char=game.map.players[i].chars[j])
				this.turnOrder.push(char);
	}
	this.turnOrder.sort(function (a, b) {
		if (a.character.spd != b.character.spd) {
			//вначале по скорости
			return Math.sign(b.character.spd - a.character.spd);
		} else { 
			//потом по порядку игрока
			return Math.sign(a.player.index - b.player.index);
		}
	});
	//Если что-то сместится
	if (this.selectionChar) {
		var index = this.turnOrder.indexOf(this.selectionChar)
		if (index!=-1) this.selectionCharIndex = index;
	}
}

/**
 * Окончание цикла ходов
 */
gameMap.prototype.onEndTurn = function () {
	for (var i in this.players) {
		this.players[i].onEndTurn();
	}
}

gameMap.prototype.cellClick = function(x, y) {
	if (!this.isEventQueueEmpty()) return;
	//если не выбран персонаж
	if (!this.selectionChar) {
		var char;
		if (char=this.selectionChar = game.map.cells[y][x].char) {
			char.searchWay();
			this.updateCellsView();
			game.getLayer(0).draw();
		}
		return;
	}
	//доступные действия
	var act= mapCellCheck(this.selectionChar, this.cells[y][x]);
	act.push('turn');
	var actIsEmpty = true;
	for (var i in act) actIsEmpty = false;
	if (actIsEmpty) return;

	//Показываем диалог
	var pos = this.cellToLayer(x, y);
	pos.x += game.map.tileSize/4;
	pos.y -= game.map.tileSize*0.8;
	var menu = {};
	var itemHeight = game.ui.size.actMenuHeght;
	var itemWidth = game.ui.size.actMenuWidth;

	var menuGroup = new Kinetic.Group({
		x: pos.x,
		y: pos.y,
	});
	
	var bgRect = new Kinetic.Rect({
		x:-pos.x,
		y:-pos.y,
		width:game.kineticStage.getWidth(),
		height:game.kineticStage.getHeight(),
		fill:'#000',
		alpha: 0.3,
	});

	bgRect.on('click tap', function() {
		menuGroup.removeChildren();
		menuGroup.parent.remove(menuGroup);
		game.getLayer(2).draw();
	});
	menuGroup.add(bgRect);
	
	var arrowSize = game.map.tileSize/8;
	var menuArrowStroke= new Kinetic.RegularPolygon({
		listening: false,
		x:-(arrowSize/2),
		y: itemHeight/2,
		sides: 3,
		radius: arrowSize,
		rotation: -Math.PI/2,
		stroke: game.ui.color.hover,
		strokeWidth: 2,
	});
	menuGroup.add(menuArrowStroke);

	var menuRect = new Kinetic.Rect({
		listening: false,
		fill: game.ui.color.control,
		stroke: game.ui.color.hover,
		strokeWidth: 1,
		shadow: game.ui.shadow
	});
	menuGroup.add(menuRect);
	
	var menuArrow = new Kinetic.RegularPolygon({
		listening: false,
		x:-arrowSize/2+1,
		y: itemHeight/2,
		sides: 3,
		radius: arrowSize,
		rotation: -Math.PI/2,
		fill: game.ui.color.control,
	});
	menuArrow.menuItemIndex = 0;
	menuGroup.add(menuArrow);

	game.getLayer(2).add(menuGroup);
	
	var itemsCount=0;
	for (var i in act) {
		if (menu[act[i]]) continue;
		var item = {};
		item.viewRect = new Kinetic.Rect({
			y:itemsCount*itemHeight,
			width:itemWidth,
			height:itemHeight,
			fill:undefined,
		});
		item.viewRect.menuItemIndex = itemsCount;
		item.viewRect.on('mouseover touchstart', function() {
			this.setFill(game.ui.color.hover);
			if (this.menuItemIndex==menuArrow.menuItemIndex)
				menuArrow.setFill(game.ui.color.hover);

		});
		item.viewRect.on('mouseout touchend', function() {
			this.setFill('');
			if (this.menuItemIndex==menuArrow.menuItemIndex)
				menuArrow.setFill(game.ui.color.control);
		});
		var itemHandler;
		switch (act[i]) {
			case 'move':
				itemHandler = function() {
					game.map.doMoveChar(game.map.selectionChar, x, y);
					menuGroup.parent.remove(menuGroup);
					game.getLayer(2).draw();
				}
				break;
			case 'att1':
				itemHandler = function() {
					game.map.selectionChar.doAttack1(game.map.cells[y][x].char);
					menuGroup.removeChildren();
					menuGroup.parent.remove(menuGroup);
					game.map.selectionChar.eventpoints=
						(game.map.selectionChar.eventpoints||0)-1;
					if (game.map.selectionChar.eventpoints<=0)
						game.events.doNextTurn();
					game.getLayer(2).draw();
				}
				break;
			case 'att2':
				itemHandler = function() {
					game.map.selectionChar.doAttack2(game.map.cells[y][x].char);
					menuGroup.removeChildren();
					menuGroup.parent.remove(menuGroup);
					game.map.selectionChar.eventpoints=
						(game.map.selectionChar.eventpoints||0)-1;
					if (game.map.selectionChar.eventpoints<=0)
						game.events.doNextTurn();
					game.getLayer(2).draw();
				}
				break;
			case 'turn':
				itemHandler = function() {
					menuGroup.removeChildren();
					menuGroup.parent.remove(menuGroup);
					game.events.doNextTurn();
					game.getLayer(2).draw();
				}
				break;
			default:
				itemHandler = (function() {
					//todo
					game.map.selectionChar.base.data.doAction(
						game.map.selectionChar,
						game.map.cells[y][x],
						this);
					menuGroup.parent.remove(menuGroup);

					game.map.selectionChar.eventpoints=
						(game.map.selectionChar.eventpoints||0)-1;
					if (game.map.selectionChar.eventpoints<=0)
						game.events.doNextTurn();
				}).bind(act[i]);
				game.getLayer(2).draw();
				break;
		}
		item.viewRect.on('click tap', itemHandler);
		item.viewText = new Kinetic.Text({
			listening: false,
			x:4,
			y:itemsCount*itemHeight+itemHeight/4,
			width:itemWidth,
			height:itemHeight,
			text: format('act_'+act[i]),
			fontSize:itemHeight/2,
			textFill: '#fff'
		});
		menuGroup.add(item.viewRect);
		menuGroup.add(item.viewText);
		menu[act[i]] = item;
		itemsCount++;
	}

	var menuHeight = itemHeight*itemsCount;
	menuRect.setWidth(itemWidth);
	menuRect.setHeight(menuHeight);

	//высота
	if (pos.y+menuHeight>game.kineticStage.getHeight()) {
		var offset = game.kineticStage.getHeight() - (menuGroup.getY()+menuHeight);
		var itemsOffset = Math.floor(offset/itemHeight);
		offset = itemsOffset*itemHeight;
		menuGroup.setY(menuGroup.getY()+offset);
		bgRect.setY(bgRect.getY()-offset);
		menuArrow.setY(menuArrow.getY()-offset);
		menuArrowStroke.setY(menuArrow.getY());
		menuArrow.menuItemIndex = -itemsOffset;
	}
	game.getLayer(2).draw();
}

function mapCellCheck(char, cell) {
	var act = [];
	if (!char) return act;
	//передвижение
	if (!cell.char && cell.waypoints) act.push('move');
	//возможность атаки
	if (cell.char && cell.char != char && cell.char.player != char.player) {
		var charDist = Math.floor(Math.sqrt(Math.pow(cell.x-char.cell.x, 2) + Math.pow(cell.y-char.cell.y,2)));
		for (var x in [1,2]) {
			var dist = (characterGetAttr(char, 'dist'+(parseInt(x)+1),0))+1;
				if (dist>=charDist){
					if (x==0 || char.power>=3)
						act.push('att'+(parseInt(x)+1));	
				}
		}
	}
	//другие действия
	if (char.base.data.checkCell) {
		char.base.data.checkCell(char, cell, act);
	}
	return act;
}

gameMap.prototype.doMoveChar = function (char, x, y) {
	//промежуточная функция хода
	var moveStep = (function () {
		this.char.changeCell(this.x, this.y);
		game.map.updateSpritesZOrder(this.x);
	}); //bind({char, x, y});
	//финальная функция хода
	var moveFin = function () {
		this.char.changeCell(this.x, this.y);
		game.map.updateSpritesZOrder(this.x);
		this.char.searchWay();
		game.map.updateCellsView();
		game.getLayer(0).draw();
	};
	char = this.selectionChar;
	//уменьшаем число оставшихся ходов
	char.waypoints = char.cells[y][x].waypoints-1;
	var cx = char.cell.x;
	var cy = char.cell.y;
	var tx = x;
	var ty = y;
	//добавляем финальное событие
	var steps = [game.events.move(char, x, y, moveFin)];
	//ищем путь
	while (cx != tx || cy != ty) {
		var pos = char.getHighCell(game.map.cells, tx, ty);
		tx = pos.x;
		ty = pos.y;
		//добавляем промужеточне пути
		steps.unshift(game.events.move(char, tx, ty, moveStep));
	}
	//добавляем в очередь
	for (var i in steps) this.eventQueue.push(steps[i]);
}

/**
 * Функция возвращает упрощенное игровое поле 
 * для расчетов ходов ИИ
 */
gameMap.prototype.copyCellsState = function(cells, nowaypoints) {
	cells = cells || this.cells;
	var out = [];
	for (var i in cells) {
		out.push([]);
		for (var j in cells[i]) {
			var c = cells[i][j];
			if (!c) {
				out[i].push(undefined);
				continue;
			}
			out[i].push({
				waypoints: nowaypoints?undefined:c.waypoints,
				act: c.act,
				x:j,
				y:i
			});
			characterGetState(c.char, out);
		}
	}
	return out;
	
}

/**
 * дает оценку эффективности расположения игроков
 *
 * @return {
 *	player {	//оценка каждого игрока
 *		summ,	//общая оценка	
 *		pow,	//оценка силы=getExpAmmount/hpMax*hp
 *		pos	//оценка позиций
 *	}
 * }
 */
gameMap.prototype.calcStateEfficiency = function(cells) {
	cells = cells||this.cells;
	var cell, char, eff, f,
		out = {},
		chars = [];
	//перечисляем игроков
	for (var i in game.map.players) {
		out[i] = {	
			summ:0,
			pow:0,
			pos:0,
			normal:1
		};
	}
	//перечисляем все клетки и считаем эффективность по силе
	for (var i in cells) {
		for (var j in cells[i]) {
			if ((c=cells[i][j])&& (char=c.char)) {
				eff = out[char.player.index];
				//getExpAmmount() переделать на функцю
				f = characterGetExpAmmount(char)/char.character.hp*char.hp;
				eff.pow += f;
				chars.push({char: char, f:f});
			}
		}
	}
	//считаем эффективность положения
	var a,b,l;
	for (var i=0; i<chars.length-1; i++) {
		for (var j=i+1; j<chars.length; j++) {
			a = chars[i];
			b = chars[j];
			l = Math.abs(a.char.cell.x-b.char.cell.x) +
				Math.abs(a.char.cell.y-b.char.cell.y);
			if (a.char.player != b.char.player) {
				if (l<b.char.character.spd/2)
					out[a.char.player.index].pos+=a.f/(b.f/3)*l;
				if (l<a.char.character.spd/2)
					out[b.char.player.index].pos+=b.f/(b.f/3)*l;
			} else {
				out[a.char.player.index].pos+=(a.f+b.f)*l*3;
				out[b.char.player.index].pos+=(b.f+b.f)*l*3;
			}
		}
	}
	//нормализация
	var maxPow=0, maxPos=0;
	for (var i in out) {
		maxPow = Math.max(maxPow, out[i].pow);
		maxPos = Math.max(maxPos, out[i].pos);
	}
	for (var i in out) {
		out[i].pow = out[i].pow/maxPow;
		out[i].pos = out[i].pos/maxPos;
		out[i].summ = out[i].pow + out[i].pos/2;
	}
	//console.log(out[0],out[1]);
	return out;

}
