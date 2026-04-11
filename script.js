// Expand Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.expand(); }

const GAS_URL = "https://script.google.com/macros/s/AKfycbwDm1-_EEAKgZKtA9QqFqJTUZ19NojCzEXFzF_rTrykLO61R7s3XeeWstBsf7sHh_c/exec";
const BOT_TOKEN = "8585254610:AAFc_o6XYUMwxI7CtWukxKcGcynKGQeMmrk";

// DOM Elements
const appContainer = document.querySelector('.app-container');
const trackListEl = document.getElementById('track-list');
const audioPlayer = document.getElementById('audio-player');
const vinylRecord = document.getElementById('vinyl-record');

const npTitle = document.getElementById('np-title');
const npArtist = document.getElementById('np-artist');
const npStatus = document.getElementById('np-status');
const playIcon = document.getElementById('play-icon');
const progressFill = document.getElementById('progress-fill');

const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const miniPlayIcon = document.getElementById('mini-play-icon');

let playlist = [];
let currentIndex = -1;
let isPlaying = false;

// 1. Inisialisasi Data
async function fetchSongs() {
    try {
        const response = await fetch(GAS_URL);
        playlist = await response.json();
        document.getElementById('loading-overlay').style.display = 'none';
        
        if (playlist.length > 0) renderTable();
        else trackListEl.innerHTML = '<p style="text-align:center; padding: 20px;">Database kosong.</p>';
    } catch (e) {
        document.getElementById('loading-overlay').innerHTML = '<p>Gagal memuat data.</p>';
    }
}

// 2. Render List Lagu
function renderTable() {
    trackListEl.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'track-item';
        li.id = `track-${index}`;
        const cleanTitle = song.judul.replace('.mp3', '');
        
        li.innerHTML = `
            <div class="thumb">${cleanTitle.charAt(0)}</div>
            <div class="info">
                <h3>${cleanTitle}</h3>
                <p>${song.penyanyi}</p>
            </div>
            <span class="material-icons-round" style="color:#dfe4ea;">play_circle_outline</span>
        `;
        li.onclick = () => playSong(index);
        trackListEl.appendChild(li);
    });
}

// 3. UI Transisi (Buka/Tutup Layar Full Player)
function openPlayer() { appContainer.classList.add('player-active'); }
document.getElementById('btn-back').onclick = (e) => { 
    e.stopPropagation(); 
    appContainer.classList.remove('player-active'); 
};
// Buka player saat mini player di klik
miniPlayer.onclick = openPlayer;
// Cegah buka player saat tombol pause di mini player diklik
document.getElementById('btn-mini-play').onclick = (e) => {
    e.stopPropagation();
    togglePlayPause();
};

// 4. Putar Lagu
async function playSong(index) {
    if (index < 0 || index >= playlist.length) return;
    
    if (currentIndex !== -1) document.getElementById(`track-${currentIndex}`).classList.remove('playing');
    currentIndex = index;
    const song = playlist[currentIndex];
    document.getElementById(`track-${currentIndex}`).classList.add('playing');

    const cleanTitle = song.judul.replace('.mp3', '');
    npTitle.innerText = cleanTitle;
    npArtist.innerText = song.penyanyi;
    miniTitle.innerText = cleanTitle;
    
    npStatus.innerText = "Meminta akses...";
    npStatus.style.background = "#f1c40f";
    
    // Tampilkan mini player & buka full player
    miniPlayer.classList.remove('hidden');
    openPlayer();
    
    // Animasi putar dimulai
    vinylRecord.classList.add('spinning');
    vinylRecord.classList.remove('paused');
    
    playIcon.innerText = "hourglass_empty";
    miniPlayIcon.innerText = "hourglass_empty";
    audioPlayer.src = ""; 
    progressFill.style.width = "0%";
    isPlaying = true;

    try {
        const tgApi = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${song.file_id}`;
        const response = await fetch(tgApi);
        const data = await response.json();

        if (data.ok) {
            audioPlayer.src = `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
            audioPlayer.play();
            npStatus.innerText = "Sedang diputar";
            npStatus.style.background = "#2ed573";
            npStatus.style.color = "white";
            playIcon.innerText = "pause";
            miniPlayIcon.innerText = "pause";
        } else {
            throw new Error("File ditolak Telegram");
        }
    } catch (error) {
        npStatus.innerText = "Gagal memutar (>20MB)";
        npStatus.style.background = "#ff4757";
        npStatus.style.color = "white";
        playIcon.innerText = "play_arrow";
        miniPlayIcon.innerText = "play_arrow";
        vinylRecord.classList.remove('spinning');
        isPlaying = false;
    }
}

// 5. Play/Pause Control
function togglePlayPause() {
    if (currentIndex === -1) return;
    if (isPlaying) {
        audioPlayer.pause();
        vinylRecord.classList.add('paused'); // Hentikan putaran
        playIcon.innerText = "play_arrow";
        miniPlayIcon.innerText = "play_arrow";
        npStatus.innerText = "Dijeda";
        npStatus.style.background = "#f1f2f6";
        npStatus.style.color = "#57606f";
    } else {
        audioPlayer.play();
        vinylRecord.classList.remove('paused'); // Lanjutkan putaran
        playIcon.innerText = "pause";
        miniPlayIcon.innerText = "pause";
        npStatus.innerText = "Sedang diputar";
        npStatus.style.background = "#2ed573";
        npStatus.style.color = "white";
    }
    isPlaying = !isPlaying;
}

// 6. Next / Prev / Progress
function playNext() { if (playlist.length > 0) playSong((currentIndex + 1) % playlist.length); }
function playPrev() { if (playlist.length > 0) playSong((currentIndex - 1 + playlist.length) % playlist.length); }

audioPlayer.ontimeupdate = () => {
    if (!isNaN(audioPlayer.duration)) {
        progressFill.style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
    }
};

audioPlayer.onended = playNext;
document.getElementById('btn-play').onclick = togglePlayPause;
document.getElementById('btn-next').onclick = playNext;
document.getElementById('btn-prev').onclick = playPrev;

fetchSongs();
