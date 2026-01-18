import './style.css'
import { tracks } from './data.js'

// State
let currentTrackIndex = -1;
let isPlaying = false;
const audio = new Audio();

// DOM Elements
const gridEl = document.querySelector('#track-grid');
const playerBar = document.querySelector('#player-bar');
const pTitle = document.querySelector('#p-title');
const pArtist = document.querySelector('#p-artist');
const pArt = document.querySelector('#p-art');
const btnPlay = document.querySelector('#btn-play');
const btnNext = document.querySelector('#btn-next');
const btnPrev = document.querySelector('#btn-prev');
const btnClose = document.querySelector('#btn-close');
const iconPlay = document.querySelector('#icon-play');
const iconPause = document.querySelector('#icon-pause');
const progressContainer = document.querySelector('#progress-container');

// Initialize Grid
function renderGrid() {
  gridEl.innerHTML = tracks.map((track, index) => `
    <div class="track-item ${index === currentTrackIndex && isPlaying ? 'playing' : ''}" data-index="${index}">
      <div class="img-container">
        <img src="${track.image}" alt="${track.title}" />
      </div>
      <div class="track-meta">
        <div class="track-title">
          ${track.title}
          ${track.url ? `
            <a href="${track.url}" target="_blank" class="sc-badge" title="Open in SoundCloud" onclick="event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.91 6.55a4.29 4.29 0 0 0-4.32 4.27v1.89h-.08a1.95 1.95 0 1 0 0 3.89h10.63a4.86 4.86 0 1 0 0-9.71 4.79 4.79 0 0 0-1.89.38 4.29 4.29 0 0 0-4.34-.72ZM.61 11.23V14a.61.61 0 1 0 1.22 0v-2.77a.61.61 0 1 0-1.22 0Zm2.36-1.57V14.1a.61.61 0 1 0 1.22 0v-4.44a.61.61 0 1 0-1.22 0Zm2.36-.61V14.1a.61.61 0 1 0 1.23 0V9.05a.61.61 0 1 0-1.23 0Zm2.35-.38V14.1a.62.62 0 1 0 1.24 0V8.67a.62.62 0 1 0-1.24 0Z"/></svg>
            </a>
          ` : ''}
        </div>
        <div class="track-artist">${track.artist}</div>
        <div class="play-icon">
          ${index === currentTrackIndex && isPlaying ? '||' : '▶'}
        </div>
      </div>
    </div>
  `).join('');

  // Attach events
  document.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      if (currentTrackIndex === index) {
        // Toggle if same track
        togglePlay();
      } else {
        // New track
        playTrack(index);
      }
    });
  });
}

// Generate Waveform UI
// Seeded random number generator
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate Hash from String
function getHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Generate Waveform UI
function renderWaveform(track) {
  const bars = 40; // Fewer bars for wider feel
  let html = '';

  // Use track title as seed base, or random if no track
  let seed = track ? getHash(track.title) : Math.random() * 1000;

  for (let i = 0; i < bars; i++) {
    // If no track, make it flat with very low height
    if (!track) {
      html += `<div class="waveform-bar" style="height: 5%" data-index="${i}"></div>`;
      continue;
    }

    // Generate seeded random height
    const randomVal = seededRandom(seed + i);

    // Height between 20% and 100% to ensure no "invisible" bars
    const height = 20 + randomVal * 80;
    html += `<div class="waveform-bar" style="height: ${height}%" data-index="${i}"></div>`;
  }
  progressContainer.innerHTML = html;
}

// Player Logic
function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;

  currentTrackIndex = index;
  const track = tracks[index];

  // Update Audio
  if (audio.src !== window.location.origin + track.audio) { // Only reload if new track
    audio.src = track.audio;
    renderWaveform(track); // Update waveform for new track
  }

  audio.play().then(() => {
    isPlaying = true;
    updateUI();
  }).catch(e => console.error("Playback failed:", e));
}

