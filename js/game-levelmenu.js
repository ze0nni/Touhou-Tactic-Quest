(function () {

window.levelMenu =  function() {
	game.onFrame = this.onFrame;
	this.viewGroup = new Kinetic.Group({
	});
	this.viewBgGroup = new Kinetic.Group({
	});
	var menu = this;
	game.loadImage('i/bg/shop.jpg', false, function(img) {
		menu.bgImage = new Kinetic.Image({
			x:0,
			y:game.kineticStage.getHeight()-img.height,
			image: img,
		});
		menu.viewBgGroup.add(menu.bgImage);
		game.getLayer(0).draw();
	});
	//слоты с товарами
	this.shopSlot = [];
	//выбираем случае товары
	for (var i=0; i<12; i++) {
		if (Math.random()>0.5) continue;
		this.shopSlot[i] = game.savesSlot.bonus[Math.floor(Math.random()*game.savesSlot.bonus.length)];
		
	}
	this.updateView();
	//туториал
	game.tutor('shop');
}

levelMenu.prototype.updateView = function() {
	this.viewGroup.removeChildren();
	//деньги
	this.viewMoney = new Kinetic.Text({
		x: 440,
		y: 35,
		width: 150,
		height: 50,
		fontSize: 30,
		textFill: '#000',
		align: 'right',
		text: (game.savesSlot.money||0).toString(),
	});
	this.viewGroup.add(this.viewMoney);
	
	//добавляем
	for (var i=0; i<12; i++) {
		var slot = {};
		slot.index = i;
		this.createItemSlot(
			slot,
			10+(i % 3)*100,
			10+Math.floor(i/3)*100,
			90,90);
		if (!this.shopSlot[i]) continue;
		var bonusName = this.shopSlot[i];
		var bonus = game.bonus[bonusName];
		if (!bonus) continue;
		game.loadImage('i/bonus/'+bonusName+'.png', false, (function(img) {
			var spt = new Kinetic.Image({
				listening: false,
				x: 5, y: 5,
				image:img
			});
			this.viewGroup.add(spt);
		}).bind(slot));
		var title = new Kinetic.Text({
			listening: false,
			x: 40,
			y: 5,
			width: 90, height: 90,
			fontSize: 10,
			textFill: game.ui.color.text,
			text: bonus.price.toString()
		});
		var desc = new Kinetic.Text({
			listening: false,
			x: 5,
			y: 40,
			width: 75, height: 90,
			fontSize: 8,
			textFill: game.ui.color.text,
			text: format('bonus_'+bonusName)
		});
		slot.viewRect.slot = slot;
		slot.viewRect.bonus = bonus;
		var menu = this;
		slot.viewRect.on('click tap', function() {
			if (this.bonus.price>game.savesSlot.money) {
				alert(format('no money'));
				return;
			}
			if (this.bonus.select) {
				game.savesSlot.money -= this.bonus.price;
				this.bonus.select();
				menu.shopSlot[this.slot.index] = undefined;
				menu.updateView();
				menu.setMoney(game.savesSlot.money);
			}
		});

		slot.viewGroup.add(title);
		slot.viewGroup.add(desc);
	}
	//персонажи
	this.charSlot = [];
	for (var i=0; i<6; i++) {
		var slot={};
		this.createItemSlot(slot, 
			340 + (i % 2) * 150,
			110+Math.floor(i/2)*100,
			140, 90);
		var char;
		if (!(char=game.savesSlot.chars[i])) continue;
		slot.char = char;
		slot.sprite = new Kinetic.Sprite({
			listening: false,
			image: char.base.sprite.image,
			animations: char.base.animations,
			animation: 'idle',
			index:0
		});
		slot.viewTitle = new Kinetic.Text({
			listening: false,
			x: 50,
			y: 10,
			width: 140-50,
			height: 20,
			fontSize: 10,
			textFill: game.ui.color.text,
			text: char.base.data.title + ' ('+(parseInt(char.level)+1)+')',
		});
		slot.viewHp = new Kinetic.Text({
			listening: false,
			x: 50,
			y: 15+10,
			width: 140-50,
			height: 20,
			fontSize: 10,
			textFill: game.ui.color.text,
			text: 'hp: ' + char.hp + '/' + char.character.hp
		});
		slot.removeChar = new Kinetic.Text({
			x: 50,
			y: 90-25,
			width: 140-50,
			padding: 5,
			align: 'center',
			height: 25,
			fontSize: 10,
			stroke: game.ui.color.hover,
			strokeWidth:2,
			textFill: game.ui.color.text,
			text: format('delete'),
		});
		slot.removeChar.slot = slot;
		slot.removeChar.slotIndex = i;
		slot.removeChar.on('mouseover touchstart', function(){
			this.setFill(game.ui.color.hover);
			game.getLayer(0).draw();
		});
		slot.removeChar.on('mouseout touchend', function(){
			this.setFill('');
			game.getLayer(0).draw();
		});
		(function(char) {
		slot.viewRect.on('click tap', function() {
			characterBase.showCharInfoDialog(char);
		});
		})(char);

		slot.viewGroup.add(slot.sprite);
		slot.viewGroup.add(slot.viewTitle);
		slot.viewGroup.add(slot.viewHp);
		slot.viewGroup.add(slot.removeChar);

	}
	
	//кнопки
	this.btnMenu = {};
	this.createItemSlot(
		this.btnMenu,
		55, 10+100*4,
		200, 50,
		format('back')
	);
	var menu = this;
	this.btnMenu.viewRect.on('click tap', function() {
		menu.remove();
		new gameMenu();
	});

	this.btnFight = {};
	this.createItemSlot(
		this.btnFight,
		380, 10+100*4,
		210, 50,
		format('fight')
	);
	this.btnFight.viewRect.on('click tap', function() {
		menu.remove();
		new gensokyoMap();
	});

	this.viewGroup.add(this.btnMenu.viewGroup);
	this.viewGroup.add(this.btnFight.viewGroup);

	game.getLayer(0).add(this.viewBgGroup);
	game.getLayer(0).add(this.viewGroup);
	game.getLayer(0).draw();
}

levelMenu.prototype.createItemSlot = function(slot, x, y, width, height, text) {
		slot.viewGroup = new Kinetic.Group({
			x: x,
			y: y,
		});

		slot.viewRect = new Kinetic.Rect({
			width: width,
			height: height,
			alpha: 0.8,
			fill: game.ui.color.control,
			stroke: game.ui.color.hover,
			//shadow: game.ui.shadow
		});
		slot.viewRect.slot = slot;
		slot.viewRect.on('mouseover touchstart', function(){
			this.setStrokeWidth(4);
			game.getLayer(0).draw();
		});
		slot.viewRect.on('mouseout touchend', function(){
			this.setStrokeWidth(2);
			game.getLayer(0).draw();
		});
		
		if (text) {
			slot.viewText = new Kinetic.Text({
				listening:false,
				align: 'center',
				x: 0, y: height/3,
				width:width,
				height:height,
				fontSize: height/3,
				textFill: '#fff',
				text:text
			});
		}

		slot.viewGroup.add(slot.viewRect);
		this.viewGroup.add(slot.viewGroup);
		if (slot.viewText) slot.viewGroup.add(slot.viewText);
		this.shopSlot.push(slot);
}

levelMenu.prototype.remove = function() {
	if (this.viewGroup) {
		this.viewGroup.removeChildren();
		this.viewGroup.parent.remove(this.viewGroup)
	}
	if (this.viewBgGroup)
		this.viewBgGroup.parent.remove(this.viewBgGroup);
}

levelMenu.prototype.onFrame = function() {
}

levelMenu.prototype.setMoney = function(a) {
	this.viewMoney.setText(a.toString());
	game.getLayer(0).draw();
}

// ==================================================================

// ==================================================================

})();
