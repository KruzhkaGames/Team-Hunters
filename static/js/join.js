window.onload = function() {
	let opened_hats = document.getElementsByTagName('body')[0].id.split(', ');
	let hats = [false, false];
	for (let i=0; i<2; i++)
	{
		hats[Number(opened_hats[i])] = true;
	};

	if (hats[0])
	{
		document.getElementById('hat_0_btn').style.backgroundColor = 'black';
		document.getElementById('hat_0_btn').innerHTML = 'Куплено';
	} else
	{
		document.getElementById('hat_0_btn').onclick = function() {
			if (Number(document.getElementById('cash').innerHTML.split(' ')[1]) >= 1000000)
			{
				fetch('http://' + location.host + '/buy', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json;charset=utf-8'
					},
					body: JSON.stringify({
						player_id: document.getElementsByTagName('head')[0].id,
						hat: 0
					})
				});
				window.location.href = 'http://' + location.host + '/join';
			};
		};
	};

	if (hats[1])
	{
		document.getElementById('hat_1_btn').style.backgroundColor = 'black';
		document.getElementById('hat_1_btn').innerHTML = 'Куплено';
	} else
	{
		document.getElementById('hat_1_btn').onclick = function() {
			if (Number(document.getElementById('cash').innerHTML.split(' ')[1]) >= 1000000)
			{
				fetch('http://' + location.host + '/buy', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json;charset=utf-8'
					},
					body: JSON.stringify({
						player_id: document.getElementsByTagName('head')[0].id,
						hat: 1
					})
				});
				window.location.href = 'http://' + location.host + '/join';
			};
		};
	};
};