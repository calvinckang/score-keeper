const scoreA = document.getElementById('score-a');
const scoreB = document.getElementById('score-b');
const STORAGE_KEY = 'scoreKeeper';
const THEME_STORAGE_KEY = 'scoreKeeperTheme';

// Audio System - Lightweight Web Audio API
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Bird chirp sound for + button (more realistic bird tweet)
function playChirp() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create main chirp oscillator
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const gain2 = ctx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gain2);
    gainNode.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    // Main oscillator: rapid pitch changes for "chirp-chirp" effect
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2000, now);
    osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.03); // Quick rise
    osc1.frequency.exponentialRampToValueAtTime(2800, now + 0.05); // Small dip
    osc1.frequency.exponentialRampToValueAtTime(3500, now + 0.08); // Second peak
    osc1.frequency.exponentialRampToValueAtTime(2500, now + 0.12); // Fall off
    
    // Harmonic oscillator for richness (octave higher, quieter)
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4000, now);
    osc2.frequency.exponentialRampToValueAtTime(6400, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(5600, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(7000, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(5000, now + 0.12);
    
    // Main chirp envelope - quick attack and decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gainNode.gain.linearRampToValueAtTime(0.10, now + 0.03);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.09, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
    
    // Harmonic envelope (quieter)
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
    
    osc1.start(now);
    osc1.stop(now + 0.13);
    osc2.start(now);
    osc2.stop(now + 0.13);
}

// Subtle explosion sound for - button
function playExplosion() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create noise buffer for explosion effect
    const bufferSize = ctx.sampleRate * 0.15; // 150ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise with decay
    for (let i = 0; i < bufferSize; i++) {
        const decay = 1 - (i / bufferSize);
        data[i] = (Math.random() * 2 - 1) * decay;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Add low-pass filter for more muffled, subtle effect
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    const gainNode = ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Very subtle volume
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.start(now);
    noise.stop(now + 0.15);
}

// Theme Toggle System
const themeToggle = document.getElementById('theme-toggle-checkbox');

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
}

function saveTheme(isDark) {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        saveTheme(true);
    } else {
        document.body.classList.remove('dark-mode');
        saveTheme(false);
    }
});

// Load theme on page load
loadTheme();

function saveScores() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scoreA: parseInt(scoreA.textContent),
        scoreB: parseInt(scoreB.textContent)
    }));
}

function loadScores() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const { scoreA: a, scoreB: b } = JSON.parse(saved);
        scoreA.textContent = a;
        scoreB.textContent = b;
    }
}

loadScores();

// Bird Animation System
const birdsContainer = document.getElementById('birds-container');
const cloudsContainer = document.getElementById('clouds-container');
let blueBirds = [];
let redBirds = [];

