/**
 * Обработчики игровых событий
 */

if (typeof game==='undefined') {
	game = {};
}

if (typeof(game.events)=='undefined') {
	game.events = {};
}

if (typeof(game.eventHandlers) =='undefined') {
	game.eventHandlers= {};
}

/**
 * Пауза в несколько фреймов
 */
game.events.doDelay = function(frames) {
	game.map.eventQueue.push({
		type: 'delay',
		frames: frames||17
	});
}

game.eventHandlers.delay = function(e) {
	e.frames--;
	return e.frames <= 0;
}

/**
 * Создаем событие перемещения
 */
game.events.move = function(char, x, y, ready) {
	if (!ready) ready=function(){};
	return {
		type: 'move',
		char:char,
		x: x,
		y: y,
		ready: ready.bind({char: char, x:x, y:y})
	}
}

game.events.doMove = function(char, x, y, ready) {
	game.map.eventQueue.push(game.events.move(char, x, y, ready));
}

/**
 * совершить действие
 */ 

game.events.doEvent = function(char, event, x, y) {
	game.map.eventQueue.push({
		type: 'doevent',
		char: char,
		event: event,
		x: x,
		y: y
	})
}

game.eventHandlers.doevent = function(e) {
	switch (e.event) {
	case 'att1':
		characterBase.doAttack(e.char, e.char.cells[e.y][e.x].char, 1);
		break;
	case 'att2':
		characterBase.doAttack(e.char, e.char.cells[e.y][e.x].char, 2);
		break;
	default:
		characterBase.doAction(e.char, e.char.cells[e.y][e.x], e.event);
		break;
	}
	return true;
}

/**
 * обработчик события перемещения персонажа
 */
game.eventHandlers.move = function(e) {
		if (!e.moved) {
			e.moved = true;
			var t = game.map.cellToLayer(e.x,e.y);
			e.char.viewGroup.transitionTo({
				x: t.x, y: t.y,
				duration: 0.2,
				easing: 'ease-in-out',
				callback: function() {
					e.fin = true;
					e.char.moveXY(t.x, t.y);
					if (e.ready) e.ready();
				}
			})
		}
		return e.fin;
		//var x = e.char.viewGroup.getX();
		//var y = e.char.viewGroup.getY();
		//var t = game.map.cellToLayer(e.x,e.y);
		//x -= game.map.speedLim((x-t.x)/2); if (Math.abs(x-t.x)<game.map.moveSpeed) x = t.x;
		//y -= game.map.speedLim((y-t.y)/2); if (Math.abs(y-t.y)<game.map.moveSpeed) y = t.y;
		//e.char.moveXY(x, y);
		//return x==t.x && y==t.y;
}

//ход CPU
game.eventHandlers.cputurn = function(e) {
	var fin = false;
	//если только начали "думать"
	if (!e.viewGroup) {
		//визуализация
		game.events.showCpuTurnTip(e);
		startLoading();
		//перечисляем все места куда можно переместиться
		e.char = game.map.selectionChar;
		e.cells = [e.char.cell];
		//это случайны персонаж, к оторому буде двигаться враг, если не будет знать что делать
		e.targetChar = game.map.players[0].getNextChar();
		e.targetCharLen = (Math.abs(e.char.cell.x-e.targetChar.cell.x) + Math.abs(e.char.cell.y-e.targetChar.cell.y)*2);
		var cell;
		for (var i in game.map.cells) {
			for (j in game.map.cells[i]) {
				if ((cell=game.map.cells[i][j])&&(cell.act)) {
					if (cell.act.indexOf('move') != -1)
						e.cells.push(cell);
				}
			}
		}
		e.bestf = undefined;
		e.bestMove = undefined;
		e.steps = e.cells.length;
		e.step = 0;
	} else {
		//проверяем эффективность хода на клетку cell
		var cell = e.cells[e.step];
		if (cell) {
			var state = game.map.copyCellsState(undefined, true);
			var char = state[e.char.cell.y][e.char.cell.x].char;
			characterBase.changeCell(char, cell.x, cell.y);
			//совершаем все действия для которые доступны из данной клетки
			try {
			for (var i in state) {
				for (var j in state[i]) {
					//получем положение после перемещения
					var subState = game.map.copyCellsState(state, true);
					var subCell;
					if (subCell = subState[i][j]) {
						//получем действия, которые можно сделать для этой клетки
						var act = mapCellCheck(
							subState[cell.y][cell.x].char,
							subCell);
						if (act.length>0) {
							//смотрим эффективность каждого действия
							for (var ax in act) {
								var f=0;
								switch (act[ax]) {
									case 'att1':f=characterBase.doAttack(subState[cell.y][cell.x].char, subState[i][j].char, 1, true);  break;
									case 'att2':f=characterBase.doAttack(subState[cell.y][cell.x].char, subState[i][j].char, 2, true);  break;
									default: f=characterBase.doAction(subState[cell.y][cell.x].char, subState[i][j], act[ax], true); break;
								}
								console.log(act[ax], f);
								if (!e.bestf || e.bestf < f) {
									console.log('use', act[ax], f);
									e.bestf = f;
									e.bestMove = {x: cell.x, y: cell.y};
									e.bestAct = {act: act[ax], x: j, y: i};
								}
							}	
						}
					}
				}
			}
			}catch (exc) {
				console.error(exc);
			}
			var f = Math.abs(cell.x-e.targetChar.cell.x) + Math.abs(cell.y-e.targetChar.cell.y);
			if (e.targetCharLen > f || (e.targetCharLen==(f) && Math.random()<0.1)) {
				e.targetCharLen = f;
				e.targetCharMove = {x: cell.x, y: cell.y};
			}
		}
		//
		e.step++;
		game.events.showCpuTurnProgress(e);
		//искать пути отступления?
		fin = e.step>=e.steps;
	}
	//закончили "думать"
	if (fin) {
		endLoading();
		e.viewGroup.removeChildren();
		e.viewGroup.parent.remove(e.viewGroup);
		game.getLayer(3).draw();
		if (e.bestMove) {
			game.map.doMoveChar(e.char, e.bestMove.x, e.bestMove.y);
			if (e.bestAct) {
				game.events.doEvent(e.char, e.bestAct.act, e.bestAct.x, e.bestAct.y);
			}
		} else {
			if (e.targetCharMove) {
				game.map.doMoveChar(e.char, e.targetCharMove.x, e.targetCharMove.y);
			}
		}
		game.events.doNextTurn();
	}
	return fin;
}

