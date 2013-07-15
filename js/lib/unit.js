(function () {

var _imports = {};
var _importsQueue = [];

window.Unit = function (name, imports, body) {
	if (_importsQueue.indexOf(name) !== -1) {
		return;
	}
	
	_imports[name] = {
		name: name,
		imports: imports,
		body: body,
		isLoad : false
	};
	_importsQueue.push(name);
	addScript(name);
}

var _isScriptAdd = {};

function addScript(src) {
	if (_isScriptAdd[src]) {
		return;
	}
	_isScriptAdd[src] = true;

	var scr = document.createElement('script');
	scr.onload = function() {
		scriptOnLoad(src);
	}
	scr.onerror = function(e) {
		console.error(e);
	};
	scr.src = src;
	document.getElementsByTagName("head")[0].appendChild(scr);
}

function scriptOnLoad(src) {
	if (!_imports[src]) {
		_imports[src] = {
			name: name,
			imports: [],
			//body: undefined,
			isLoad : false
		};
		console.log('load script ' + src);
	}
	_imports[src].isLoad = true;

	for (var i in _importsQueue) {
		var libName = _importsQueue[i];
		var lib = _imports[libName];
		if (!lib.body) {
			continue;
		}
		//проверяем целосность модулей
		checkModule(libName);
	}
	return;
	for (var i = _importsQueue.length-1; i>=0; i--) {
		if (_importsQueue[i].body === undefined) {
			_importsQueue.splice(i, 1);
		}
	}
}

function checkModule(name) {
	var lib = _imports[name];
	
	if (typeof lib === "undefined") {
		addScript(name);
		return false;
	}

	for (var i in lib.imports) {
		var libName = lib.imports[i];
		if (!checkModule(libName)) {
			return false;
		}
	}
	if (lib.body) {
		lib.body();
		lib.body = undefined;
		console.log('load module', name);
	}
	return true;
}

})();
