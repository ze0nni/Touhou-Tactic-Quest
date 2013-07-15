(function() {

window.localization = {};

window.chooseLocation = function(loc, ready) {
 	loadLoc(loc, function(result) {
		if (result) {
			if (typeof ready !== 'undefined') {
				ready();
			}
		} else {
			showDialog(ready);
		}
	});

}

function showDialog(ready) {
	$.ajax({
		'url': './data/loc/loclist.js',
		'dataType': 'text',
		'error': function(exc) {
			console.error(exc);
		},
		'success': function(data) {
			var loc = eval('(' + data + ')');
			chooseDlg(loc, ready);
		}
		});
}

// ========================================================

function chooseDlg(items, ready) {
	var root = document.createElement('ul');
	for (var i in items) {
		root.appendChild(
			getLocItem(items[i], ready));
	}
	iBox.show(root, 'Select language');
}

function getLocItem(item, ready) {
	var root = document.createElement('li');
	var href = document.createElement('a');
	root.appendChild(href);
	
	href.innerHTML = item.title;
	href.href='#';
	href.onclick = function() {
		loadLoc(item.value, ready);
		iBox.hide();
	};

	return root;
}

// ========================================================

function loadLoc(name, ready) {
	$.ajax({
		'url': './data/loc/' + name + '/rlist.txt',
		'error': function(exc) {
			if (typeof ready !== 'undefined') {
				ready(false);
			} else {
				console.error('error load localization', name, exc);
			}
		},
		'success': function(data) {
			if (localStorage) {
				localStorage.loc = name;
			}
			loadLocList(name, data.split(/[\r\n]+/), ready);
		}
		});
}

function loadLocList(loc, list, ready) {
	var rlist = [];
	for (var i in list) {
		var item = list[i].trim();
		if (item.length == 0) {
			continue;
		}
		rlist.push({alias: item, uri: './data/loc/' + loc + '/' + item});
	}
	ResManager.load(
		rlist,
		function(r, e) {
			for (var i in r) {
				loadLocData(r[i]);
			}
			if (typeof ready !== 'undefined') {
				ready(true);
			}
		});
}

function loadLocData(data) {
	for (var i in data.root) {
		localization[i] = data.root[i];
	}
}


})();
