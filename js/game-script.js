(function () {
	
window.ScriptMachine = function(env) {
	var _this = this;

	var _env = env||{};
	var _localEnv = {};

	var _subEnv = {};

	var _DS = []; //Data stack
	var _MS = []; //Mark stack

	this._ds = _DS;
	this._ms = _MS;

	//Вкючен режим компиляции
	var _compileMode = false;
	
	// Остановить выполнение скрипта
	var _breakCode = false;
	
	// выйти из функции
	var _breakSub = false;

	// выполняется переход к метке
	var _targetLabel = undefined;

	this.getEnv = function(name) {
		var val = undefined;
		var args = name.split('.');
		var envName = args[0];
		var canExec = false;
		
		if (_subEnv.hasOwnProperty(envName)) {
			val = _subEnv[envName];
		} else if (_localEnv && _localEnv.hasOwnProperty(envName)) {
			val = _localEnv[envName];
		} else {
			val = _env[envName];
		}
		if (args.length > 1) {
			for (var i=1; i<args.length; i++) {
				val = val[args[i]];
			}
		}
		return val;
	}
	
	this.setCompileMode = function(value) {
		_compileMode = value;
	}

	this.gotoLabel = function(l) {
		_targetLabel = ':' + l;
	}

	this.breakCode = function() {
		_breakCode = true;
	}

	this.breakSub = function() {
		_breakSub = true;
	}

	this.push = function(d) {
		_DS.push(d);
	}

	this.pop = function() {
		return _DS.pop();
	}

	this.top = function(o) {
		return _DS[_DS.length-1 -(o||0)];
	}

	this.pushM = function(d) {
		_MS.push(d);
	}

	this.popM = function() {
		return _MS.pop();
	}

	this.topM = function(o) {
		return _MS[_MS.length-1 -(o||0)];
	}
	
	this.registerSub = function(name, code) {
		var sub;
		switch (typeof code) {
		case 'function': {
			sub = code;
			break;
		}
		default: {
			sub = function() {
				_this.execSub(code.toString());
			}
			break;
		}
		}
		_env[name] = sub;
	}

	// =======================================================
	
	this.execSub = function(code) {
		if (_breakCode) {
			return;
		}
		_breakSub = false;

		var lastEnv = _subEnv;
		_subEnv = {};
		try {
			var ops;
			if (code instanceof Array) {
				ops = code;
			} else {
				ops = code.toString().split(/\s+/);
			}
			var op;
			var val;
			for (var i in ops) {
				if (_breakCode || _breakSub) {
					return;
				}
				op = ops[i];
				// переход к метке
				if (typeof _targetLabel !== 'undefined') {
					if (op == _targetLabel) {
						_targetLabel = undefined;
					}
					continue;
				}
				//режим компиляции
				if (_compileMode
					&& _this.topM() !== op) {
					_this.topM(1).push(op);
					continue;
				}
				//спец команды
				switch (op[0]) {
				case '@': {
					_subEnv[op.substr(1)] = _this.pop();
					continue;
				}
				case '!': {
					_localEnv[op.substr(1)] = _this.pop();
					continue;
				}
				case '/': {
					_this.push(op.substr(1));
					continue;
				}
				case ':': {
					continue;
				}
				}
				
				//
				val = Number(op);
				if (val.toString() !== 'NaN') {
					_this.push(val);
				} else {
					val = _this.getEnv(op);

					if (typeof val === 'undefined') {
						throw new Error('Undefined value < ' + op +  ' >');
					}

					//вызов
					if (typeof val === 'function') {
						val.apply(_this);
						continue;
					}
					//значение на стек
					_this.push(val);
				}
			}
		} finally {
			_subEnv = lastEnv;
		}
	}
	
	// =======================================================

	this.exec = function(code, env) {
		_localEnv = env|{};
		try {
			_breakCode = false;
			_this.execSub(code);
		} finally {
			_localEnv = {};
		}
		return env;
	}

	// ====================================================
	
	this.init();
}

var scriptMachine = window.ScriptMachine;

// ========================================================

scriptMachine.prototype.init = function() {

// создание команд

this.registerSub('(', function() {
	this.setCompileMode(true);
	this.pushM([]);
	this.pushM(')');
});

this.registerSub(')', function() {
	var mark = this.popM();
	if (mark !== ')') {
		throw new Error('bad _MS value '+mark);
	}
	var code = this.popM();
	var fn = function() {
		this.execSub(code);
	};
	fn._code = code;

	this.push(fn);

	this.setCompileMode(false);
});

this.registerSub('exit', function() {
	this.breakCode();
});

this.registerSub('return', function() {
	this.breakSub();
});

this.registerSub('goto', function() {
	var label = this.pop();
	this.gotoLabel(label);
});

// простые операторы

this.registerSub('+', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a+b);
});

this.registerSub('-', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a-b);
});

this.registerSub('*', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a*b);
});

this.registerSub('/', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a/b);
});

this.registerSub('and', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a && b);
});

this.registerSub('or', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a || b);
});

this.registerSub('not', function() {
	var a = this.pop();
	this.push(!a);
});

this.registerSub('&', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a & b);
});

this.registerSub('|', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a | b);
});

this.registerSub('~', function() {
	var a = this.pop();
	this.push(~a);
});


// ========================================================

this.registerSub('eq', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a==b);
});

this.registerSub('nq', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a!=b);
});

this.registerSub('gt', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a>b);
});

this.registerSub('lt', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a<b);
});

this.registerSub('ge', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a>=b);
});

this.registerSub('le', function() {
	var b = this.pop();
	var a = this.pop();
	this.push(a<=b);
});

this.registerSub('cmp', function() {
	var b = this.pop();
	var a = this.pop();
	var r;
	if (a==b) {
	 	r = 0;
	} else if (a > b) {
		r =  1;
	} else {
		r = -1;
	}
	this.push(r);
});

// условия и циклы

this.registerSub('if', function() {
	var code = this.pop();
	var cap = this.pop();
	if (cap) {
		code.apply(this);
	}
});

this.registerSub('ife', function() {
	var ecode = this.pop();
	var code = this.pop();
	var cap = this.pop();
	if (cap) {
		code.apply(this);
	} else {
		ecode.apply(this);
	}
});

}

})();
