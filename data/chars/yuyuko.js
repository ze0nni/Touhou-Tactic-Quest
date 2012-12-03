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
		idle:[ [9,0], [9,1], [9,2], [9,3], [9,2], [9,1] ],
		dmg:[ [9,6], [9,5], [9,4], [9,4] ],
		attack1:[ [9,6], [9,8], [9,6] ],
		attack2:[ [9,9], [9,10], [9,11] ],
		block:[ [9,6], [9,6], [9,6], [9,6] ]
	},
	
	/** Харарктеристики персонажа
	 */
	maxLevel: 3,
	character: {
		def: [8, 9, 10],
		defkick: [14, 16, 19],
		defknife: [14, 16, 19 ],
		spd: [6, 6, 7],
		exp: [10, 20, 40],
		hp: [9, 13, 17],
		att1: [10, 12, 15],
		dmg1: [[2,4], [3,5], [4,6]],
	},
	
	/** действия при альтернативной атаке
	 * Ююко высасывает из всех кто ее окружает здоровье
	 */
	doAttack2: function(char, person, fast) {
		alert('ran.doAttack2');
		return(0);
		//играем анимацию
			var cell = person.cell;
			if (!fast && char.doAnimation) char.doAnimation('attack2');
			var f=0;
			var rmHp = 2 * ((char.level||0)+1)
			for (var y =cell.y-1; y<=cell.y+1; y++) {
				for (var x =cell.x-1; x<=cell.x+1; x++) {
					if (char.cells[y] && char.cells[y][x] && (c=char.cells[y][x].char)) {
						//чем ниже здоровье у персонажа, тем выше эффективность
						f += (((c.character.hp-c.hp)/addHp)*characterGetExpAmmount(c)) *
								//Как бы проверка, что бы не калечить друзей врагов
								char.player.index!=c.player.index?1:-1;
						if (!fast){
							if (c.addHp) c.addHp(-addHp);
							if (char.addHp) char.addHp(addHp);
						}
					}
				}
			}
			return f;
	},
	
}
