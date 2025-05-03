// Голосовой чат (я просто не вдупляю что это за бред сумасшедшего)

let mediaRecorder;
let socket;
let mediaSource;
let sourceBuffer;
let chunkQueue = [];
let isBufferUpdating = false;
let stream;

function initMediaSource() {
    if (mediaSource) {if (mediaSource.readyState === 'open') {mediaSource.endOfStream();} URL.revokeObjectURL(mediaSource);}
    mediaSource = new MediaSource(); const player = document.getElementById('player'); player.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', () => {
        if (sourceBuffer) {try {mediaSource.removeSourceBuffer(sourceBuffer);} catch(e) {}}
        sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
        sourceBuffer.mode = 'sequence'; sourceBuffer.addEventListener('updateend', () => { isBufferUpdating = false; processQueue();});
        processQueue();});
}

function processQueue() {if (!isBufferUpdating && chunkQueue.length > 0) {isBufferUpdating = true; const chunk = chunkQueue.shift(); sourceBuffer.appendBuffer(chunk);}}

function initSocket() {
    socket = io.connect('http://' + location.host);
    socket.on('audio_chunk', (data) => {
        if (data[0] == Number(document.getElementsByTagName('body')[0].id)) {const arrayBuffer = new Uint8Array(data[1]).buffer; chunkQueue.push(arrayBuffer); processQueue();}});
}

async function startRecording() {
    try {initMediaSource(); if (!stream) {stream = await navigator.mediaDevices.getUserMedia({ audio: true });}
        if (mediaRecorder) {mediaRecorder.stop();} mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm;codecs=opus'});
        mediaRecorder.ondataavailable = async (event) => {if (event.data.size > 0) {const buffer = await event.data.arrayBuffer(); socket.emit('audio_chunk', [Number(document.getElementsByTagName('body')[0].id), Array.from(new Uint8Array(buffer))]);}};
        mediaRecorder.start(100); } catch(e) {console.error('Recording error:', e);}
}


// Игра

function start_discuss() {
    let player_id = Number(document.getElementsByTagName('head')[0].id);
    let game_code = Number(document.getElementsByTagName('body')[0].id);
    document.getElementById('info_paper').style.top = 'calc(50% - 240px)';
    document.getElementById('info_paper').style.left = '-100%';
    document.getElementById('info_folder').style.left = '-100%';
    document.getElementById('info_ok').style.left = '-100%';
    socket.emit('player start discuss', [game_code, player_id]);
    socket.on('discuss', (data) => {
        document.getElementById('front_agent').style.top = 'calc(50% - 250px)';
    });
}

function show_info_second() {
    document.getElementById('info_paper').style.top = 'calc(50% - 350px)';
    document.getElementById('info_ok').onclick = start_discuss();
}

function show_info(data) {
    let player_id = Number(document.getElementsByTagName('head')[0].id);
    let info = [];
    for (let i=0; i<4; i++) {
        if (data[i][0] == player_id) {
            info = data[i];
            break;
        }
    }
    document.getElementById('info_paper').innerHTML = info[1];
    document.getElementById('info_folder').style.left = 'calc(50% - 250px)';
    document.getElementById('info_paper').style.left = 'calc(50% - 180px)';
    document.getElementById('info_ok').style.left = 'calc(50% - 200px)';
    setTimeout(show_info_second(), 1200);
}

function start_first_info() {
    let player_id = Number(document.getElementsByTagName('head')[0].id);
    let game_code = Number(document.getElementsByTagName('body')[0].id);
    document.getElementById('role_img').style.opacity = '0';
    document.getElementById('role_name').style.left = '-100%';
    document.getElementById('role_about').style.left = '-100%';
    document.getElementById('role_ok').style.left = '-100%';
    socket.emit('player get info', [game_code, player_id]);
    socket.on('info', (data) => {show_info(data);});
}

function show_role(is_hunter) {
    let i = document.getElementById('role_img');
    let n = document.getElementById('role_name');
    let a = document.getElementById('role_about');
    if (is_hunter) {
        i.src = '{{url_for("static", filename="img/team hunters.png")}}';
        n.innerHTML = 'Team Hunters';
        n.style.color = 'red';
        a.innerHTML = 'Не дай секретным агентам себя арестовать!';
    }
    i.style.opacity = '1';
    n.style.left = '0';
    a.style.left = '0';
    document.getElementById('role_ok').style.left = 'calc(50% - 200px)';
    document.getElementById('role_ok').onclick = start_first_info();
}


function start_game() {
    console.log(document.getElementsByTagName('head')[0].id, document.getElementsByTagName('body')[0].id);
    let player_id = Number(document.getElementsByTagName('head')[0].id);
    let game_code = Number(document.getElementsByTagName('body')[0].id);
    console.log(player_id, game_code);
    let is_hunter = false;
    socket.emit('player ready', [game_code, player_id]);
    socket.on('starting', (data) => {if (player_id == data[0]) {is_hunter = true;};
        document.getElementById('waiting').style.top = '-250px';
        show_role(is_hunter);});
}


window.onload = function() {
    initSocket();
    try {startRecording();} catch (e) {console.log('Recording error: ' + e);};
    start_game();
};