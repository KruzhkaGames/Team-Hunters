function show_logo() {
	document.getElementById('logo').style.top = '0';
	document.getElementById('hint1img').style.left = '0';
	document.getElementById('hint2img').style.left = '0';
	document.getElementById('hint3img').style.left = '0';
	document.getElementById('hint1').style.left = '550px';
	document.getElementById('hint2').style.left = '550px';
	document.getElementById('hint3').style.left = '550px';
	document.getElementById('login').style.left = 'calc(50% - 250px)';
}


function login() {
	window.location.href = 'http://' + location.host + '/login';
}


window.onload = function() {
	hght = Number(getComputedStyle(document.getElementById('logo')).height.slice(0, -2));
	document.getElementById('hint1img').style.top = hght + 100 + 'px';
	document.getElementById('hint2img').style.top = hght + 600 + 'px';
	document.getElementById('hint3img').style.top = hght + 1100 + 'px';
	document.getElementById('hint1').style.top = hght + 100 + 'px';
	document.getElementById('hint2').style.top = hght + 600 + 'px';
	document.getElementById('hint3').style.top = hght + 1100 + 'px';
	document.getElementById('login').style.top = hght + 1700 + 'px';
	setTimeout(show_logo, 1000);
};