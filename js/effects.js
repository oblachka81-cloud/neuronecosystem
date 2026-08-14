// --- Фоновая музыка ---
const bgAudio = new Audio('/sounds.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.35;
let musicEnabled = localStorage.getItem('neuron_music') !== 'off';

function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('neuron_music', musicEnabled ? 'on' : 'off');
  updateMusicBtn();
  if (musicEnabled) { bgAudio.play().catch(()=>{}); }
  else { bgAudio.pause(); }
}

function updateMusicBtn() {
  const btnImg = document.getElementById('musicBtnImg');
  if (!btnImg) return;
  btnImg.src = musicEnabled ? 'main/btn_music_on.webp' : 'main/btn_music_off.webp';
}

document.addEventListener('click', function startMusic() {
  if (musicEnabled) bgAudio.play().catch(()=>{});
  document.removeEventListener('click', startMusic);
}, { once: true });

updateMusicBtn();

// --- Частицы ---
(function() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#00ffff','#aa66ff','#ff6600','#00ff88','#ff66cc'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*10}s;box-shadow:0 0 ${size*2}px ${colors[Math.floor(Math.random()*colors.length)]};`;
    container.appendChild(p);
  }
})();

// --- Визуальные эффекты ---
function triggerCorrectEffect() {
  const card = document.getElementById('appRoot');
  card.classList.remove('correct-glow','wrong-glow','shake');
  void card.offsetWidth;
  card.classList.add('correct-glow');
  setTimeout(() => card.classList.remove('correct-glow'), 700);
  launchConfetti();
}

function triggerWrongEffect() {
  const card = document.getElementById('appRoot');
  card.classList.remove('correct-glow','wrong-glow','shake');
  void card.offsetWidth;
  card.classList.add('wrong-glow','shake');
  setTimeout(() => card.classList.remove('wrong-glow','shake'), 600);
}

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#00ffff','#aa66ff','#00ff88','#ff66cc','#ffcc00'];
  const particles = Array.from({length:80}, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + 10,
    r: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: -(Math.random() * 6 + 4),
    alpha: 1
  }));
  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.alpha -= 0.012;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (particles.some(p => p.alpha > 0)) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  cancelAnimationFrame(frame);
  draw();
}

function launchConfettiTop() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#00ffff','#aa66ff','#00ff88','#ff66cc','#ffcc00'];
  const particles = Array.from({length:150}, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    alpha: 1
  }));
  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.alpha -= 0.008;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (particles.some(p => p.alpha > 0)) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  cancelAnimationFrame(frame);
  draw();
}
