var calculator = {};

/* Triangle */

/**
 * Available shapes.
 **/
calculator.shapes = {
	'triangle': { 'name': 'triangle', 'title': 'Dimensions du store triangle' },
	'trapeze': { 'name': 'trapeze', 'title': 'Dimensions du store trapèze' }
};

/**
 * Current shape.
 **/
calculator.shape = 'trapeze';

/**
 * Recalculate triangle dimensions.
 * ---
 * @param jQuery input
 *		Input that changed.
 * @return Void
 **/
calculator.triangle = function(input){	
    var values = this.values();
	var name = this.name(input);
	if(name == 'red.bottom'){
		if(values.red.right <= 0 && values.red.left > 0){
			this.values('red.right', Math.sqrt(values.red.left * values.red.left + values.red.bottom * values.red.bottom)); 
		}else{
			this.values('red.left', Math.sqrt(values.red.right * values.red.right - values.red.bottom * values.red.bottom)); 
		}
	}else if(name == 'red.left'){
		if(values.red.right <= 0 && values.red.bottom > 0){
			this.values('red.right', Math.sqrt(values.red.left * values.red.left + values.red.bottom * values.red.bottom)); 
		}else{
			this.values('red.bottom', Math.sqrt(values.red.right * values.red.right - values.red.left * values.red.left)); 
		}
	}else if(name == 'red.right'){
		if(values.red.left > 0 && values.red.bottom <= 0){
			this.values('red.bottom', Math.sqrt(values.red.right * values.red.right - values.red.left * values.red.left)); 
		}else if(values.red.left <= 0 && values.red.bottom > 0){
			this.values('red.left', Math.sqrt(values.red.right * values.red.right - values.red.bottom * values.red.bottom)); 
		}else{
			this.values({ 'red.left': 0, 'red.bottom': 0 });
		}
	}
	var values = this.values();
	if(values.red.right){
		var x, y, z, sign;
		var angleB = Math.acos(values.red.left / values.red.right);
		var angleA = Math.PI / 2 - angleB;
		this.values('black.angle', 360 * angleA / (Math.PI * 2));
		y = values.blue.bottom / Math.sin(angleA);
		sign = (values.blue.bottom >= 0 ? 1 : -1);
		x = (
			values.red.bottom + 
			values.blue.left + 
			(values.blue.right / Math.sin(angleA)) + 
			sign * Math.sqrt(y * y - values.blue.bottom * values.blue.bottom)
		);
		this.values('green.bottom', x);
		y = values.blue.left / Math.sin(angleB);
		sign = (values.blue.left >= 0 ? 1 : -1);
		x = (
			values.red.left + 
			values.blue.bottom + 
			(values.blue.right / Math.sin(angleB)) + 
			sign * Math.sqrt(y * y - values.blue.left * values.blue.left)
		);
		this.values('green.left', x);
		y = values.blue.right / Math.sin(angleB);
		z = values.blue.right / Math.sin(angleA);
		sign = (values.blue.right >= 0 ? 1 : -1);
		x = (
			values.red.right + 
			(values.blue.bottom / Math.sin(angleA)) + 
			(values.blue.left / Math.sin(angleB)) + 
			sign * Math.sqrt(y * y - values.blue.right * values.blue.right) +
			sign * Math.sqrt(z * z - values.blue.right * values.blue.right)
		);
		this.values('green.right', x);
	}
};

/**
 * Recalculate trapeze dimensions.
 * ---
 * @return Void
 **/
calculator.trapeze = function(input){
	var values = this.values();
	var name = this.name(input);
	var x, y, z, sign;
	x = values.red.bottom;
	y = values.red.left - values.red.right;
	values.red.top = Math.sqrt(x*x + y*y);
	this.values('red.top', values.red.top);
	var alpha = 0;
	if(values.red.top > 0){
		alpha = Math.asin(values.red.bottom / values.red.top);
	}
	var angle = Math.PI - alpha;
	values.black.angle = 360 * (Math.PI / 2 - alpha) / (2 * Math.PI);
	this.values('black.angle', values.black.angle);
	values.green.bottom = values.red.bottom + values.blue.left + values.blue.right;
	this.values('green.bottom', values.green.bottom);
	x = Math.sin(alpha);
	if(x != 0){
		y = values.blue.left / x;
		z = values.blue.left;
		sign = (values.blue.left >= 0 ? 1 : -1);
		values.green.left = (
			values.red.left + 
			values.blue.bottom + 
			(values.blue.top / x) + 
			sign * Math.sqrt(y*y - z*z)
		);
		this.values('green.left', values.green.left);
		values.green.top = (
			values.red.top + 
			(values.blue.left / x) + 
			(values.blue.right / x)
		);
		this.values('green.top', values.green.top);
		y = values.green.top;
		z = values.green.bottom;
		values.green.right = values.green.left - Math.sqrt(y*y - z*z);
		this.values('green.right', values.green.right);
	}
};

/**
 * Returns current shape jQuery element.
 * ---
 * @return jQuery
 **/
calculator.elem = function(){
	return $('.drawing-' + this.shape);
};

/**
 * Returns current shape legend attached jQuery element.
 * ---
 * @return jQuery
 **/
calculator.legend = function(){
	return $('.legend-' + this.shape);
};

/**
 * Returns some element(s) under current shape jQuery element.
 * ---
 * @param String selector
 * @return jQuery
 **/
calculator.find = function(selector){
	return this.elem().find(selector);
};

/**
 * Returns current shape jQuery inputs.
 * ---
 * @return jQuery
 **/
