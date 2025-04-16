function change() {
	let now_is = document.getElementById('header').textContent;
	if (now_is == 'Вход') {
		now_is = 'register';
	} else {
		now_is = 'login';
	}
	window.location.href = 'http://' + location.host + '/' + now_is;
}