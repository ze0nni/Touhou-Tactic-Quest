/**
 * Подключает модулю aSRC к текущей странице
 */
function require(src, onload) {
    var oTarget = document.getElementsByTagName('script').item(0);
    var oScript;
    if (window.execScript || window.opera &&
            !window.opera.version) {
        oScript = oTarget;
    } else {
        oScript = document.createElement('script');
        oScript.setAttribute('type', 'text/javascript');
        oScript.setAttribute('charset',
                             oTarget.getAttribute('charset'));       
        oTarget.parentNode.replaceChild(oScript, oTarget);
    };
    oScript.async = true;
    oScript.onload = function() {
    	console.debug('load ', src);
    	onload(true); };
    oScript.onerror = function(error) { onload(false, error); };
    oScript.src = src;
}

function requireMulti(src, callback) {
	var lost = src.length;
	for (var x in src) {
		require(src[x], (function(result, error) {
			if (result) {
				lost--;
				if (lost==0) callback(true);
			} else {
				callback(false, error);
				callback=undefined;
			}
		}).bind(src[x]));
	}
}

loadingStatus = true;

function startLoading(status) {
	loadingStatus = true;
	$('#loader-animation').attr('src', 'i/ajax-loader.gif');
	$('#status-text').html(status);

}

function endLoading() {
	loadingStatus = false;
	$('#loader-animation').attr('src', 'i/logo.png');
	//$('#status-text').html('Бесполезный совет');
	nextTip();
}

function nextTip() {
	var index = Math.floor(Math.random()*localization.tips.length)
	$('#status-text').html(
		'Совет #' + (index+1) + '<br />'+
		localization.tips[index]
	);
	//window.setInterval(nextTip, 60*1000)
	
}

if (typeof game==='undefined') {
	game = {};
}

game.ui = {
	color : {
		control: '#222',
		text: '#fff',
		hover: '#48f',
		hoverText: '#fff',
		cellStroke: '#fff',
		cell:'#122',
		hoverCell:'#aee',
		ownCell:'#0f0',
		enemyCell:'#f00'
	},
	shadow: {
		color: '#000',
		blur: 8,
		offset: [5, 5],
		alpha: 0.3
	}
}

function format(f) {
	return localization[f]||f;
}

game.init = function(parent, width, height) {
	//загружаем дополнительные модули
	//requireMulti([
	//	'./js/game-map.js',
	//	'./js/game-chars.js',
	//	'./js/game-player.js',
	//	'./js/game-events.js'
	//	],
	//function() {
		//Создаем объект Stage для вывода графики
		game.kineticStage = new Kinetic.Stage({
			container: parent,
			width: width,
			height: height
		});
		game.kineticStage.onFrame(function () {
			if (game.onFrame) game.onFrame();
		})

		//три слоя
		game.clearLayers(4);
		//создаем карту
		game.map = new gameMap(new player(0), new cpuPlayer(1));
		//game.map.setSize(13, 11);
		//game.map.showCells();
		game.kineticStage.start();

		//загружаем всех персонажей
		loadCharacters(function() {
			var menu=new gameMenu();
			game.loadSlot();
			
			endLoading();
		});
	//});
	game.initAudio();
}

game.onFrame = undefined;

game.savesSlot = {};

game.imagesCache = {};

game.loadImage = function(src, nocache, ready) {
	if (!nocache && (img=game.imagesCache[src])) {
		ready(img);
		return;
	}
	var img = new Image();
	img.onload = function() {
		if (!nocache) game.imagesCache[src] = img;
		ready(img);
	}
	img.onerror = function() {
		ready(undefined);
	}
	img.async = false;
	img.src=src;
}

/**
 * загрузка персонажей
 */
function loadCharacters(ready) {
	var ccharlist =$.ajax({
		url: 'data/char.list',
		dataType: 'text',
		cache: false,
		async: false
		});
	var chars = eval('('+ccharlist.responseText+')');
	//число оставшихся характеров 
	var clost = chars.length;
	game.characters={};
	for (var x in chars) {
		var cname = chars[x];
		game.characters[cname] = new characterBase('data/chars/'+cname+'.js', (function() {
			clost--;
			if (game.characters[this.name].data.init) {
				game.characters[this.name].data.init(game.characters[this.name]);
			}
			if (clost<=0) ready();
		}).bind({name:cname}));
	}
}

