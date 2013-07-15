(function () {

var resourceMan = function() {

	var _typeMap = {};
	this.setExtType = function(t, exts) {
		exts = exts.split(' ');
		for (var i in exts) {
			_typeMap[exts[i]] = t;
		}
	}
	
	this.getResourceType = function(name) {
		var ext = name.match(/(\w+)$/)[0];
		return _typeMap[ext.toLowerCase()];
	}

	var _loaders = {};
	this.setResourceLoader = function(type, loader) {
		_loaders[type] = loader;
	}

	this.callResourceLoader = function(r, onRLoad, onRError) {
		var loader = _loaders[r.type]||_loaders['text'];
		if (typeof loader === 'undefined') {
			onRError(r.uri, 'Loader for ' + r.type + ' not exists');
		} else {
			loader(r, onRLoad, onRError);
		}
	}
}

resourceMan.prototype.getXMLHTTP = function() {
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp=new XMLHttpRequest();
	} else {
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}

var loaderID = 0;

resourceMan.prototype.load = function(rList, ready, progress) {
	var lId = loaderID;
	loaderID++;
	
	var rLost = rList.length;
	var rErrors = [];
	var rOut = {};
	
	var rUpdateProgess = function() {
		if (progress) {
			progress(rList.length-rLost, rList.length, rErrors);
		}
		if (rLost <= 0 && ready) {
			ready(rOut, rErrors);
		}
	}

	var onRLoad = function (rName, alias, data) {
		rLost--;
		if (typeof alias !== 'undefined') {
			rOut[alias] = data;
		}
		rUpdateProgess();
	}

	var onRError = function (rName, e) {
		rLost--;
		rErrors.push([rName, e]);
		rUpdateProgess();
	}

	for (var ri in rList) {
		var r = rList[ri];
		if (typeof r.alias === 'undefined') {
			r.alias = r.uri;
		}
		var type = typeof r.type !== 'undefined'?
			r.type:
			window.ResManager.getResourceType(r.uri);
		r.type = type;
		window.ResManager.callResourceLoader(r, onRLoad, onRError);
	}
}

var rLoadImage = function(r, onRLoad, onRError) {
	var img = new Image();
	img.onload = function() {
		onRLoad(r.uri, r.alias, img);
	}
	img.onerror = function(e) {
		onRError(r.uri, e);
	}
	img.src = r.uri;
}

//получаем все уже загруженные скрипты
var scripts = [];
(function() {
	var sl = document.getElementsByTagName("script");
	for (var i in sl) {
		scripts.push(sl[i].src);
	}
})();

function expandPath(p) {
	return p;
}

var rLoadScript = function(r, onRLoad, onRError) {
	if (scripts.indexOf(expandPath(r.uri)) !== -1) {
		return;
	}
	var headID = document.getElementsByTagName("head")[0];
	var scr = document.createElement('script');
	scr.onload = function() {
		onRLoad(r.uri);
		scripts.push[r.uri];
	}
	scr.onerror = function(e) {
		onRError(r.uri, e);
	}
	scr.type = 'text/javascript';
	scr.src = r.uri;
	headID.appendChild(scr);
}

var rLoadTXT = function(r, onRLoad, onRError) {
	var xmlhttp = window.ResManager.getXMLHTTP();
	xmlhttp.onload = function() {
		var text = xmlhttp.responseText;
		onRLoad(r.uri, r.alias, text);
	}
	xmlhttp.onerror = function(e) {
		onRError(r.uri, e);
	}
	xmlhttp.open('GET', r.uri, true);
	xmlhttp.send(null);
}

var rLoadJSON = function(r, onRLoad, onRError) {
	var xmlhttp = window.ResManager.getXMLHTTP();
	xmlhttp.onload = function() {
		var text = xmlhttp.responseText;
		try {
			var obj = eval( '(' + text + ')' );
			onRLoad(r.uri, r.alias, obj);
		} catch (e) {
			onRError(r.uri, e);
		}
	}
	xmlhttp.onerror = function(e) {
		onRError(r.uri, e);
	}
	xmlhttp.open('GET', r.uri, true);
	xmlhttp.send(null);
}

// ==============================================

window.ResManager = new resourceMan();

window.ResManager.setExtType(
	'image',
	'gif png jpg jpeg');
window.ResManager.setExtType(
	'script',
	'js');
window.ResManager.setExtType(
	'text',
	'txt text dat data htm html php');
window.ResManager.setExtType(
	'json',
	'json jobj obj jo');
window.ResManager.setResourceLoader('image', rLoadImage);
window.ResManager.setResourceLoader('script', rLoadScript);
window.ResManager.setResourceLoader('text', rLoadTXT);
window.ResManager.setResourceLoader('json', rLoadJSON);

// =============================================

})();
