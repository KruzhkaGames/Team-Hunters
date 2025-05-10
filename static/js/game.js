function replace_img(old, new_img)
{
    let address = old.split('/');
    let result = '';
    for (let i=0; i<address.length-1; i++)
    {
        result += address[i] + '/';
    };
    result += new_img;
    return result;
};


// Сервер

window.current_player_status = 0;
window.got_info = 0;
window.game_code = Number(document.getElementsByTagName('body')[0].id);
window.player_id = Number(document.getElementsByTagName('head')[0].id);
window.other_players = [];
window.current_vote = 0;

window.socket = io.connect('http://' + location.host);

window.socket.on('audio_chunk', (data) => {
    if (data[0] == window.game_code)
    {
        if (data[2] == window.other_players[0][0])
        {
            const arrayBuffer = new Uint8Array(data[1]).buffer;
            chunkQueue[0].push(arrayBuffer);
            processQueue(0);
        } else if (data[2] == window.other_players[1][0])
        {
            const arrayBuffer = new Uint8Array(data[1]).buffer;
            chunkQueue[1].push(arrayBuffer);
            processQueue(1);
        } else if (data[2] == window.other_players[2][0])
        {
            const arrayBuffer = new Uint8Array(data[1]).buffer;
            chunkQueue[2].push(arrayBuffer);
            processQueue(2);
        };
    };
});

window.socket.on('starting', (data) => {
    if (window.current_player_status == 0 && data[0] == window.game_code)
    {
        window.current_player_status = 1;
        document.getElementById('waiting').style.top = '-250px';
        for (let i=0; i<data[2].length; i++)
        {
            if (data[2][i][0] != window.player_id)
            {
                window.other_players.push([data[2][i][0], data[2][i][1]]);
                if (window.other_players.length == 1)
                {
                    document.getElementById('left_name').innerHTML = data[2][i][1];
                    document.getElementById('left_hat').src = replace_img(document.getElementById('left_hat').src, 'left hat ' + data[2][i][2] + '.png');
                } else if (window.other_players.length == 2)
                {
                    document.getElementById('front_name').innerHTML = data[2][i][1];
                    document.getElementById('front_hat').src = replace_img(document.getElementById('front_hat').src, 'front hat ' + data[2][i][2] + '.png');
                } else
                {
                    document.getElementById('right_name').innerHTML = data[2][i][1];
                    document.getElementById('right_hat').src = replace_img(document.getElementById('right_hat').src, 'right hat ' + data[2][i][2] + '.png');
                };
            };
        };
        show_role(window.player_id == data[1]);
    };
});

window.socket.on('info', (data) => {
    if (window.current_player_status == 1 && data[0] == window.game_code)
    {
        window.current_player_status = 2;
        show_info(data[1]);
    };
});

window.socket.on('discuss', (data) => {
    if (window.current_player_status == 2 && data == window.game_code)
    {
        window.current_player_status = 3;

        document.getElementById('front_agent').style.left = 'calc(50% - 250px)';
        document.getElementById('left_agent').style.left = '0';
        document.getElementById('right_agent').style.left = 'calc(100% - 500px)';
        document.getElementById('front_name').style.left = 'calc(50% - 250px)';
        document.getElementById('left_name').style.left = '0';
        document.getElementById('right_name').style.left = 'calc(100% - 500px)';
        document.getElementById('front_hat').style.left = 'calc(50% - 250px)';
        document.getElementById('left_hat').style.left = '0';
        document.getElementById('right_hat').style.left = 'calc(100% - 500px)';
        document.getElementById('table').style.left = '0';
        if (window.got_info < 2)
        {
            document.getElementById('take_info').style.top = '0';
        };
        document.getElementById('take_info').style.backgroundColor = 'red';
        document.getElementById('cash').style.top = '120px';
        document.getElementById('cash_icon').style.top = '0';

        document.getElementById('take_info').onclick = function() {
            if (window.current_player_status == 2)
            {
                window.socket.emit('player get another info', [window.game_code, window.player_id]);
                document.getElementById('take_info').style.backgroundColor = 'lightgreen';
                window.current_player_status = 3;
            } else
            {
                window.socket.emit('player stop another info', [window.game_code, window.player_id]);
                document.getElementById('take_info').style.backgroundColor = 'red';
                window.current_player_status = 2;
            };
        };

        document.getElementById('take_vote').style.top = '0';
        document.getElementById('take_vote').onclick = function() {
            if (window.current_player_status == 2)
            {
                window.socket.emit('player get vote', [window.game_code, window.player_id]);
                document.getElementById('take_vote').style.backgroundColor = 'lightgreen';
                window.current_player_status = 4;
            } else
            {
                window.socket.emit('player stop vote', [window.game_code, window.player_id]);
                document.getElementById('take_vote').style.backgroundColor = 'red';
                window.current_player_status = 2;
            };
        };
    };
});