//объект kinetic
game.kineticStage = undefined;
game.kineticLayers = [];

game.clearLayers = function(count) {
	for (var x in game.kineticLayers) {
		delete game.kineticLayers[x];
	}
	game.kineticLayers = [];
	var layer;
	for (var x=0; x<count; x++) {
		layer = new Kinetic.Layer();
		game.kineticLayers.push(layer);
		game.kineticStage.add(layer);
	}
};

game.getLayer = function(id) {
	return game.kineticLayers[id];
}

//сохраняем локальном хранилище
game.saveSlot = function() {
	var chars = [];
	for (var x in game.savesSlot.chars) {
		var char = game.savesSlot.chars[x];
		chars.push([
			char.base.name,
			char.level,
			char.hp,
			char.exp].join(' ')
		)
	}
	localStorage.setItem('chars', chars);
	localStorage.setItem('bonus', game.savesSlot.bonus.join(','));
	localStorage.setItem('clearStages', game.savesSlot.clearStages.join(','));
	localStorage.setItem('money', game.savesSlot.money);
}

//загружаем из локального хранилищa
game.loadSlot = function() {
	if (!localStorage) {
		onfirst('no localStorage');
		return;
	}
	if (!localStorage.chars) return;
	//персонажи
	var chars = localStorage.chars.split(',');
	game.savesSlot = {};
	game.savesSlot.chars = [];
	for (var i in chars) {
		var prop = chars[i].split(' ');
		var base = game.characters[prop[0]];
		//console.log(base);
		var newChar = new character(base, undefined, undefined, true);
		newChar.setLevel(parseInt(prop[1]));
		newChar.setHp(parseInt(prop[2]));
		newChar.setExp(parseInt(prop[3]));
		game.savesSlot.chars.push(newChar);
	}
	game.savesSlot.clearStages = localStorage.clearStages.split(',');
	game.savesSlot.bonus = localStorage.bonus.split(',');
	game.savesSlot.money = parseInt(localStorage.money)
}

game.clearSavesSlot = function() {
	game.savesSlot = {
		money: 100,
		bonus: ['healing'],
		chars: [
			new character(game.characters.chen, undefined, undefined, true),
			new character(game.characters.ran, undefined, undefined, true)
		],
		clearStages:[]
	};
}

game.newGame = function() {
	game.clearSavesSlot();
	game.map = new gameMap(new humanPlayer(0), new cpuPlayer(1));
	
	game.map.setSize(13, 11);
	game.map.showCells();


	var board = [];
	//board[1]=[undefined , 'alice', 'chen', 'marisa', 'reimu', 'sakuya', 'youmu', 'yukari', 'yuyuko', 'ran'];
	//board[11]=[undefined, 'alice', 'chen', 'marisa', 'reimu', 'sakuya', 'youmu', 'yukari', 'yuyuko', 'ran'];
	board[3] = [,,'chen',,'chen',,'chen'];
	board[1] = [, 'marisa',,,,,,,'ran'];

	board[9] = [,, 'fungus',,'fungus',,'fungus'];
	board[7] = [, 'fungus_red',,,'fungus_yellow',,,,'fungus_red'];
	for (var i in board) {
		for (var j in board[i]) {
			if (!board[i][j]) continue;
			var player = game.map.getPlayers(i>=7?1:0)
			var char = new character(game.characters[board[i][j]], player);
			char.cells = game.map.cells;
			player.add(char);
			board[i][j] = char;
			char.setXY(i,j);
			char.sprite.on('click', (function(){
				game.map.characterClick(this);
			}).bind(board[i][j]));
		}
	}
	board = undefined;
	game.map.generateMap(0);
	game.onFrame = game.map.onFrame;
	game.map.nextTurn();
}

game.continueGame = function () {
	new levelMenu();
}

