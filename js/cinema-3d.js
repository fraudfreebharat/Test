/**
 * ==========================================================================
 * MAYRA DENTAL CARE — CINEMATIC 3D & FULL ANIMATION SUITE (JS/CINEMA-3D.JS)
 * Procedural WebGL 3D Anatomy, Ambient World Canvas, Custom Optic Cursor,
 * Kinetic Number Counters, Magnetic Buttons & Web Audio Soundscape
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. PROCEDURAL CINEMATIC WEB AUDIO AMBIENCE & HAPTIC SYNTHESIZER ---
  class CinemaAudioEngine {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.masterGain = null;
      this.oscillators = [];
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    startAmbience() {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Calming cinematic medical ambient chord (D major 9th / ambient drone)
      const freqs = [73.42, 110.00, 146.83, 220.00, 277.18, 329.63];
      this.oscillators = freqs.map((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280 + index * 55, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.018 / (index + 1), this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        return { osc, gain, filter };
      });

      this.masterGain.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 2.0);
      this.isPlaying = true;
      this.updateAudioButtons(true);
    }

    stopAmbience() {
      if (!this.ctx || !this.isPlaying) return;
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        this.oscillators.forEach(o => {
          try { o.osc.stop(); } catch (e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
        this.updateAudioButtons(false);
      }, 1000);
    }

    toggle() {
      if (this.isPlaying) {
        this.stopAmbience();
      } else {
        this.startAmbience();
      }
    }

    playClickHaptic() {
      if (!this.ctx || !this.isPlaying) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.07);
      } catch (e) {}
    }

    updateAudioButtons(active) {
      const btns = document.querySelectorAll('.cinema-audio-toggle');
      btns.forEach(btn => {
        if (active) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-label', 'Mute cinematic ambient audio');
          btn.innerHTML = `
            <span class="audio-wave-bars">
              <i></i><i></i><i></i><i></i>
            </span>
            <span>Ambience: ON</span>
          `;
        } else {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-label', 'Enable cinematic ambient audio');
          btn.innerHTML = `
            <span class="audio-wave-bars is-muted">
              <i></i><i></i><i></i><i></i>
            </span>
            <span>Audio: OFF</span>
          `;
        }
      });
    }
  }

  const cinemaAudio = new CinemaAudioEngine();

  // --- 2. UNIVERSAL 3D AMBIENT BACKGROUND CONSTELLATION ---
  class AmbientBackgroundScene {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'cinema-universal-bg-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '0';
      this.canvas.style.opacity = '0.35';
      document.body.prepend(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.mouse = { x: this.width / 2, y: this.height / 2 };

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      // Generate particles
      const count = Math.min(65, Math.floor((this.width * this.height) / 18000));
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 2 + 0.8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.6 + 0.2
        });
      }

      this.animate();
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Connect near particles
      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = this.width;
        if (p1.x > this.width) p1.x = 0;
        if (p1.y < 0) p1.y = this.height;
        if (p1.y > this.height) p1.y = 0;

        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(38, 133, 115, ${p1.alpha})`;
        this.ctx.fill();

        // Connect lines
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(38, 133, 115, ${0.15 * (1 - dist / 110)})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();
          }
        }
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  // --- 3. MAIN THREE.JS 3D DENTAL ANATOMY & SCROLL DIRECTOR ---
  class MainDental3DScene {
    constructor(canvasContainerId) {
      this.container = document.getElementById(canvasContainerId);
      if (!this.container) return;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.toothGroup = null;
      this.crownMesh = null;
      this.rootsMesh = null;
      this.pulpCanalMesh = null;
      this.implantMesh = null;
      this.laserPlane = null;
      this.particles = null;

      this.currentMode = 'natural';
      this.targetRotationY = 0;
      this.targetRotationX = 0.15;
      this.targetCameraZ = 6.0;
      this.targetCameraY = 0.2;
      this.targetExplode = 0;

      this.isUserDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.scrollProgress = 0;
      this.clock = null;

      this.init();
    }

    async init() {
      if (typeof THREE === 'undefined') {
        await this.loadThreeJS();
      }

      if (typeof THREE === 'undefined') {
        this.renderFallback2D();
        return;
      }

      this.clock = new THREE.Clock();
      this.setupScene();
      this.buildProceduralDentalModel();
      this.buildLaserScanner();
      this.buildParticleAtmosphere();
      this.setupLighting();
      this.bindEvents();
      this.animate();
    }

    loadThreeJS() {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    }

    setupScene() {
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 580;

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x061916, 0.04);

      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      this.camera.position.set(0, 0.3, 6.0);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;

      this.container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
      const ambientLight = new THREE.AmbientLight(0xE0F5F0, 1.0);
      this.scene.add(ambientLight);

      // Key light: Surgical white
      const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
      keyLight.position.set(5, 6, 4);
      this.scene.add(keyLight);

      // Emerald/teal rim light
      const rimLight = new THREE.DirectionalLight(0x2EE59D, 2.2);
      rimLight.position.set(-5, 2, -3);
      this.scene.add(rimLight);

      // Warm restorative gold kicker
      const warmLight = new THREE.DirectionalLight(0xBD8E44, 1.0);
      warmLight.position.set(3, -4, 3);
      this.scene.add(warmLight);
    }

    buildProceduralDentalModel() {
      this.toothGroup = new THREE.Group();

      // --- A. Anatomical Molar Crown (Porcelain E-Max) ---
      const crownGeo = new THREE.CylinderGeometry(1.42, 1.18, 1.45, 36, 18);
      const pos = crownGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y > 0.3) {
          const cuspMod = Math.sin(x * 3.2) * Math.sin(z * 3.2) * 0.24;
          pos.setY(i, y + cuspMod);
          if (Math.abs(x) < 0.38 && Math.abs(z) < 0.38) {
            pos.setY(i, y - 0.15);
          }
        }
      }
      crownGeo.computeVertexNormals();

      this.crownMaterialNatural = new THREE.MeshPhysicalMaterial({
        color: 0xFCF8F2,
        roughness: 0.12,
        metalness: 0.04,
        transmission: 0.38,
        ior: 1.54,
        thickness: 0.85,
        specularIntensity: 1.0,
        specularColor: 0xFFFFFF,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08
      });

      this.crownMaterialWireframe = new THREE.MeshStandardMaterial({
        color: 0x2EE59D,
        wireframe: true,
        emissive: 0x0A4A45,
        emissiveIntensity: 0.5
      });

      this.crownMaterialXRay = new THREE.MeshPhysicalMaterial({
        color: 0x64B5F6,
        roughness: 0.2,
        transmission: 0.88,
        transparent: true,
        opacity: 0.42,
        wireframe: false
      });

      this.crownMesh = new THREE.Mesh(crownGeo, this.crownMaterialNatural);
      this.crownMesh.position.y = 0.8;
      this.toothGroup.add(this.crownMesh);

      // --- B. Dual Anatomical Roots ---
      const rootCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.1, 0),
        new THREE.Vector3(-0.62, -0.8, 0.12),
        new THREE.Vector3(-0.42, -1.85, 0.25)
      ]);
      const rootGeo1 = new THREE.TubeGeometry(rootCurve1, 28, 0.32, 16, false);

      const rootCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.45, 0.1, 0),
        new THREE.Vector3(0.68, -0.8, -0.12),
        new THREE.Vector3(0.48, -1.85, -0.22)
      ]);
      const rootGeo2 = new THREE.TubeGeometry(rootCurve2, 28, 0.32, 16, false);

      this.rootsMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xF4EEE5,
        roughness: 0.32,
        metalness: 0.0,
        transmission: 0.18
      });

      const rootMesh1 = new THREE.Mesh(rootGeo1, this.rootsMaterial);
      const rootMesh2 = new THREE.Mesh(rootGeo2, this.rootsMaterial);

      const rootGroup = new THREE.Group();
      rootGroup.add(rootMesh1);
      rootGroup.add(rootMesh2);
      this.rootsMesh = rootGroup;
      this.toothGroup.add(this.rootsMesh);

      // --- C. Internal Luminous Endodontic Pulp Canals ---
      const canalCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.65, 0),
        new THREE.Vector3(-0.58, -0.6, 0.1),
        new THREE.Vector3(-0.42, -1.8, 0.24)
      ]);
      const canalGeo = new THREE.TubeGeometry(canalCurve, 24, 0.09, 8, false);
      this.pulpCanalMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF6B35,
        wireframe: false
      });
      this.pulpCanalMesh = new THREE.Mesh(canalGeo, this.pulpCanalMaterial);
      this.pulpCanalMesh.visible = false;
      this.toothGroup.add(this.pulpCanalMesh);

      // --- D. Titanium Dental Implant Fixture ---
      const implantGroup = new THREE.Group();
      const screwGeo = new THREE.CylinderGeometry(0.52, 0.32, 1.85, 24, 20);
      const implantMat = new THREE.MeshStandardMaterial({
        color: 0x94A3B8,
        metalness: 0.92,
        roughness: 0.22
      });
      const screwMesh = new THREE.Mesh(screwGeo, implantMat);
      screwMesh.position.y = -0.92;
      implantGroup.add(screwMesh);

      const abutmentGeo = new THREE.ConeGeometry(0.68, 0.72, 20);
      const abutmentMat = new THREE.MeshStandardMaterial({
        color: 0xC59E47,
        metalness: 0.88,
        roughness: 0.18
      });
      const abutmentMesh = new THREE.Mesh(abutmentGeo, abutmentMat);
      abutmentMesh.position.y = 0.22;
      abutmentMesh.rotation.x = Math.PI;
      implantGroup.add(abutmentMesh);

      this.implantMesh = implantGroup;
      this.implantMesh.visible = false;
      this.toothGroup.add(this.implantMesh);

      this.scene.add(this.toothGroup);
    }

    buildLaserScanner() {
      const laserGeo = new THREE.PlaneGeometry(4.4, 0.09);
      const laserMat = new THREE.MeshBasicMaterial({
        color: 0x2EE59D,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      this.laserPlane = new THREE.Mesh(laserGeo, laserMat);
      this.laserPlane.rotation.x = Math.PI / 2;
      this.laserPlane.position.y = -2;
      this.scene.add(this.laserPlane);
    }

    buildParticleAtmosphere() {
      const particleCount = 220;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 14;
        positions[i + 1] = (Math.random() - 0.5) * 9;
        positions[i + 2] = (Math.random() - 0.5) * 10;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x2EE59D,
        size: 0.065,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });

      this.particles = new THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    setMode(mode) {
      this.currentMode = mode;
      cinemaAudio.playClickHaptic();

      if (!this.crownMesh) return;

      if (mode === 'natural') {
        this.crownMesh.material = this.crownMaterialNatural;
        this.rootsMesh.visible = true;
        this.pulpCanalMesh.visible = false;
        this.implantMesh.visible = false;
        this.targetExplode = 0;
      } else if (mode === 'wireframe') {
        this.crownMesh.material = this.crownMaterialWireframe;
        this.rootsMesh.visible = true;
        this.pulpCanalMesh.visible = false;
        this.implantMesh.visible = false;
        this.targetExplode = 0;
      } else if (mode === 'xray') {
        this.crownMesh.material = this.crownMaterialXRay;
        this.rootsMesh.visible = true;
        this.pulpCanalMesh.visible = true;
        this.implantMesh.visible = false;
        this.targetExplode = 0;
      } else if (mode === 'implant') {
        this.crownMesh.material = this.crownMaterialNatural;
        this.rootsMesh.visible = false;
        this.pulpCanalMesh.visible = false;
        this.implantMesh.visible = true;
        this.targetExplode = 0;
      } else if (mode === 'explode') {
        this.crownMesh.material = this.crownMaterialNatural;
        this.rootsMesh.visible = true;
        this.pulpCanalMesh.visible = true;
        this.implantMesh.visible = true;
        this.targetExplode = 1;
      }

      const btns = document.querySelectorAll('.mode-btn');
      btns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });
    }

    bindEvents() {
      const dom = this.renderer.domElement;

      dom.addEventListener('mousedown', (e) => {
        this.isUserDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('mouseup', () => {
        this.isUserDragging = false;
      });

      dom.addEventListener('mousemove', (e) => {
        if (!this.isUserDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetRotationY += deltaX * 0.008;
        this.targetRotationX += deltaY * 0.008;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      dom.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isUserDragging = true;
          this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      });

      window.addEventListener('touchend', () => {
        this.isUserDragging = false;
      });

      dom.addEventListener('touchmove', (e) => {
        if (!this.isUserDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.targetRotationY += deltaX * 0.01;
        this.targetRotationX += deltaY * 0.01;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      });

      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });

      this.bindScrollChoreography();
    }

    bindScrollChoreography() {
      const filmSection = document.getElementById('cinematic-3d-viewport');
      if (!filmSection) return;

      const handleScroll = () => {
        const rect = filmSection.getBoundingClientRect();
        const windowH = window.innerHeight;

        const total = rect.height + windowH;
        const current = windowH - rect.top;
        const progress = Math.max(0, Math.min(1, current / total));
        this.scrollProgress = progress;

        this.updateFilmScene(progress);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    updateFilmScene(progress) {
      const sceneLabel = document.getElementById('film-scene-indicator');
      const timecodeLabel = document.getElementById('film-timecode');

      if (timecodeLabel) {
        const totalSecs = Math.floor(progress * 142);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        const frames = String(Math.floor((progress * 1420) % 24)).padStart(2, '0');
        timecodeLabel.textContent = `TC 00:${mins}:${secs}:${frames}`;
      }

      if (progress < 0.25) {
        if (sceneLabel) sceneLabel.textContent = 'ACT I // ENAMEL BIOMIMETICS';
        this.targetCameraZ = 6.0;
        this.targetCameraY = 0.2;
        if (!this.isUserDragging) {
          this.targetRotationY = progress * 4.0;
          this.targetRotationX = 0.1;
        }
        this.updateActiveChapter(0);
      } else if (progress < 0.50) {
        if (sceneLabel) sceneLabel.textContent = 'ACT II // 20-MICRON OPTICAL SCAN';
        this.targetCameraZ = 5.2;
        this.targetCameraY = 0.5;
        if (!this.isUserDragging) {
          this.targetRotationY = 1.2 + (progress - 0.25) * 3.5;
        }
        if (this.laserPlane) {
          this.laserPlane.position.y = -1.8 + ((progress - 0.25) / 0.25) * 3.2;
        }
        this.updateActiveChapter(1);
      } else if (progress < 0.75) {
        if (sceneLabel) sceneLabel.textContent = 'ACT III // MICRO-ENDODONTIC CANAL';
        this.targetCameraZ = 4.8;
        this.targetCameraY = -0.2;
        if (!this.isUserDragging) {
          this.targetRotationY = 2.4 + (progress - 0.5) * 2.5;
        }
        this.updateActiveChapter(2);
      } else {
        if (sceneLabel) sceneLabel.textContent = 'ACT IV // PRECISION RESTORATION';
        this.targetCameraZ = 5.8;
        this.targetCameraY = 0.1;
        this.updateActiveChapter(3);
      }
    }

    updateActiveChapter(index) {
      const steps = document.querySelectorAll('.film-chapter-step');
      steps.forEach((step, idx) => {
        step.classList.toggle('active', idx === index);
      });
    }

    renderFallback2D() {
      const canvas = document.createElement('canvas');
      canvas.width = this.container.clientWidth || 600;
      canvas.height = this.container.clientHeight || 500;
      this.container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      let angle = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.strokeStyle = '#268573';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 90 + Math.sin(angle) * 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0A4A45';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('3D DENTAL ANATOMICAL TELEMETRY', cx, cy - 20);
        ctx.fillStyle = '#BD8E44';
        ctx.fillText('±20 MICRON PRECISION ACTIVE', cx, cy + 20);

        angle += 0.03;
        requestAnimationFrame(draw);
      };
      draw();
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const time = this.clock ? this.clock.getElapsedTime() : 0;

      if (!this.isUserDragging) {
        this.targetRotationY += 0.003;
      }

      if (this.toothGroup) {
        this.toothGroup.rotation.y += (this.targetRotationY - this.toothGroup.rotation.y) * 0.08;
        this.toothGroup.rotation.x += (this.targetRotationX - this.toothGroup.rotation.x) * 0.08;
        this.toothGroup.position.y = Math.sin(time * 1.5) * 0.08;

        if (this.crownMesh) {
          const targetCrownY = 0.8 + this.targetExplode * 1.2;
          this.crownMesh.position.y += (targetCrownY - this.crownMesh.position.y) * 0.1;
        }
        if (this.rootsMesh) {
          const targetRootsY = -this.targetExplode * 0.8;
          this.rootsMesh.position.y += (targetRootsY - this.rootsMesh.position.y) * 0.1;
        }
      }

      if (this.camera) {
        this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 0.05;
        this.camera.position.y += (this.targetCameraY - this.camera.position.y) * 0.05;
      }

      if (this.particles) {
        this.particles.rotation.y = time * 0.03;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // --- 4. SUBPAGE DEDICATED 3D INTERACTIVE OBJECT WIDGETS ---
  class Subpage3DVisualizer {
    constructor(containerId, modelType) {
      this.container = document.getElementById(containerId);
      if (!this.container || typeof THREE === 'undefined') return;
      this.modelType = modelType;
      this.init();
    }

    init() {
      const w = this.container.clientWidth || 380;
      const h = this.container.clientHeight || 320;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      camera.position.set(0, 0, 5);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(renderer.domElement);

      // Light
      const ambient = new THREE.AmbientLight(0xE8F7F0, 1.2);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0x2EE59D, 1.8);
      key.position.set(3, 4, 3);
      scene.add(key);

      const group = new THREE.Group();

      if (this.modelType === 'microscope') {
        // 3D Optical Microscope Lens Cylinder
        const bodyGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.8, 24);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0A4A45, metalness: 0.8, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const lensGeo = new THREE.TorusGeometry(0.75, 0.12, 16, 32);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xBD8E44, metalness: 0.9, roughness: 0.1 });
        const ring = new THREE.Mesh(lensGeo, lensMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.9;
        group.add(ring);
      } else if (this.modelType === 'shield') {
        // 3D Holographic Guarantee Coin / Octagon Shield
        const shieldGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.2, 8);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xBD8E44, metalness: 0.85, roughness: 0.15 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.rotation.x = Math.PI / 2.3;
        group.add(shield);
      } else if (this.modelType === 'beacon') {
        // 3D Radar Beacon Rings
        for (let r = 0.6; r <= 1.6; r += 0.5) {
          const ringGeo = new THREE.RingGeometry(r, r + 0.08, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x2EE59D, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2.5;
          group.add(ring);
        }
      } else if (this.modelType === 'implant') {
        // 3D Titanium Guided Implant & Gold Abutment
        const screwGeo = new THREE.CylinderGeometry(0.5, 0.3, 1.8, 20);
        const screwMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.92, roughness: 0.2 });
        const screw = new THREE.Mesh(screwGeo, screwMat);
        screw.position.y = -0.4;
        group.add(screw);

        const goldGeo = new THREE.ConeGeometry(0.65, 0.7, 16);
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xC59E47, metalness: 0.88, roughness: 0.18 });
        const gold = new THREE.Mesh(goldGeo, goldMat);
        gold.rotation.x = Math.PI;
        gold.position.y = 0.6;
        group.add(gold);
      }

      scene.add(group);

      const animate = () => {
        requestAnimationFrame(animate);
        group.rotation.y += 0.012;
        group.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
        renderer.render(scene, camera);
      };
      animate();
    }
  }

  // --- 5. CUSTOM SURGICAL CROSSHAIR OPTIC CURSOR ---
  class CinemaOpticCursor {
    constructor() {
      // Only for non-touch desktop devices
      if (window.matchMedia('(pointer: coarse)').matches) return;

      this.dot = document.createElement('div');
      this.dot.className = 'cinema-cursor-dot';

      this.ring = document.createElement('div');
      this.ring.className = 'cinema-cursor-ring';

      document.body.appendChild(this.dot);
      document.body.appendChild(this.ring);

      this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      this.bind();
      this.render();
    }

    bind() {
      window.addEventListener('mousemove', (e) => {
        this.target.x = e.clientX;
        this.target.y = e.clientY;
        this.dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      });

      // Hover expansion on interactive elements
      const interactives = document.querySelectorAll('a, button, input, select, textarea, .mode-btn, .card, .pricing-card');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.ring.classList.add('is-hovered');
          cinemaAudio.playClickHaptic();
        });
        el.addEventListener('mouseleave', () => {
          this.ring.classList.remove('is-hovered');
        });
      });

      // Orbit cursor state on 3D canvas
      const canvas3D = document.getElementById('cinema-3d-canvas-box');
      if (canvas3D) {
        canvas3D.addEventListener('mouseenter', () => this.ring.classList.add('is-3d-orbit'));
        canvas3D.addEventListener('mouseleave', () => this.ring.classList.remove('is-3d-orbit'));
      }
    }

    render() {
      // Smooth spring follow for trailing ring
      this.pos.x += (this.target.x - this.pos.x) * 0.18;
      this.pos.y += (this.target.y - this.pos.y) * 0.18;

      this.ring.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
      requestAnimationFrame(() => this.render());
    }
  }

  // --- 6. SCROLL REVEALS & KINETIC ROLLING NUMBER COUNTERS ---
  function initScrollRevealsAndCounters() {
    // 1. Reveal on scroll using IntersectionObserver
    const revealElements = document.querySelectorAll('.card, .pricing-card, .service-card, .principle-card, .step-card, .metric-item, .doctor-card');
    
    revealElements.forEach(el => {
      el.classList.add('cinema-reveal-ready');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('cinema-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => observer.observe(el));

    // 2. Rolling Number Counter for Metrics
    const metricNumbers = document.querySelectorAll('.metric-number');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          
          // Match numbers like 1,840 or 12 or 100
          const match = text.match(/([0-9,]+)/);
          if (match) {
            const rawNum = parseInt(match[1].replace(/,/g, ''), 10);
            const prefix = text.split(match[1])[0] || '';
            const suffix = text.split(match[1])[1] || '';
            let current = 0;
            const duration = 1400; // ms
            const startTime = performance.now();

            const update = (now) => {
              const elapsed = now - startTime;
              const progress = Math.min(1, elapsed / duration);
              // easeOutExpo
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              current = Math.floor(eased * rawNum);
              el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                el.textContent = text; // lock exact text
              }
            };
            requestAnimationFrame(update);
          }
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    metricNumbers.forEach(m => counterObserver.observe(m));
  }

  // --- 7. 3D CARD PARALLAX TILT PHYSICS WITH SPECULAR SHEEN ---
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card, .showcase-frame, .service-card, .pricing-card, .principle-card, .doctor-card');

    cards.forEach(card => {
      // Add specular sheen overlay
      let sheen = card.querySelector('.cinema-specular-sheen');
      if (!sheen) {
        sheen = document.createElement('div');
        sheen.className = 'cinema-specular-sheen';
        card.appendChild(sheen);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6.5;
        const rotateY = ((x - centerX) / centerX) * 6.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'transform 80ms ease-out';

        // Move specular sheen highlight
        sheen.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(46, 229, 157, 0.15), transparent 60%)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)';
        sheen.style.background = 'transparent';
      });
    });
  }

  // --- 8. GLOBAL INITIALIZATION ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Universal Ambient Constellation Background
    new AmbientBackgroundScene();

    // 2. Custom Optic Crosshair Cursor
    new CinemaOpticCursor();

    // 3. Main 3D Dental Scene on Homepage
    const main3D = new MainDental3DScene('cinema-3d-canvas-box');

    // 4. Subpage 3D Object Widgets
    new Subpage3DVisualizer('about-3d-visualizer', 'microscope');
    new Subpage3DVisualizer('pricing-3d-visualizer', 'shield');
    new Subpage3DVisualizer('contact-3d-visualizer', 'beacon');
    new Subpage3DVisualizer('services-3d-visualizer', 'implant');

    // 5. Mode Switchers
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (main3D) main3D.setMode(mode);
      });
    });

    // 6. Audio Toggles
    const audioButtons = document.querySelectorAll('.cinema-audio-toggle');
    audioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cinemaAudio.toggle();
      });
    });

    // 7. Scroll Reveals & Number Rollers
    initScrollRevealsAndCounters();

    // 8. 3D Card Tilt with Specular Sheen
    init3DCardTilt();
  });

})();