// Create SVG for red bird (Type 1 - rounder shape)
function createRedBirdSVG() {
    return `
        <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- 3D Gradients for body -->
                <radialGradient id="redBodyGrad" cx="35%" cy="30%">
                    <stop offset="0%" style="stop-color:#ff6b77;stop-opacity:1" />
                    <stop offset="40%" style="stop-color:#e63946;stop-opacity:1" />
                    <stop offset="85%" style="stop-color:#c1121f;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#a01018;stop-opacity:1" />
                </radialGradient>
                
                <!-- 3D Gradients for head -->
                <radialGradient id="redHeadGrad" cx="40%" cy="25%">
                    <stop offset="0%" style="stop-color:#ff7882;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#e63946;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#b81825;stop-opacity:1" />
                </radialGradient>
                
                <!-- 3D Wing gradient -->
                <linearGradient id="redWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#d62838;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#c1121f;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8b0e17;stop-opacity:1" />
                </linearGradient>
                
                <!-- Beak gradient -->
                <linearGradient id="redBeakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#ff9500;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#cc7700;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Body with 3D gradient -->
            <ellipse cx="20" cy="15" rx="10" ry="8" fill="url(#redBodyGrad)"/>
            
            <!-- Body highlight -->
            <ellipse cx="18" cy="13" rx="4" ry="3" fill="#ff8b94" opacity="0.5"/>
            
            <!-- Head with 3D gradient -->
            <circle cx="28" cy="12" r="6" fill="url(#redHeadGrad)"/>
            
            <!-- Head highlight -->
            <circle cx="26.5" cy="10.5" r="2.5" fill="#ff9aa1" opacity="0.6"/>
            
            <!-- Beak with gradient -->
            <path d="M 33 12 L 38 11 L 38 12.5 L 33 13 Z" fill="url(#redBeakGrad)"/>
            <path d="M 33 12 L 38 11 L 35.5 11.5 Z" fill="#ffb84d" opacity="0.7"/>
            
            <!-- Eye white -->
            <circle cx="30" cy="11" r="2" fill="#ffffff"/>
            <!-- Eye pupil -->
            <circle cx="30.5" cy="11" r="1.5" fill="#1a1a1a"/>
            <!-- Eye shine -->
            <circle cx="30.8" cy="10.5" r="0.6" fill="#ffffff"/>
            
            <!-- Wings (animated) with 3D effect -->
            <g class="wing">
                <ellipse cx="15" cy="15" rx="8" ry="4" fill="url(#redWingGrad)" transform-origin="15 15"/>
                <ellipse cx="14" cy="14" rx="5" ry="2" fill="#e63946" opacity="0.4" transform-origin="15 15"/>
            </g>
            
            <!-- Tail with layered effect -->
            <path d="M 10 15 L 5 12 L 8 15 L 5 18 Z" fill="#8b0e17"/>
            <path d="M 10 15 L 6 13 L 8 15 L 6 17 Z" fill="#c1121f"/>
            <path d="M 10 15 L 7 14 L 8.5 15 L 7 16 Z" fill="#d62838" opacity="0.6"/>
        </svg>
    `;
}

// Create SVG for blue bird (Type 2 - similar rounded shape, slightly different proportions)
function createBlueBirdSVG() {
    return `
        <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- 3D Gradients for body -->
                <radialGradient id="blueBodyGrad" cx="35%" cy="30%">
                    <stop offset="0%" style="stop-color:#64b5f6;stop-opacity:1" />
                    <stop offset="40%" style="stop-color:#1e88e5;stop-opacity:1" />
                    <stop offset="85%" style="stop-color:#1565c0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0d47a1;stop-opacity:1" />
                </radialGradient>
                
                <!-- 3D Gradients for head -->
                <radialGradient id="blueHeadGrad" cx="40%" cy="25%">
                    <stop offset="0%" style="stop-color:#7fc3ff;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#1e88e5;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0d5ba8;stop-opacity:1" />
                </radialGradient>
                
                <!-- 3D Wing gradient -->
                <linearGradient id="blueWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#2196f3;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#1565c0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0a3d7a;stop-opacity:1" />
                </linearGradient>
                
                <!-- Beak gradient -->
                <linearGradient id="blueBeakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#ff9500;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#cc7700;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Body with 3D gradient (slightly more elongated) -->
            <ellipse cx="19" cy="15" rx="11" ry="7" fill="url(#blueBodyGrad)"/>
            
            <!-- Body highlight -->
            <ellipse cx="17" cy="13" rx="5" ry="3" fill="#90caf9" opacity="0.5"/>
            
            <!-- Head with 3D gradient (slightly smaller) -->
            <circle cx="27" cy="13" r="5.5" fill="url(#blueHeadGrad)"/>
            
            <!-- Head highlight -->
            <circle cx="25.5" cy="11.5" r="2.2" fill="#a5d6ff" opacity="0.6"/>
            
            <!-- Beak with gradient (pointer) -->
            <path d="M 31.5 13 L 37 12 L 37 13.5 L 31.5 14 Z" fill="url(#blueBeakGrad)"/>
            <path d="M 31.5 13 L 37 12 L 34.2 12.3 Z" fill="#ffb84d" opacity="0.7"/>
            
            <!-- Eye white -->
            <circle cx="29" cy="12" r="2" fill="#ffffff"/>
            <!-- Eye pupil -->
            <circle cx="29.5" cy="12" r="1.5" fill="#1a1a1a"/>
            <!-- Eye shine -->
            <circle cx="29.8" cy="11.5" r="0.6" fill="#ffffff"/>
            
            <!-- Wings (animated, more triangular) with 3D effect -->
            <g class="wing">
                <ellipse cx="14" cy="15" rx="7" ry="5" fill="url(#blueWingGrad)" transform-origin="14 15"/>
                <ellipse cx="13" cy="14" rx="4.5" ry="2.5" fill="#2196f3" opacity="0.4" transform-origin="14 15"/>
            </g>
            
            <!-- Tail with layered effect (more pointed) -->
            <path d="M 9 15 L 4 13 L 7 15 L 4 17 Z" fill="#0a3d7a"/>
            <path d="M 9 15 L 5 13.5 L 7 15 L 5 16.5 Z" fill="#1565c0"/>
            <path d="M 9 15 L 6 14 L 7.5 15 L 6 16 Z" fill="#2196f3" opacity="0.6"/>
        </svg>
    `;
}

