function reload() {
	window.location.href = 'http://' + location.host + '/lobby';
}

window.onload = function() {setTimeout(reload, 15000);};