function togglePlay() {
  if (currentTrackIndex === -1) return;

  if (audio.paused) {
    audio.play();
    isPlaying = true;
  } else {
    audio.pause();
    isPlaying = false;
  }
  updateUI();
}

function nextTrack() {
  let next = currentTrackIndex + 1;
  if (next >= tracks.length) next = 0; // Loop
  playTrack(next);
}

function prevTrack() {
  let prev = currentTrackIndex - 1;
  if (prev < 0) prev = tracks.length - 1; // Loop
  playTrack(prev);
}

function closePlayer() {
  audio.pause();
  isPlaying = false;
  currentTrackIndex = -1;
  // On desktop, we don't really close it, we just reset it. 
  // But on mobile we might hide it.
  updateUI();
}

function updateUI() {
  // Update Play Button
  if (isPlaying) {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
  } else {
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
  }

  // Update Meta if track selected
  const scLink = document.getElementById('player-sc-link');

  if (currentTrackIndex !== -1) {
    const track = tracks[currentTrackIndex];
    pTitle.textContent = track.title;
    pArtist.textContent = track.artist;
    pArt.src = track.image;
    pArt.style.visibility = 'visible';
    pArt.style.opacity = '1';

    // Update SC Link
    if (track.url) {
      scLink.href = track.url;
      scLink.style.display = 'flex';
      scLink.style.visibility = 'visible';
    } else {
      scLink.style.display = 'none';
    }

  } else {
    // Hide art if no track
    pArt.removeAttribute('src');
    pArt.style.visibility = 'hidden';
    pArt.style.opacity = '0';
    pTitle.textContent = 'Select a track';
    pArtist.textContent = 'vjvidly';

    // Hide SC Link
    if (scLink) scLink.style.visibility = 'hidden';
  }

  // Update Grid
  renderGrid();
}

// Click on waveform to seek
progressContainer.addEventListener('click', (e) => {
  if (currentTrackIndex === -1) return;
  const rect = progressContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = x / rect.width;

  if (audio.duration) {
    audio.currentTime = percent * audio.duration;
    // Force immediate UI update for bars
    updateBars(percent);
    // Clear preview immediately on click
    const bars = document.querySelectorAll('.waveform-bar');
    bars.forEach(bar => bar.classList.remove('preview'));
  }
});

function updateBars(percent) {
  const bars = document.querySelectorAll('.waveform-bar');
  const activeCount = Math.floor(percent * bars.length);
  bars.forEach((bar, i) => {
    if (i <= activeCount) {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  });
}

// Global update listener
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const percent = audio.currentTime / audio.duration;
  updateBars(percent);
});

audio.addEventListener('ended', nextTrack);

// Click on waveform to seek
// (Combined above into the simplified updateBars)

// SoundCloud-style Hover Preview
progressContainer.addEventListener('mousemove', (e) => {
  if (currentTrackIndex === -1) return;
  const rect = progressContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const hoverPercent = x / rect.width;

  const currentPercent = audio.duration ? (audio.currentTime / audio.duration) : 0;
  const bars = document.querySelectorAll('.waveform-bar');
  const hoverIndex = Math.floor(hoverPercent * bars.length);
  const currentIndex = Math.floor(currentPercent * bars.length);

  bars.forEach((bar, i) => {
    // Show preview for the range between current and hover
    const inRange = (i > Math.min(currentIndex, hoverIndex) && i <= Math.max(currentIndex, hoverIndex));

    if (inRange) {
      bar.classList.add('preview');
    } else {
      bar.classList.remove('preview');
    }
  });
});

progressContainer.addEventListener('mouseleave', () => {
  const bars = document.querySelectorAll('.waveform-bar');
  bars.forEach(bar => bar.classList.remove('preview'));
});

// Controls Events
btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);
btnClose.addEventListener('click', closePlayer);

// Init
renderWaveform(null);
renderGrid();
updateUI();