function createBird(isBlue) {
    const bird = document.createElement('div');
    bird.className = 'bird';
    bird.dataset.birdType = isBlue ? 'blue' : 'red';
    
    bird.innerHTML = isBlue ? createBlueBirdSVG() : createRedBirdSVG();
    
    // Random direction (left-to-right or right-to-left)
    const flyingRight = Math.random() < 0.5;
    bird.classList.add(flyingRight ? 'flying-right' : 'flying-left');
    
    // Random flight path with vertical movement
    // 75% chance to avoid center (cards area), 25% can pass through
    const avoidCenter = Math.random() < 0.75;
    let startTop, midTop, endTop;
    
    if (avoidCenter) {
        // Create arcing paths that go above or below center
        const arcAbove = Math.random() < 0.5;
        
        if (arcAbove) {
            // Arc above the center (through top area)
            startTop = 30 + Math.random() * 40;    // Start mid 30-70%
            midTop = 5 + Math.random() * 20;       // Peak at top 5-25%
            endTop = 30 + Math.random() * 40;      // End mid 30-70%
        } else {
            // Arc below the center (through bottom area)
            startTop = 30 + Math.random() * 40;    // Start mid 30-70%
            midTop = 75 + Math.random() * 20;      // Peak at bottom 75-95%
            endTop = 30 + Math.random() * 40;      // End mid 30-70%
        }
    } else {
        // Occasionally allow varied paths including through center
        startTop = 10 + Math.random() * 80;
        midTop = 10 + Math.random() * 80;
        endTop = 10 + Math.random() * 80;
    }
    
    bird.style.setProperty('--start-top', startTop + '%');
    bird.style.setProperty('--mid-top', midTop + '%');
    bird.style.setProperty('--end-top', endTop + '%');
    
    // Random flight duration (8-15 seconds for continuous loop)
    const duration = 8 + Math.random() * 7;
    bird.style.setProperty('--fly-duration', duration + 's');
    
    // Add flapping animation
    bird.classList.add(Math.random() < 0.5 ? 'flap-down' : 'flap-up');
    
    // Add to container
    birdsContainer.appendChild(bird);
    
    // Restart animation when it completes (loop)
    const restartAnimation = () => {
        // Reset positions with arcing paths to avoid center
        const avoidCenter = Math.random() < 0.75;
        let newStartTop, newMidTop, newEndTop;
        
        if (avoidCenter) {
            const arcAbove = Math.random() < 0.5;
            
            if (arcAbove) {
                newStartTop = 30 + Math.random() * 40;
                newMidTop = 5 + Math.random() * 20;
                newEndTop = 30 + Math.random() * 40;
            } else {
                newStartTop = 30 + Math.random() * 40;
                newMidTop = 75 + Math.random() * 20;
                newEndTop = 30 + Math.random() * 40;
            }
        } else {
            newStartTop = 10 + Math.random() * 80;
            newMidTop = 10 + Math.random() * 80;
            newEndTop = 10 + Math.random() * 80;
        }
        
        bird.style.setProperty('--start-top', newStartTop + '%');
        bird.style.setProperty('--mid-top', newMidTop + '%');
        bird.style.setProperty('--end-top', newEndTop + '%');
        
        const newDuration = 8 + Math.random() * 7;
        bird.style.setProperty('--fly-duration', newDuration + 's');
        
        // Reset bird to starting position (off-screen) before restarting
        bird.style.animation = 'none';
        bird.style.opacity = '0';
        
        // Force reflow to apply the animation:none immediately
        bird.offsetHeight;
        
        // Position bird at the starting position (off-screen)
        if (bird.classList.contains('flying-right')) {
            bird.style.left = '-60px';
        } else {
            bird.style.left = 'calc(100% + 60px)';
        }
        bird.style.top = newStartTop + '%';
        
        // Wait a frame, then restart animation and make visible
        requestAnimationFrame(() => {
            bird.style.left = '';  // Remove inline style to let animation take over
            bird.style.top = '';   // Remove inline style to let animation take over
            bird.style.animation = '';
            bird.style.opacity = '1';
            bird.timeoutId = setTimeout(restartAnimation, newDuration * 1000);
        });
    };
    
    bird.timeoutId = setTimeout(restartAnimation, duration * 1000);
    
    return bird;
}

