function gensokyoMap() {
	game.onFrame = this.onFrame();
	this.waypointsBuff = {};
	this.viewGroup = new Kinetic.Group({
	});
	this.viewBgGroup = new Kinetic.Group({
	});
	var menu = this;
	game.loadImage('i/bg/gensokyomap.jpg', false, function(img) {
		menu.bgImage = new Kinetic.Image({
			x:0,
			y:0,
			image: img,
		});
		menu.viewBgGroup.add(menu.bgImage);
		game.getLayer(0).draw();
	});
	this.initMap();
	

	game.getLayer(0).add(this.viewBgGroup);
	game.getLayer(0).add(this.viewGroup);
	game.getLayer(0).draw();
}

gensokyoMap.prototype.onFrame = function() {
}

gensokyoMap.prototype.remove = function() {
	if (this.viewGroup) {
		this.viewGroup.removeChildren();
		this.viewGroup.parent.remove(this.viewGroup)
	}
	if (this.viewBgGroup)
		this.viewBgGroup.parent.remove(this.viewBgGroup);
}

gensokyoMap.prototype.insertWayPoint = function(point, struct) {
	var pt;
	if (!(pt=struct[point])) return;
	var isStageClear = game.savesSlot.clearStages.indexOf(point) != -1;
	if (!this.waypointsBuff[point]) {
		var viewPoint = new Kinetic.Ellipse({
			x: pt.x,
			y: pt.y,
			radius: 10,
			fill: '#fff',
			stroke: point=='root'?'#f00':
				isStageClear?'#2a2':'#48f'
				,
			strokeWidth: 4
		});
		viewPoint.mapPoint = pt;
		viewPoint.mapPointName = point;
		viewPoint.on('mouseover touchstart', function() {
			this.transitionTo({
				scale: {x: 1.5, y: 1.5},
			        duration: 0.3,
	        		easing: 'back-ease-out'
			});
		});
		viewPoint.on('mouseout touchend', function() {
			this.transitionTo({
				scale: {x: 1, y: 1},
			        duration: 0.3,
	        		easing: 'back-ease-out'
			});
		});
		var menu=this;
		viewPoint.on('click tap', function() {
			menu.remove();
			if (this.mapPointName=='root') {
				new levelMenu();
			} else {
				game.startBattle(this.mapPoint, this.mapPointName);
			}
		});
		this.waypointsBuff[point] = true;
	}

	//дочерние
	if (point=='root' || (game.savesSlot.clearStages && game.savesSlot.clearStages.indexOf(point) != -1)) {
		for (var i in pt.child) {
			var child = pt.child[i];
			if (!struct[child]) continue;
			if (! (this.waypointsBuff[point+'.'+child] || this.waypointsBuff[child+'.'+point])) {
				this.viewGroup.add(new Kinetic.Line({
					listening: false,
					points: [pt.x, pt.y, struct[child].x, struct[child].y],
					stroke: '#08f',
					strokeWidth: 4
				}));
				this.waypointsBuff[point+'.'+child] = true;
				this.waypointsBuff[child+'.'+point] = true;

				this.insertWayPoint(child, struct);
			}
		}
	}
	if (typeof viewPoint != 'undefined') {
		this.viewGroup.add(viewPoint);
	}

}

gensokyoMap.prototype.initMap = function() {
	var data = $.ajax({
		url:'data/gensokyoMap.struct',
		data: 'text',
		async: false,
	});
	var struct = eval('('+data.responseText+')');
	this.insertWayPoint('root', struct);
	game.getLayer(0).draw();
}

