{
	title: 'Ран',
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
		idle:[ [7,0], [7,1], [7,2], [7,3], [7,2], [7,1] ],
		dmg:[ [7,6], [7,5], [7,4], [7,4] ],
		attack1:[ [7,6], [7,8], [7,6] ],
		attack2:[ [7,9], [7,10], [7,11] ],
		block:[ [7,6], [7,6], [7,6], [7,6] ]
	},
	
	/** Харарктеристики персонажа
	 */
	maxLevel: 3,
	character: {
		def: [10, 12, 16],
		spd: [3, 4, 4],
		exp: [10, 25, 50],
		hp: [12, 16, 24],
		att1: [8, 10, 12],
		dmg1: [[1,4], [1, 5], [2, 6]],
		att2: [10, 15, 20],
		dmg2: [[4,6], [5,8], [6,10]],
	},
	
	/** действия при альтернативной атаке
	 *
	 */
	//doAttack2: function(char, person) {
	//},
	
	/**
	 *
	 */
	checkCell: function(char, cell, act, fast) {	
		if (char.cell.x==cell.x && char.cell.y==cell.y && char.power>=3) {
			act.push('healing');
		}
	},

	doAction: function(char, cell, act, fast) {
		if (act=='healing') {
			//отнимаем 3 энергии
			char.power = (char.power||0) - 3;
			if (char.power < 0) char.power = 0;
			if (char.setPower) char.setPower(char.power);
			//играем анимацию
			if (!fast && char.doAnimation) char.doAnimation('attack2');
			var f=0;
			var addHp = 3 * ((char.level||0)+1)
			for (var y =cell.y-1; y<=cell.y+1; y++) {
				for (var x =cell.x-1; x<=cell.x+1; x++) {
					if (char.cells[y] && char.cells[y][x] && (c=char.cells[y][x].char)) {
						//чем ниже здоровье у персонажа, тем выше эффективность
						f += (((c.character.hp-c.hp)/addHp)*characterBase.getExpAmmount(c)) *
								//Как бы проверка, что бы не лечить врагов
								char.player.index!=c.player.index?1:-1;
						if (c.addHp){
							c.addHp(addHp);
						}
					}
				}
			}
			return f;
		}
	}
}
