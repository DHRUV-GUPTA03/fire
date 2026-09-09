/**
 * Interactive canvas fire suppression physics simulation
 */

class FireballSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.mode = 'passive'; // 'passive' | 'active'
    this.state = 'idle'; // 'idle' | 'burning' | 'throwing' | 'igniting' | 'exploding' | 'extinguished'
    
    this.ball = {
      x: this.width / 2,
      y: 140,
      targetX: this.width / 2,
      targetY: 260,
      radius: 28,
      isMounted: true,
      igniteTimer: 0,
      maxIgniteTime: 60
    };

    this.fireParticles = [];
    this.powderParticles = [];
    this.smokeParticles = [];
    this.shockwaves = [];
    this.audioCtx = null;
    this.soundEnabled = true;

    this.initEventListeners();
    this.resizeCanvas();
    this.reset();
    this.animate();
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    const btnPassive = document.getElementById('simModePassive');
    const btnActive = document.getElementById('simModeActive');
    const btnTrigger = document.getElementById('simTriggerFire');
    const btnThrow = document.getElementById('simThrowBall');
    const btnReset = document.getElementById('simReset');
    const btnSound = document.getElementById('simToggleSound');

    if (btnPassive) {
      btnPassive.addEventListener('click', () => {
        this.setMode('passive');
        btnPassive.classList.add('active');
        if (btnActive) btnActive.classList.remove('active');
        if (btnThrow) btnThrow.classList.add('hidden');
        if (btnTrigger) btnTrigger.classList.remove('hidden');
      });
    }

    if (btnActive) {
      btnActive.addEventListener('click', () => {
        this.setMode('active');
        btnActive.classList.add('active');
        if (btnPassive) btnPassive.classList.remove('active');
        if (btnThrow) btnThrow.classList.remove('hidden');
        if (btnTrigger) btnTrigger.classList.add('hidden');
      });
    }

    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => this.triggerFire());
    }

    if (btnThrow) {
      btnThrow.addEventListener('click', () => this.throwBall());
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => this.reset());
    }

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        btnSound.innerHTML = this.soundEnabled 
          ? '<i class="fas fa-volume-up mr-1 text-emerald-400"></i> Audio ON' 
          : '<i class="fas fa-volume-mute mr-1 text-gray-400"></i> Audio OFF';
      });
    }

    // Direct canvas click handler
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (this.width / rect.width);
      const clickY = (e.clientY - rect.top) * (this.height / rect.height);
      
      if (this.state === 'idle') {
        this.triggerFire();
      } else if (this.mode === 'active' && this.state === 'burning') {
        this.throwBallAt(clickX, clickY);
      }
    });
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = Math.min(800, rect.width);
      this.canvas.height = 420;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.reset();
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.reset();
  }

  initAudio() {
    if (!this.audioCtx && typeof window.AudioContext !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playAlarmSound() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      // Burst sound
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.7, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);

      // Powder dispersion noise
      const bufferSize = this.audioCtx.sampleRate * 0.5;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);

      whiteNoise.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      whiteNoise.start();
    } catch {
      // Audio playback unavailable or blocked by browser policy
    }
  }

  reset() {
    this.state = 'idle';
    this.fireParticles = [];
    this.powderParticles = [];
    this.smokeParticles = [];
    this.shockwaves = [];

    if (this.mode === 'passive') {
      this.ball.x = this.width / 2;
      this.ball.y = 150;
      this.ball.radius = 26;
      this.ball.isMounted = true;
    } else {
      this.ball.x = 100;
      this.ball.y = 100;
      this.ball.radius = 26;
      this.ball.isMounted = false;
    }

    this.ball.igniteTimer = 0;
    this.updateStatusUI('Status: System Ready. Standby Surveillance 24/7.', 'ready', 0);
  }

  triggerFire() {
    if (this.state === 'burning' || this.state === 'igniting' || this.state === 'exploding') return;
    this.state = 'burning';
    this.updateStatusUI('Fire Hazard Detected! Flames rising towards safety sphere...', 'fire', 85);
  }

  throwBall() {
    if (this.mode !== 'active') return;
    this.throwBallAt(this.width / 2 + (Math.random() * 60 - 30), 290);
  }

  throwBallAt(targetX, targetY) {
    if (this.state === 'idle') {
      this.triggerFire();
    }
    this.state = 'throwing';
    this.ball.targetX = targetX;
    this.ball.targetY = targetY;
    this.updateStatusUI('Ball deployed! Rolling directly into the flame core...', 'active', 60);
  }

  explode() {
    this.state = 'exploding';
    this.playAlarmSound();
    this.updateStatusUI('BOOM! 128 dB Warning Alarm triggered! Monoammonium Phosphate ABC powder deployed 360°!', 'burst', 128);

    this.shockwaves.push({
      x: this.ball.x,
      y: this.ball.y,
      radius: 10,
      maxRadius: 220,
      opacity: 1,
      speed: 8
    });

    for (let i = 0; i < 280; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.powderParticles.push({
        x: this.ball.x,
        y: this.ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        opacity: 1,
        life: 1,
        decay: Math.random() * 0.015 + 0.008
      });
    }

    setTimeout(() => {
      this.state = 'extinguished';
      this.updateStatusUI('Fire 100% Extinguished! Area safely smothered & thermally stabilized in 3.2 seconds.', 'success', 0);
    }, 1200);
  }

  updateStatusUI(text, statusType, dbLevel) {
    const statusEl = document.getElementById('simStatusText');
    const dbEl = document.getElementById('simDbText');
    const timeEl = document.getElementById('simTimeText');

    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = 'font-semibold text-sm';
      if (statusType === 'fire') statusEl.classList.add('text-rose-400');
      else if (statusType === 'burst') statusEl.classList.add('text-amber-300');
      else if (statusType === 'success') statusEl.classList.add('text-emerald-400');
      else statusEl.classList.add('text-slate-300');
    }

    if (dbEl) {
      dbEl.textContent = dbLevel > 0 ? `${dbLevel} dB` : '-- dB';
      dbEl.className = dbLevel >= 120 ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400';
    }

    if (timeEl) {
      if (statusType === 'success') timeEl.textContent = '3.2s';
      else if (statusType === 'fire' || statusType === 'burst') timeEl.textContent = 'Activating...';
      else timeEl.textContent = '0.0s';
    }
  }

  update() {
    if (this.state === 'burning' || this.state === 'throwing' || this.state === 'igniting') {
      const fireBaseX = this.width / 2;
      const fireBaseY = 320;
      for (let i = 0; i < 6; i++) {
        this.fireParticles.push({
          x: fireBaseX + (Math.random() * 80 - 40),
          y: fireBaseY + (Math.random() * 15 - 7),
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(Math.random() * 3 + 2.5),
          radius: Math.random() * 16 + 8,
          opacity: 1,
          colorType: Math.random() > 0.4 ? 'orange' : 'yellow',
          life: 1,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.radius *= 0.96;
      p.life -= p.decay;

      if (this.mode === 'passive' && this.state === 'burning') {
        const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        if (dist < this.ball.radius + 10) {
          this.state = 'igniting';
          this.updateStatusUI('Micro-fuse triggered by flame contact! 360° core combustion priming...', 'fire', 40);
        }
      }

      if (p.life <= 0 || p.radius < 1) {
        this.fireParticles.splice(i, 1);
      }
    }

    if (this.state === 'throwing') {
      const dx = this.ball.targetX - this.ball.x;
      const dy = this.ball.targetY - this.ball.y;
      this.ball.x += dx * 0.12;
      this.ball.y += dy * 0.12;

      if (Math.hypot(dx, dy) < 15) {
        this.state = 'igniting';
        this.ball.x = this.ball.targetX;
        this.ball.y = this.ball.targetY;
      }
    }

    if (this.state === 'igniting') {
      this.ball.igniteTimer++;
      if (this.ball.igniteTimer >= 45) {
        this.explode();
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.opacity = Math.max(0, 1 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.powderParticles.length - 1; i >= 0; i--) {
      const p = this.powderParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.powderParticles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawEnvironment();
    this.drawFire();
    this.drawShockwaves();

    if (this.state !== 'extinguished' && this.state !== 'exploding') {
      this.drawBall();
    }

    this.drawPowder();
  }

  drawEnvironment() {
    const ctx = this.ctx;
    const groundY = 330;

    // Platform floor
    ctx.fillStyle = '#111928';
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // Floor line
    ctx.strokeStyle = '#28354D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // Hazard equipment chassis
    const baseW = 180;
    const baseH = 80;
    const baseX = this.width / 2 - baseW / 2;
    const baseY = groundY - baseH;

    ctx.fillStyle = '#182337';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(baseX, baseY, baseW, baseH, [8, 8, 0, 0]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '10px "Space Grotesk", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH-RISK HAZARD ZONE', this.width / 2, baseY + 25);
    ctx.fillText('[ 415V 3-PHASE / FLAMMABLE VAPORS ]', this.width / 2, baseY + 42);

    // Warning stripe
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(baseX + 15, baseY + 58);
    ctx.lineTo(baseX + baseW - 15, baseY + 58);
    ctx.stroke();

    // Passive mounting bracket
    if (this.mode === 'passive') {
      const mountX = this.width / 2;
      const mountY = 150;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mountX, 0);
      ctx.lineTo(mountX, mountY - 32);
      ctx.stroke();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(mountX, mountY, 32, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();

      ctx.fillStyle = '#00F0FF';
      ctx.font = '9px "Space Grotesk", sans-serif';
      ctx.fillText('VANSH QUICK-RELEASE MOUNT', mountX, mountY - 38);
    }
  }

  drawFire() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const p of this.fireParticles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      if (p.colorType === 'orange') {
        gradient.addColorStop(0, `rgba(255, 120, 30, ${p.life})`);
        gradient.addColorStop(0.6, `rgba(230, 57, 70, ${p.life * 0.8})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 240, 100, ${p.life})`);
        gradient.addColorStop(0.5, `rgba(255, 140, 0, ${p.life * 0.8})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBall() {
    const ctx = this.ctx;
    const b = this.ball;

    if (this.state === 'igniting') {
      ctx.save();
      ctx.shadowColor = '#FF5E1E';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#FFD166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const grad = ctx.createRadialGradient(
      b.x - b.radius * 0.35, 
      b.y - b.radius * 0.35, 
      b.radius * 0.1, 
      b.x, 
      b.y, 
      b.radius
    );
    grad.addColorStop(0, '#FF6B6B');
    grad.addColorStop(0.4, '#E63946');
    grad.addColorStop(0.85, '#BA181B');
    grad.addColorStop(1, '#660708');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(b.x - 10, b.y - 10);
    ctx.lineTo(b.x + 10, b.y + 10);
    ctx.moveTo(b.x + 10, b.y - 10);
    ctx.lineTo(b.x - 10, b.y + 10);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VANSH XROSS', b.x, b.y + b.radius + 14);

    if (this.state === 'igniting') {
      ctx.fillStyle = '#FF9F1C';
      for (let i = 0; i < 4; i++) {
        const sparkX = b.x + (Math.random() * 20 - 10);
        const sparkY = b.y + (Math.random() * 20 - 10);
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawShockwaves() {
    const ctx = this.ctx;
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 200, 50, ${sw.opacity})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#FF5E1E';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPowder() {
    const ctx = this.ctx;
    ctx.save();
    for (const p of this.powderParticles) {
      ctx.fillStyle = `rgba(240, 248, 255, ${p.life * 0.85})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('simulationCanvas')) {
    window.fireballSim = new FireballSimulator('simulationCanvas');
  }
});
