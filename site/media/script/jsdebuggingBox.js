function debuggingBox(activated, position, element_id) {
	this.debuggedData = {};
	this.position = position;
	this.element_id = element_id;
	container = document.createElement('div');
	container.id = element_id;
	this.activated = activated;

	if (position == 'top-left') {
		this.position_x = 0;
		this.position_y = 0;
	}

	container.style.cssText = "position: absolute; left: " + this.position_x + "; top: " + this.position_y + "; background: #DDF073;";
	this.container = container;

	window.onload = function() {
		if (activated) {
			document.body.appendChild(container);
		}
		
	};
}

debuggingBox.prototype.update = function(name, value) {
	if (!this.activated) {
		return false;
	}
	
	this.debuggedData[name] = value;
	this.render();
}

debuggingBox.prototype.render = function() {
	var list = document.createElement('ul');

	for (var key in this.debuggedData) {
		if (this.debuggedData.hasOwnProperty(key)) {
			var item = document.createElement('li');
			item.appendChild(document.createTextNode(key + ": " + this.debuggedData[key]));
			list.appendChild(item);
		}
	}

    this.container.innerHTML = list.innerHTML;
}