game.fillMapLines = function(chars, size, shift) {
	var lines=[[],[]];
	for (var i in chars) {
		lines[Math.floor(Math.random()*lines.length)].push(chars[i]);
	}
	for (var i in lines) {
		while (lines[i].length < size)
			lines[i].push(undefined);
	}
	for (var i in lines) {
		for (var j in lines[i]) {
			var n = Math.floor(Math.random()*lines[i].length);
			var tmp = lines[i][j];
			lines[i][j] = lines[i][n];
			lines[i][n] = tmp;
		}
	}
	for (var i in lines) {
		for (var j=0; j<(shift||0); j++) {
			lines[i].unshift(undefined);
		}
	}
	return lines;
}

//todo: Buttle
game.startBattle = function(mapData, mapName) {
	console.log('new buttle');
	game.map = undefined;
	game.map = new gameMap(new humanPlayer(0), new cpuPlayer(1));
	game.map.players[0].chars = [];
	game.map.players[1].chars = [];
	game.map.players[0].onWin = function() {
		//помечаем карту пка пройденую
		if(game.savesSlot.clearStages.indexOf(mapName)==-1) {
			game.savesSlot.clearStages.push(mapName);
		}
		//добавляем открывшиеся бонусы
		for (var i in mapData.bonus) {
			if (game.savesSlot.bonus.indexOf(mapData.bonus[i])==-1) {
				game.savesSlot.bonus.push(mapData.bonus[i]);
				onfirst(mapData.bonus[i]);
			}
		}
		//обновляем партию
		game.savesSlot.chars=[];
		for (var i in game.map.players[0].chars) {
			game.savesSlot.chars.push(
				characterGetState(game.map.players[0].chars[i])
			);
		}
		//деньги-деньги-деньги
		game.savesSlot.money+=mapData.money||50;
		game.saveSlot();
	}
	
	game.map.setSize(13, 11);
	game.map.showCells();
	
	var board = [];
	var eneumyLines = game.fillMapLines(mapData.enemy, 9, 1);
	var playerLines = game.fillMapLines(game.savesSlot.chars, 9, 1);


	board[3] = playerLines[0];
	board[1] = playerLines[1];

	board[11] = eneumyLines[0];
	board[9] = eneumyLines[1];
	for (var i in board) {
		for (var j in board[i]) {
			if (!board[i][j]) continue;
			var player = game.map.getPlayers(i>=5?1:0);
			var cell = board[i][j];
			var char;
			if (typeof(cell)==='string') {
				cell = cell.split(' ');
				char = new character(game.characters[cell[0]], player);
				if (cell[1]) char.setLevel(parseInt(cell[1]||0));
			} else {
				char = new character(cell.base, player);
				char.setLevel(cell.level);
				char.setHp(cell.hp);
				char.setExp(cell.exp);
			}

			char.cells = game.map.cells;
			player.add(char);
			board[i][j] = char;
			char.setXY(i,j);
			char.sprite.on('click', (function(){
				game.map.characterClick(this);
			}).bind(board[i][j]));
		}
	}
	board = undefined;
	game.map.generateMap(0);
	game.onFrame = game.map.onFrame;
	
	//загружаем фон
	if (mapData.background) {
		var img = new Image();
		img.onload = function() {
			var bg = new Kinetic.Image({
				width: img.width,
				height: img.height,
				image: img
			});
			game.getLayer(0).add(bg);
			bg.moveToBottom();
			game.getLayer(0).draw();
		};
		img.src = 'i/bg/'+mapData.background+'.jpg';
	}
	onfirst(mapName);
	game.map.nextTurn();
}

game.initAudio = function() {
	game.audio = {};
	game.audio.container = new Audio();
}

function createTileAtimation(tiles, w, h) {
	var out = {};
	for (var aname in tiles) {
		var frames = [];
		for (var x in tiles[aname]) {
			var f = tiles[aname][x];
			frames.push({
				x: f[1]*w,
				y: f[0]*h,
				width:w,
				height:h
			});
		}
		out[aname] = frames;
	}
	return out;
}