window.socket.on('new info', (data) => {
    if (window.current_player_status == 3 && data[0] == window.game_code)
    {
        show_new_info(data[1]);
    };
});

window.socket.on('start vote', (data) => {
    if (window.current_player_status == 4 && data[0] == window.game_code)
    {
        document.getElementById('cash').style.top = '-100%';
        document.getElementById('cash_icon').style.top = '-100%';
        document.getElementById('front_agent').style.left = '-100%';
        document.getElementById('left_agent').style.left = '-100%';
        document.getElementById('right_agent').style.left = '-100%';
        document.getElementById('front_name').style.left = '-100%';
        document.getElementById('left_name').style.left = '-100%';
        document.getElementById('right_name').style.left = '-100%';
        document.getElementById('front_hat').style.left = '-100%';
        document.getElementById('left_hat').style.left = '-100%';
        document.getElementById('right_hat').style.left = '-100%';
        document.getElementById('table').style.left = '-100%';
        document.getElementById('take_info').style.top = '-100%';
        document.getElementById('take_vote').style.top = '-100%';

        document.getElementById('vote').style.top = '0';
        document.getElementById('vote_1').style.top = '500px';
        document.getElementById('vote_1_img').style.top = '100px';
        document.getElementById('vote_2').style.top = '500px';
        document.getElementById('vote_2_img').style.top = '100px';
        document.getElementById('vote_3').style.top = '500px';
        document.getElementById('vote_3_img').style.top = '100px';

        document.getElementById('vote_1').innerHTML = window.other_players[0][1];
        document.getElementById('vote_2').innerHTML = window.other_players[1][1];
        document.getElementById('vote_3').innerHTML = window.other_players[2][1];

        document.getElementById('vote_1').onclick = function() {
            document.getElementById('vote_1').style.backgroundColor = 'lightgreen';
            document.getElementById('vote_2').style.backgroundColor = 'red';
            document.getElementById('vote_3').style.backgroundColor = 'red';
            window.current_vote = window.other_players[0][0];
            document.getElementById('complete_vote').style.top = '600px';
        };

        document.getElementById('vote_2').onclick = function() {
            document.getElementById('vote_1').style.backgroundColor = 'red';
            document.getElementById('vote_2').style.backgroundColor = 'lightgreen';
            document.getElementById('vote_3').style.backgroundColor = 'red';
            window.current_vote = window.other_players[1][0];
            document.getElementById('complete_vote').style.top = '600px';
        };

        document.getElementById('vote_3').onclick = function() {
            document.getElementById('vote_1').style.backgroundColor = 'red';
            document.getElementById('vote_2').style.backgroundColor = 'red';
            document.getElementById('vote_3').style.backgroundColor = 'lightgreen';
            window.current_vote = window.other_players[2][0];
            document.getElementById('complete_vote').style.top = '600px';
        };

        document.getElementById('complete_vote').onclick = function() {
            document.getElementById('vote').style.top = '-100%';
            document.getElementById('vote_1').style.top = '-100%';
            document.getElementById('vote_1_img').style.top = '-100%';
            document.getElementById('vote_2').style.top = '-100%';
            document.getElementById('vote_2_img').style.top = '-100%';
            document.getElementById('vote_3').style.top = '-100%';
            document.getElementById('vote_3_img').style.top = '-100%';
            document.getElementById('complete_vote').style.top = '-100%';

            window.current_player_status = 5;
            window.socket.emit('player voted', [window.game_code, window.player_id, window.current_vote]);
        };
    };
});