calculator.inputs = function(){
	return this.find('input');
};

/**
 * Get or defined zoom on shape area.
 * ---
 * @param Float x
 * @return Void|Float
 **/
calculator.zoom = function(x){
	if(this.__zoom === undefined){
		this.__zoom = 1;
	}
	if(x === undefined){
		return this.__zoom;
	}else{
		var elem = this.elem();
		var drawing = this.find('.drawing-scale');
		drawing.css('transform', '');
		var w = drawing.width();
		var h = drawing.height();
		var ew = elem.width();
		var print = false;
		if(x == 'auto'){
			x = 1;
		}else if(x == 'print'){
			x = 1;
			print = true;
		}else{
			x = Math.max(Math.min(x, 5), 0.5);
		}
		if(print){
			drawing.css('margin-top', '0px');
			drawing.css('margin-left', 'auto');
			elem.css('height', 'auto');
		}else{
			drawing.css('transform', 'scale(' + x + ')');
			var dleft = Math.abs(((ew - w)/2) - ((x-1) * h / 2));
			drawing.css('margin-top', '0px');
			drawing.css('margin-left', (100 * dleft / ew) + '%');
			elem.css('height', h * x);
			if(x != 'print'){
				this.__zoom = x;
			}
		}
	}
};

/**
 * Clear current shape dimensions.
 * ---
 * @return Void
 **/
calculator.clear = function(){
	this.zoom('auto');
	this.inputs().val('0.00');
};

/** 
 * Blend current shape input with 0 if empty or invalid.
 * ---
 * @return Void
 **/
calculator.fill = function(){
	var inputs = this.inputs();
	for(var i=0; i<inputs.length; i++){
		var input = inputs.eq(i);
		if(input.val()){
			input.val(parseFloat(input.val()).toFixed(2));
		}else{
			input.val('0.00');
		}
	}
};

/**
 * Returns shape input normalized name from input.
 * ---
 * @param jQuery input
 *		Drawing input.
 * @return String
 *		Normalized input name.
 **/
calculator.name = function(input){
	var style = input.attr('class').split('drawing-input-')[1].split(' ')[0].split('-');
	return style[0] + '.' + style[1];
};

/**
 * Returns input from normalized name.
 * ---
 * @param String name
 * @return jQuery
 **/
calculator.input = function(name){
	return this.find('.drawing-input-' + name.replace('.', '-'));
};

/**
 * Set get current shapes current values (dimensions).
 * ---
 * @param Object values
 *		Options to set some values.
 * @return Object|Void
 **/
calculator.values = function(values){
	// Getter
	if(values === undefined){
		this.fill();
		var values = {};
		var inputs = this.inputs();
		for(var i=0; i<inputs.length; i++){
			var input = inputs.eq(i);
			var style = this.name(input).split('.');
			if(!values[style[0]]){ values[style[0]] = {}; }
			values[style[0]][style[1]] = parseFloat(input.val());
		}
		return values;
	// Setter
	}else{
		// One
		if(typeof values == 'string'){
			var name = values;
			var value = arguments[1];
			if(!isNaN(value) && value >= 0){
				this.input(name).val(value.toFixed(2));
			}
		// Several
		}else{
			for(var i in values){
				if(typeof values[i] == 'object'){
					for(var j in values[i]){
						this.values(i + '.' + j, values[i][j]);
					}
				}else{
					this.values(i, values[i]);
				}
			}
		}
	}
};

/**
 * Change of shape displayed.
 * ---
 * @param String shape
 * @return Void
 **/
calculator.show = function(shape){
	this.elem().hide(0);
	this.legend().hide(0);
	this.shape = shape;
	this.elem().show(0);
	this.legend().show(0);
	$('.title').html(this.shapes[shape].title);
	this.zoom('auto');
};

/**
 * Print current page.
 * ---
 * @param Boolean e
 *		Optional. To apply treatments before print (`true`) or after (`false`).
 * @return Void
 **/
calculator.print = function(e){
	if(e === true){
		$('.tools').hide(0);
		$('.view').addClass('print');
		this.zoom('print');
	}else if(e === false){
		$('.tools').show(0);
		$('.view').removeClass('print');
		this.zoom(this.zoom());
	}else{
		window.print();
	}
};

/**
 * Initialize drawer/calculator.
 * ---
 * @return Void
 **/
calculator.init = function(){
	// Input change then recalculate current shape dimensions
	var initial = calculator.shape;
	for(var name in this.shapes){
		var shape = this.shapes[name];
		shape.name = name;
		$('.drawing-' + shape.name + ' input').on('change', (function(shape){
			return function(){
				calculator[shape]($(this));
			};
		})(shape.name));
		this.show(shape.name);
		this.clear();
	}
	calculator.show(initial);
	// Tools initialization
	$('.tools-clear').on('click', function(){
		calculator.clear();
	});
	$('.tools-print').on('click', function(){
		calculator.print();
	});
	$('.tools-zoomin').on('click', function(){
		calculator.zoom(calculator.zoom() + .25);
	});
	$('.tools-zoomout').on('click', function(){
		calculator.zoom(calculator.zoom() - .25);
	});
	$('.tools-triangle').on('click', function(){
		calculator.show('triangle');
	});
	$('.tools-trapeze').on('click', function(){
		calculator.show('trapeze');
	});
	// Print
	window.addEventListener('beforeprint', function(e){
		calculator.print(true);
	});
	window.addEventListener('afterprint', function(e){
		calculator.print(false);
	});
};

/**
 * Initialization !
 **/
$(function(){
	calculator.init();
});