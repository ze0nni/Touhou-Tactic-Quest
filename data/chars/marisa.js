{
	// характеристики спрайта
	sprite : {
		// источник
		src: "i/chars.png",
		
		// размеры
		width: 64,
		height: 64,
		
		// центр
		x: 32,
		y: 64		
	},
	
	// анимация
	animations:{
		idle:[ [2,0], [2,1], [2,2], [2,3], [2,2], [2,1] ],
		dmg:[ [2,6], [2,5], [2,4], [2,4] ],
		attack1:[ [2,6], [2,8], [2,6] ],
		attack2:[ [2,9], [2,10], [2,11], [2,10], [2,11], [2,10], [2,11], [2,10], [2,11], [2,10], [2,11] ],
		block:[ [2,6], [2,6], [2,6], [2,6] ]
	},
	
	/** Харарктеристики персонажа
	 */
	maxLevel: 3,
	character: {
		def: [8, 10, 12],
		defkawaii: [2, 3, 5],
		spd: [4, 4, 5],
		exp: [10, 20, 40],
		hp: [9, 13, 17],
		att1: [10, 12, 15],
		dmg1: [[2,4], [3,5], [4,6]],
		att2: [0, 20, 25],
		att2type: ['magic'],
		dmg2: [[0,0], [5,7], [7, 10]]		
	},
	
	/**
	 * Функция инициализации характера
	 * Грузим спрайты для мастер-спарка
	 */
	init: function(base) {	
		var img = new Image()
		base.masterSparkImage = img;
		base.masterSparkTileSize = 96;
		img.onload = function() {

		}
		img.onerror = function() {
			console.debug('error load '+img.src);
		}
		img.src='i/masterspark.png';
		
		base.masterSparkAnimation = createTileAtimation({
			flame: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4]],
			ring: [[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[3,3],[3,4]],
			
		}, base.masterSparkTileSize, base.masterSparkTileSize);	
		
		base.ShowMasterSpark = function(x, y, angle) {
			angle+=Math.PI;
			var pos = game.map.cellToLayer(x, y);
			var group = new Kinetic.Group({
				listening: false,
				x: pos.x,
				y: pos.y-game.map.tileSize/2,				
				rotation: angle,
			});
			var ring = new Kinetic.Sprite({
				offset: [base.masterSparkTileSize/3*2, base.masterSparkTileSize/2],
				image: base.masterSparkImage,
				animation: 'ring',
				animations: base.masterSparkAnimation,
				frameRate:9
			});
			var flame = new Kinetic.Sprite({
				offset: [base.masterSparkTileSize*1.2, base.masterSparkTileSize/2],
				image: base.masterSparkImage,
				animation: 'flame',
				animations: base.masterSparkAnimation,
				frameRate:9
			});
			
			group.add(ring);
			game.getLayer(1).add(group);
			ring.start();
			ring.afterFrame(Math.ceil(base.masterSparkAnimation.ring.length/3), function() {
				group.add(flame);
				flame.start();
				ring.moveToTop();
				ring.afterFrame(base.masterSparkAnimation.ring.length-1, function() {		
					this.stop();
					this.parent.remove(this);
					delete this;
				});
			});
			flame.afterFrame(base.masterSparkAnimation.ring.length-1, function() {		
					flame.stop();
					group.parent.remove(group);
					delete group;
			});
		}
	},
	
	newChar: function(char) {
	
	},
	
	/** действия при альтернативной атаке
	 * Мастер спарк. Умение второго уровня, может атаковать сразу двух персонажей, стоящих на одной линии
	 */
	doAttack2: function(char, person, fast) {
		//находим угол
		var x = parseInt(person.cell.x)-parseInt(char.cell.x);
		var y = parseInt(person.cell.y)-parseInt(char.cell.y);
		if (!fast) char.base.ShowMasterSpark(char.cell.x, char.cell.y, Math.atan2(y, x));
		
		var f=0;
		//что бы не потратить только 1 энергию
		if (!fast) {
			char.power+=3;
			if (char.setPower) char.setPower(char.power);
		}
		//атакуем первого персонажа
		f += personDoAttackRaw(char, person, 2, fast);
		x = parseInt(person.cell.x)+parseInt(x);
		y = parseInt(person.cell.y)+parseInt(y);
		var p2;
		if (person.cells[y] && person.cells[y][x] && (p2=person.cells[y][x].char)) {
			//атакуем второго персонажа
			f+= personDoAttackRaw(char, p2, 2,	fast);
		}
		return f;
	},
	
	/**
	 * возвращает возможные которые можно применить к этой клетке
	 */
	checkCell: function(char, cell, act) {
	
	}
}
