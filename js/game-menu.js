(function () {

window.gameMenu = function(items) {
	items = items||[
		{title: 'new game', event: function(menu) {
			menu.remove();
			//game.newGame();
			game.clearSavesSlot();
			var menu = new levelMenu();
		}},
		{title: 'continue', event: function(menu) {
			menu.remove();
			game.continueGame();
		}},
		{title: 'Language', event: function(menu) {
			chooseLocation("", function() {
				new gameMenu();
			});
		}},
	];
	//
	game.onFrame = this.onFrame;

	this.viewGroup = new Kinetic.Group({
	});
	this.viewBgGroup = new Kinetic.Group({
	});
	var menu = this;
	game.loadImage('i/bg/menu.jpg', false, function(img) {
		menu.bgImage = new Kinetic.Image({
			x:0,
			y:game.kineticStage.getHeight()-img.height,
			image: img,
		});
		menu.viewBgGroup.add(menu.bgImage);
		game.getLayer(0).draw();
	});

	game.getLayer(0).add(this.viewBgGroup);
	game.getLayer(0).add(this.viewGroup);

	this.navigate(items);
	game.getLayer(0).draw();
}

gameMenu.prototype.remove = function() {
	if (this.viewGroup) {
		this.viewGroup.removeChildren();
		this.viewGroup.parent.remove(this.viewGroup)
	}
	if (this.viewBgGroup)
		this.viewBgGroup.parent.remove(this.viewBgGroup);
}

gameMenu.prototype.navigate = function(items) {
	var itemWidth = 200;
	var itemHeight = 24;
	var fontSize = itemHeight*0.6;
	for (var x in items) {
		var item = items[x];
		var viewGroup = new Kinetic.Group({
			x: 10,
			y: 10+itemHeight*x,
		});
		var viewRect = new Kinetic.Rect({
			width: itemWidth,
			height: itemHeight,
			fill: game.ui.color.control,
			stroke: game.ui.color.hover,
			strokeWidth:1
		});
		viewRect.menuItem = item;
		viewRect.menu = this;
		viewRect.on('mouseover touchstart', function() {
			this.setFill(game.ui.color.hover);
			game.getLayer(0).draw();
		});
		viewRect.on('mouseout touchend', function() {
			this.setFill(game.ui.color.control);
			game.getLayer(0).draw();
		});
		viewRect.on('click tap', function() {
			if (	this.menuItem.event
				&& this.menuItem.event(this.menu)) {

				this.menu.viewGroup.removeChildren();
				game.getLayer(0).draw();
				
			}
		});

		var viewText = new Kinetic.Text({
			listening: false,
			x: 10,
			y: itemHeight*0.2,
			width: itemWidth-20,
			height: itemHeight,
			text: format(item.title),
			fontSize: fontSize,
			textFill: game.ui.color.text
		});
		
		viewGroup.add(viewRect);
		viewGroup.add(viewText);
		this.viewGroup.add(viewGroup);
	}
	game.getLayer(0).draw();
}

gameMenu.prototype.onFrame = function() {

}

})();