window.socket.on('vote result', (data) => {
    setTimeout(function() {
        if (window.current_player_status == 5 && data[0] == window.game_code)
        {
            document.getElementById('vote_result').style.top = '750px';
            document.getElementById('vote_result_img').style.top = '250px';

            res = document.getElementsByTagName('script')[0].id;
            for (let i=0; i<3; i++)
            {
                if (window.other_players[i][0] == data[2])
                {
                    res = window.other_players[i][1];
                };
            };

            document.getElementById('vote_result').innerHTML = res;
            document.getElementById('return').style.top = '850px';
            document.getElementById('return').onclick = function() {
                window.socket.emit('player quit', [window.game_code, window.player_id]);
                window.location.href = 'http://' + location.host + '/join';
            };

            if (data[1])
            {
                if (data[2] == window.player_id)
                {
                    document.getElementById('vote_result').style.color = 'red';
                    document.getElementById('cash').innerHTML = 'Твой выигрыш: 0';
                    document.getElementById('cash').style.top = '120px';
                    document.getElementById('cash_icon').style.top = '0';
                } else
                {
                    document.getElementById('vote_result').style.color = 'lightgreen';
                    document.getElementById('cash').innerHTML = 'Твой выигрыш: ' + (3 - window.got_info) * 50000;
                    document.getElementById('cash').style.top = '120px';
                    document.getElementById('cash_icon').style.top = '0';
                    window.socket.emit('get cash', [window.player_id, (3 - window.got_info) * 50000]);
                };
            } else
            {
                if (data[2] == window.player_id)
                {
                    document.getElementById('vote_result').style.color = 'lightgreen';
                    document.getElementById('cash').innerHTML = 'Твой выигрыш: ' + (3 - window.got_info) * 150000;
                    document.getElementById('cash').style.top = '120px';
                    document.getElementById('cash_icon').style.top = '0';
                    window.socket.emit('get cash', [window.player_id, (3 - window.got_info) * 150000]);
                } else
                {
                    document.getElementById('vote_result').style.color = 'red';
                    document.getElementById('cash').innerHTML = 'Твой выигрыш: 0';
                    document.getElementById('cash').style.top = '120px';
                    document.getElementById('cash_icon').style.top = '0';
                };
            };
        };
    }, 5000);
});


// Голосовой чат

let mediaRecorder;
let mediaSource = [undefined, undefined, undefined];
let sourceBuffer = [undefined, undefined, undefined];
let chunkQueue = [[], [], []];
let isBufferUpdating = [false, false, false];
let stream;
let audioContext = [undefined, undefined, undefined];
let analyser = [undefined, undefined, undefined];
let mediaElementSource = [undefined, undefined, undefined];
let animationFrameId = [undefined, undefined, undefined];

function initAudioAnalyser(index)
{
    audioContext[index] = new (window.AudioContext || window.webkitAudioContext)();
    analyser[index] = audioContext[index].createAnalyser();
    analyser[index].fftSize = 256;

    const player = document.getElementById('player_' + (index + 1));
    mediaElementSource[index] = audioContext[index].createMediaElementSource(player);
    mediaElementSource[index].connect(analyser[index]);
    analyser[index].connect(audioContext[index].destination);
};

function updateVolume(index) {
    if (!analyser[index]) return;

    const dataArray = new Uint8Array(analyser[index].frequencyBinCount);
    analyser[index].getByteFrequencyData(dataArray);
    
    let sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = Math.min((sum / dataArray.length) * 0.5, 100);
    
    if (volume <= 15)
    {
        document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src = replace_img(document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src, ['left agent a.png', 'front agent a.png', 'right agent a.png'][index]);
    } else if (volume <= 50)
    {
        document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src = replace_img(document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src, ['left agent b.png', 'front agent b.png', 'right agent b.png'][index]);
    } else
    {
        document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src = replace_img(document.getElementById(['left_agent', 'front_agent', 'right_agent'][index]).src, ['left agent c.png', 'front agent c.png', 'right agent c.png'][index]);
    };
    
    animationFrameId[index] = requestAnimationFrame(function() {updateVolume(index);});
};

function initMediaSource(index) {
    if (mediaSource[index])
    {
        if (mediaSource[index].readyState === 'open')
        {
            mediaSource[index].endOfStream();
        };
        URL.revokeObjectURL(mediaSource[index]);
    };
    mediaSource[index] = new MediaSource();
    const player = document.getElementById('player_' + (index + 1));
    player.src = URL.createObjectURL(mediaSource[index]);
    mediaSource[index].addEventListener('sourceopen', () => {
        if (sourceBuffer[index])
        {
            try
            {
                mediaSource[index].removeSourceBuffer(sourceBuffer[index]);
            } catch(e)
            {

            };
        };
        sourceBuffer[index] = mediaSource[index].addSourceBuffer('audio/webm; codecs=opus');
        sourceBuffer[index].mode = 'sequence';
        sourceBuffer[index].addEventListener('updateend', () => {
            isBufferUpdating[index] = false;
            processQueue(index);
        });
        processQueue(index);
    });
};

function processQueue(index) {
    if (!isBufferUpdating[index] && chunkQueue[index].length > 0)
    {
        isBufferUpdating[index] = true;
        const chunk = chunkQueue[index].shift();
        sourceBuffer[index].appendBuffer(chunk);
    };
};

