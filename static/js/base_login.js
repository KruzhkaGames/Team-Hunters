function change() {
	let now_is = document.getElementById('header').textContent;
	if (now_is == 'Войти') {
		now_is = 'login';
	} else {
		now_is = 'register';
	}
	window.location.href = 'http://' + location.host + '/' + now_is;
}