game.events.doCpuTurn = function(cpu) {
	game.map.eventQueue.push({
		type: 'cputurn',
		cpu: cpu
	});
}

game.events.showCpuTurnTip = function(e) {
	e.viewGroup = new Kinetic.Group({
		listening: false
	});
	var w = game.kineticStage.getWidth();
	var h = game.kineticStage.getHeight();
	e.bgRect = new Kinetic.Rect({
		listening: true,
		x: 0,
		y: 0,
		width: w,
		height: h,
		fill: '#000',
		alpha: 0.3
	});
	e.viewMessageRect = new Kinetic.Rect({
		x: w/4,
		y: h/3,
		width: w/2,
		height: h/4,
		fill: game.ui.color.control,
		stroke: game.ui.color.hover,
		strokeWidth: 1,
		shadow: game.ui.shadow
	});
	e.viewTitle = new Kinetic.Text({
		listening: false,
		x: e.viewMessageRect.getX(),
		y: e.viewMessageRect.getY() + 10,
		width: e.viewMessageRect.getWidth(),
		height: 24,
		fontSize: 14,
		align: 'center',
		textFill: game.ui.color.text,
		text: format('cpu turn')
	});

	e.viewBar = new Kinetic.Rect({
		x: e.viewMessageRect.getX()+10,
		y: e.viewMessageRect.getY() + 10+10+14,
		width: e.viewMessageRect.getWidth()-20,
		height: e.viewMessageRect.getHeight() - 10-14-10-10,
		stroke: game.ui.color.hover
	});

	e.viewProgress = new Kinetic.Rect({
		x: e.viewBar.getX(),
		y: e.viewBar.getY(),
		width: 0,
		height: e.viewBar.getHeight(),
		fill: game.ui.color.hover
	});
	
	e.viewGroup.add(e.bgRect);
	e.viewGroup.add(e.viewMessageRect);
	e.viewGroup.add(e.viewTitle);
	e.viewGroup.add(e.viewBar);
	e.viewGroup.add(e.viewProgress);
	game.getLayer(3).add(e.viewGroup);
	game.getLayer(3).draw();
}

game.events.showCpuTurnProgress = function(e) {
	if (e.steps==0) return;
	e.viewProgress.setWidth(
		e.viewBar.getWidth()/e.steps*e.step
	);
	game.getLayer(3).draw();
}

//Следующий ход
game.events.doNextTurn = function() {
	game.map.eventQueue.push({
		type: 'nextturn'
	});
}

game.eventHandlers.nextturn = function(e) {
	game.map.nextTurn();
	return true;
}

//закончить бой
game.events.doEndButtle = function(win) {
	game.map.eventQueue.push({
		type: 'endbuttle',
		win: win,
	});
}

game.eventHandlers.endbuttle = function(e) {
	var fin = false;
	var framesCount = 60;
	if (!e.viewGroup) {
		e.timeout = framesCount;
		e.viewGroup = new Kinetic.Group({
		});
		e.bgRect = new Kinetic.Rect({
			x:0, y: 0,
			width: game.kineticStage.getWidth(),
			height: game.kineticStage.getHeight(),
			fill: '#fff',
			alpha: 0.0
		});
		e.viewGroup.add(e.bgRect);
		game.getLayer(2).add(e.viewGroup);
	} else {
		e.timeout--;
		e.bgRect.setAlpha(1-e.timeout/framesCount);
		
		fin = e.timeout<=0;
	}
	if (fin) {
		e.viewGroup.parent.remove(e.viewGroup);
		game.getLayer(0).removeChildren();
		game.getLayer(1).removeChildren();
		game.getLayer(2).removeChildren();
		game.getLayer(3).removeChildren();
		new gensokyoMap();
		game.map = undefined;
		game.getLayer(0).draw();
		game.getLayer(1).draw();
		game.getLayer(2).draw();
		game.getLayer(3).draw();
	}
	return fin;
}