function createExplosion(x, y, color) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    
    // Create particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        particle.style.background = color;
        
        const angle = (i / 8) * Math.PI * 2;
        const distance = 20 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.left = '26px';
        particle.style.top = '26px';
        
        explosion.appendChild(particle);
        
        // Animate particle
        particle.animate([
            { transform: 'translate(0, 0)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        });
    }
    
    birdsContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

function createFeathers(x, y, color) {
    for (let i = 0; i < 5; i++) {
        const feather = document.createElement('div');
        feather.className = 'feather';
        feather.style.left = (x + Math.random() * 40 - 20) + 'px';
        feather.style.top = y + 'px';
        feather.style.background = color;
        feather.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Add horizontal spread
        const horizontalSpread = (Math.random() - 0.5) * 100; // -50px to +50px
        feather.style.setProperty('--feather-x', horizontalSpread + 'px');
        
        birdsContainer.appendChild(feather);
        setTimeout(() => feather.remove(), 2000);
    }
}

function removeBird(isBlue) {
    const birdArray = isBlue ? blueBirds : redBirds;
    if (birdArray.length === 0) return;
    
    const bird = birdArray.pop();
    
    // Get bird position for explosion
    const rect = bird.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Create explosion and feathers
    const color = isBlue ? '#1e88e5' : '#e63946';
    createExplosion(x, y, color);
    createFeathers(x, y, color);
    
    // Clear timeout and remove bird
    clearTimeout(bird.timeoutId);
    bird.remove();
}

function updateBirds() {
    const blueCount = parseInt(scoreA.textContent);
    const redCount = parseInt(scoreB.textContent);
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
        // Add or remove blue birds
        while (blueBirds.length < blueCount) {
            blueBirds.push(createBird(true));
        }
        while (blueBirds.length > blueCount) {
            removeBird(true);
        }
        
        // Add or remove red birds
        while (redBirds.length < redCount) {
            redBirds.push(createBird(false));
        }
        while (redBirds.length > redCount) {
            removeBird(false);
        }
    });
}

// Initialize birds based on loaded scores
updateBirds();

document.getElementById('increment-a').addEventListener('click', () => {
    playChirp();
    scoreA.textContent = parseInt(scoreA.textContent) + 1;
    saveScores();
    updateBirds();
});

document.getElementById('decrement-a').addEventListener('click', () => {
    const current = parseInt(scoreA.textContent);
    if (current > 0) {
        playExplosion();
        scoreA.textContent = current - 1;
        saveScores();
        updateBirds();
    }
});

