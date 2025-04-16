let mediaRecorder, socket, mediaSource, sourceBuffer, chunkQueue = [], isBufferUpdating = false, stream;

function initMediaSource() {
    if (mediaSource) {
        if (mediaSource.readyState === 'open') {mediaSource.endOfStream();}
        URL.revokeObjectURL(mediaSource);
    }
    mediaSource = new MediaSource();
    const player = document.getElementById('player');
    player.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', () => {
        if (sourceBuffer) {
            try {
                mediaSource.removeSourceBuffer(sourceBuffer);
            } catch(e) {}
        }
        sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
        sourceBuffer.mode = 'sequence';
        sourceBuffer.addEventListener('updateend', () => {
            isBufferUpdating = false;
            processQueue();
        });
        processQueue();
    });
}

function processQueue() {
    if (!isBufferUpdating && chunkQueue.length > 0) {
        isBufferUpdating = true;
        const chunk = chunkQueue.shift();
        sourceBuffer.appendBuffer(chunk);
    }
}

function initSocket() {
    socket = io.connect('http://' + location.host);
    socket.on('audio_chunk', (data) => {
        if (data[0] == Number(document.getElementsByTagName('body')[0].id)) {
            const arrayBuffer = new Uint8Array(data[1]).buffer;
            chunkQueue.push(arrayBuffer);
            processQueue();
        }
    });
}

async function startRecording() {
    try {
        initMediaSource();
        if (!stream) {stream = await navigator.mediaDevices.getUserMedia({ audio: true });}
        if (mediaRecorder) {mediaRecorder.stop();}
        mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm;codecs=opus'});
        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                const buffer = await event.data.arrayBuffer();
                socket.emit('audio_chunk', [Number(document.getElementsByTagName('body')[0].id), Array.from(new Uint8Array(buffer))]);
            }
        };
        mediaRecorder.start(100);
    } catch(e) {console.error('Recording error:', e);}
}

initSocket();
startRecording();