async function startRecording() {
    try
    {
        initMediaSource(0);
        initMediaSource(1);
        initMediaSource(2);
        if (!stream)
        {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        };
        if (mediaRecorder)
        {
            mediaRecorder.stop();
        };
        mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm;codecs=opus'});
        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0)
            {
                const buffer = await event.data.arrayBuffer();
                socket.emit('audio_chunk', [window.game_code, Array.from(new Uint8Array(buffer)), window.player_id]);
            };
        };
        mediaRecorder.start(100);
    } catch(e)
    {
        console.error('Recording error:', e);
    };
};


// Игра

function start_discuss() {
    document.getElementById('info_paper').style.top = 'calc(50% - 240px)';
    document.getElementById('info_paper').style.left = '-100%';
    document.getElementById('info_folder').style.left = '-100%';
    document.getElementById('info_ok').style.left = '-100%';

    window.socket.emit('player start discuss', [window.game_code, window.player_id]);
};

function show_info_second() {
    document.getElementById('info_paper').style.top = 'calc(50% - 350px)';
    document.getElementById('info_ok').onclick = start_discuss;
};

function show_info(data) {
    let info = [];
    for (let i=0; i<4; i++) 
    {
        if (data[i][0] == window.player_id) {
            info = data[i];
            break;
        };
    };

    document.getElementById('info_paper').innerHTML = info[1];
    document.getElementById('info_folder').style.left = 'calc(50% - 250px)';
    document.getElementById('info_paper').style.left = 'calc(50% - 180px)';
    document.getElementById('info_ok').style.left = 'calc(50% - 200px)';

    setTimeout(show_info_second(), 2500);
};

function show_new_info_second() {
    window.current_player_status = 2;
    document.getElementById('cash').innerHTML = (3 - window.got_info) * 150000;
    document.getElementById('info_paper').style.top = 'calc(50% - 350px)';
    document.getElementById('info_ok').onclick = start_discuss;
};

function show_new_info(data) {
    window.got_info += 1;

    document.getElementById('cash').style.top = '-100%';
    document.getElementById('cash_icon').style.top = '-100%';
    document.getElementById('front_agent').style.left = '-100%';
    document.getElementById('left_agent').style.left = '-100%';
    document.getElementById('right_agent').style.left = '-100%';
    document.getElementById('front_name').style.left = '-100%';
    document.getElementById('left_name').style.left = '-100%';
    document.getElementById('right_name').style.left = '-100%';
    document.getElementById('front_hat').style.left = '-100%';
    document.getElementById('left_hat').style.left = '-100%';
    document.getElementById('right_hat').style.left = '-100%';
    document.getElementById('table').style.left = '-100%';
    document.getElementById('take_info').style.top = '-100%';
    document.getElementById('take_vote').style.top = '-100%';

    let info = [];
    for (let i=0; i<4; i++)
    {
        if (data[i][0] == window.player_id)
        {
            info = data[i];
            break;
        };
    };

    document.getElementById('info_paper').innerHTML = info[1];
    document.getElementById('info_folder').style.left = 'calc(50% - 250px)';
    document.getElementById('info_paper').style.left = 'calc(50% - 180px)';
    document.getElementById('info_ok').style.left = 'calc(50% - 200px)';

    setTimeout(show_new_info_second(), 2500);
};

function start_first_info() {
    document.getElementById('role_img').style.opacity = '0';
    document.getElementById('role_name').style.left = '-100%';
    document.getElementById('role_about').style.left = '-100%';
    document.getElementById('role_ok').style.left = '-100%';
    window.socket.emit('player get info', [window.game_code, window.player_id]);
};

function show_role(is_hunter) {
    let i = document.getElementById('role_img');
    let n = document.getElementById('role_name');
    let a = document.getElementById('role_about');
    if (is_hunter)
    {
        i.src = replace_img(i.src, 'team hunters.png');
        n.innerHTML = 'Team Hunters';
        n.style.color = 'red';
        a.innerHTML = 'Не дай секретным агентам себя арестовать!';
    };
    i.style.opacity = '1';
    n.style.left = '0';
    a.style.left = '0';
    document.getElementById('role_ok').style.left = 'calc(50% - 200px)';
    document.getElementById('role_ok').onclick = start_first_info;
};


window.onload = function() {
    window.socket.emit('player ready', [window.game_code, window.player_id]);
    try
    {
        startRecording();
        if (!audioContext[0]) initAudioAnalyser(0);
        cancelAnimationFrame(animationFrameId[0]);
        updateVolume(0);
        if (!audioContext[1]) initAudioAnalyser(1);
        cancelAnimationFrame(animationFrameId[1]);
        updateVolume(1);
        if (!audioContext[2]) initAudioAnalyser(2);
        cancelAnimationFrame(animationFrameId[2]);
        updateVolume(2);
    } catch (e)
    {
        console.log('Recording error: ' + e);
    };
};