document.getElementById('increment-b').addEventListener('click', () => {
    playChirp();
    scoreB.textContent = parseInt(scoreB.textContent) + 1;
    saveScores();
    updateBirds();
});

document.getElementById('decrement-b').addEventListener('click', () => {
    const current = parseInt(scoreB.textContent);
    if (current > 0) {
        playExplosion();
        scoreB.textContent = current - 1;
        saveScores();
        updateBirds();
    }
});

document.getElementById('reset-btn').addEventListener('click', () => {
    scoreA.textContent = 0;
    scoreB.textContent = 0;
    saveScores();
    updateBirds();
});

// Cloud System
function createCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    const cloudSVG = `
        <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Linear gradient for transparency at bottom -->
                <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:white;stop-opacity:1" />
                    <stop offset="60%" style="stop-color:white;stop-opacity:0.95" />
                    <stop offset="85%" style="stop-color:white;stop-opacity:0.6" />
                    <stop offset="100%" style="stop-color:white;stop-opacity:0.2" />
                </linearGradient>
            </defs>
            <!-- Bottom layer with gradient -->
            <ellipse cx="45" cy="55" rx="32" ry="22" fill="url(#cloudGradient)"/>
            <ellipse cx="75" cy="50" rx="35" ry="28" fill="url(#cloudGradient)"/>
            <ellipse cx="105" cy="52" rx="38" ry="26" fill="url(#cloudGradient)"/>
            <ellipse cx="135" cy="50" rx="36" ry="28" fill="url(#cloudGradient)"/>
            <ellipse cx="165" cy="55" rx="30" ry="22" fill="url(#cloudGradient)"/>
            <!-- Top layer for fluffiness with gradient -->
            <ellipse cx="60" cy="38" rx="28" ry="24" fill="url(#cloudGradient)"/>
            <ellipse cx="90" cy="35" rx="32" ry="28" fill="url(#cloudGradient)"/>
            <ellipse cx="120" cy="36" rx="30" ry="26" fill="url(#cloudGradient)"/>
            <ellipse cx="145" cy="40" rx="26" ry="22" fill="url(#cloudGradient)"/>
        </svg>
    `;
    
    cloud.innerHTML = cloudSVG;
    
    // Random size
    const scale = 0.5 + Math.random() * 0.8;
    cloud.style.width = (200 * scale) + 'px';
    cloud.style.height = (80 * scale) + 'px';
    
    // Random vertical position (spread across more of the screen)
    const top = 5 + Math.random() * 70;
    cloud.style.top = top + '%';
    
    // Random duration
    const duration = 40 + Math.random() * 40;
    cloud.style.setProperty('--cloud-duration', duration + 's');
    
    // Random start position (use left: 0 and let transform handle animation)
    cloud.style.left = '0';
    cloud.style.transform = `translateX(${Math.random() * 100}vw)`;
    
    cloudsContainer.appendChild(cloud);
}

// Create initial clouds (reduced from 6 to 4 for better performance)
for (let i = 0; i < 4; i++) {
    createCloud();
}

// Performance optimization: Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 3D Tilt Effect for Section Cards (Optimized)
function init3DTilt() {
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        let rafId = null;
        
        const handleMouseMove = throttle((e) => {
            // Cancel any pending animation frame
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            rafId = requestAnimationFrame(() => {
                const rect = section.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Calculate percentage position (0 to 1)
                const xPercent = x / rect.width;
                const yPercent = y / rect.height;
                
                // Calculate tilt angles (reduced from 30 to 20 for smoother effect)
                const tiltX = (yPercent - 0.5) * -20;
                const tiltY = (xPercent - 0.5) * 20;
                
                // Apply transform with GPU acceleration
                section.style.transform = `translate3d(0, 0, 0) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        }, 16); // ~60fps throttle
        
        section.addEventListener('mousemove', handleMouseMove);
        
        section.addEventListener('mouseleave', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            // Reset to neutral position with GPU acceleration
            section.style.transform = 'translate3d(0, 0, 0) perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}

// Initialize 3D tilt effect
init3DTilt();
