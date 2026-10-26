/**
 * ==========================================================================
 * MAYRA DENTAL CARE — HERO 3D ANIMATION ENGINE (JS/CINEMA-3D.JS)
 * Focused Exclusively on the Homepage 3D Hero Section
 * Procedural WebGL 3D Dental Anatomy, Interactive Laser Scanning,
 * 360° Drag Orbit, Optical Crosshair Cursor & Number Rollers
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. PROCEDURAL WEB AUDIO HAPTICS & AMBIENT SYNTHESIZER ---
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

      const freqs = [73.42, 110.00, 146.83, 220.00, 329.63];
      this.oscillators = freqs.map((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260 + index * 60, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.016 / (index + 1), this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        return { osc, gain, filter };
      });

      this.masterGain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 2.0);
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
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(940, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      } catch (e) {}
    }

    updateAudioButtons(active) {
      const btns = document.querySelectorAll('.cinema-audio-toggle');
      btns.forEach(btn => {
        if (active) {
          btn.classList.add('is-active');
          btn.innerHTML = `
            <span class="audio-wave-bars"><i></i><i></i><i></i><i></i></span>
            <span>Ambience: ON</span>
          `;
        } else {
          btn.classList.remove('is-active');
          btn.innerHTML = `
            <span class="audio-wave-bars is-muted"><i></i><i></i><i></i><i></i></span>
            <span>Audio: OFF</span>
          `;
        }
      });
    }
  }

  const cinemaAudio = new CinemaAudioEngine();

  // --- 2. HERO 3D DENTAL ANATOMY & INTERACTIVE OPERATORY ENGINE ---
  class Hero3DScene {
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
      this.targetExplode = 0;

      this.isUserDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
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
      const width = this.container.clientWidth || 540;
      const height = this.container.clientHeight || 480;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      this.camera.position.set(0, 0.1, 5.8);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
      const ambientLight = new THREE.AmbientLight(0xEAF5F2, 0.95);
      this.scene.add(ambientLight);

      // Key light: Surgical white
      const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
      keyLight.position.set(4, 5, 4);
      this.scene.add(keyLight);

      // Emerald/teal rim light
      const rimLight = new THREE.DirectionalLight(0x2EE59D, 2.0);
      rimLight.position.set(-5, 2, -3);
      this.scene.add(rimLight);

      // Warm restorative gold kicker
      const warmLight = new THREE.DirectionalLight(0xBD8E44, 0.9);
      warmLight.position.set(3, -4, 3);
      this.scene.add(warmLight);
    }

    buildProceduralDentalModel() {
      this.toothGroup = new THREE.Group();

      // --- A. Anatomical Molar Crown (Porcelain E-Max) ---
      const crownGeo = new THREE.CylinderGeometry(1.38, 1.15, 1.42, 36, 18);
      const pos = crownGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y > 0.3) {
          const cuspMod = Math.sin(x * 3.2) * Math.sin(z * 3.2) * 0.22;
          pos.setY(i, y + cuspMod);
          if (Math.abs(x) < 0.38 && Math.abs(z) < 0.38) {
            pos.setY(i, y - 0.14);
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
      this.crownMesh.position.y = 0.78;
      this.toothGroup.add(this.crownMesh);

      // --- B. Dual Anatomical Roots ---
      const rootCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.44, 0.1, 0),
        new THREE.Vector3(-0.60, -0.8, 0.12),
        new THREE.Vector3(-0.40, -1.85, 0.25)
      ]);
      const rootGeo1 = new THREE.TubeGeometry(rootCurve1, 28, 0.32, 16, false);

      const rootCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.44, 0.1, 0),
        new THREE.Vector3(0.66, -0.8, -0.12),
        new THREE.Vector3(0.46, -1.85, -0.22)
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
        new THREE.Vector3(-0.44, 0.65, 0),
        new THREE.Vector3(-0.56, -0.6, 0.1),
        new THREE.Vector3(-0.40, -1.8, 0.24)
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
      const laserGeo = new THREE.PlaneGeometry(4.2, 0.08);
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
      const particleCount = 180;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 12;
        positions[i + 1] = (Math.random() - 0.5) * 8;
        positions[i + 2] = (Math.random() - 0.5) * 10;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x2EE59D,
        size: 0.06,
        transparent: true,
        opacity: 0.45,
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

      const btns = document.querySelectorAll('.hero-3d-mode-btn');
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

      // Mobile Touch Drag
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

      // Mouse Parallax on Hero section
      const heroSection = document.querySelector('.hero-section');
      if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
          if (this.isUserDragging) return;
          const rect = heroSection.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width - 0.5;
          const normY = (e.clientY - rect.top) / rect.height - 0.5;
          this.targetRotationY += normX * 0.003;
          this.targetRotationX = 0.15 + normY * 0.2;
        });
      }

      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });
    }

    renderFallback2D() {
      const canvas = document.createElement('canvas');
      canvas.width = this.container.clientWidth || 500;
      canvas.height = this.container.clientHeight || 400;
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
        ctx.arc(cx, cy, 80 + Math.sin(angle) * 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0A4A45';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('3D DENTAL ANATOMY ACTIVE', cx, cy);

        angle += 0.03;
        requestAnimationFrame(draw);
      };
      draw();
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const time = this.clock ? this.clock.getElapsedTime() : 0;

      // Gentle auto-float when not dragging
      if (!this.isUserDragging) {
        this.targetRotationY += 0.004;
      }

      // Smooth interpolation
      if (this.toothGroup) {
        this.toothGroup.rotation.y += (this.targetRotationY - this.toothGroup.rotation.y) * 0.08;
        this.toothGroup.rotation.x += (this.targetRotationX - this.toothGroup.rotation.x) * 0.08;
        this.toothGroup.position.y = Math.sin(time * 1.5) * 0.07;

        // Explode transition
        if (this.crownMesh) {
          const targetCrownY = 0.78 + this.targetExplode * 1.2;
          this.crownMesh.position.y += (targetCrownY - this.crownMesh.position.y) * 0.1;
        }
        if (this.rootsMesh) {
          const targetRootsY = -this.targetExplode * 0.8;
          this.rootsMesh.position.y += (targetRootsY - this.rootsMesh.position.y) * 0.1;
        }
      }

      // Continuous laser scan vertical sweep
      if (this.laserPlane) {
        this.laserPlane.position.y = Math.sin(time * 2.2) * 1.6;
      }

      // Particles drift
      if (this.particles) {
        this.particles.rotation.y = time * 0.03;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // --- 3. CUSTOM PRECISION OPTIC CURSOR ---
  class CinemaOpticCursor {
    constructor() {
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

      const interactives = document.querySelectorAll('a, button, input, select, textarea, .hero-3d-mode-btn, .card');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.ring.classList.add('is-hovered');
          cinemaAudio.playClickHaptic();
        });
        el.addEventListener('mouseleave', () => {
          this.ring.classList.remove('is-hovered');
        });
      });

      const heroCanvas = document.getElementById('hero-3d-canvas-box');
      if (heroCanvas) {
        heroCanvas.addEventListener('mouseenter', () => this.ring.classList.add('is-3d-orbit'));
        heroCanvas.addEventListener('mouseleave', () => this.ring.classList.remove('is-3d-orbit'));
      }
    }

    render() {
      this.pos.x += (this.target.x - this.pos.x) * 0.18;
      this.pos.y += (this.target.y - this.pos.y) * 0.18;
      this.ring.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
      requestAnimationFrame(() => this.render());
    }
  }

  // --- 4. SCROLL REVEALS & KINETIC ROLLING NUMBER COUNTERS ---
  function initCounters() {
    const metricNumbers = document.querySelectorAll('.metric-number');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          const match = text.match(/([0-9,]+)/);
          if (match) {
            const rawNum = parseInt(match[1].replace(/,/g, ''), 10);
            const prefix = text.split(match[1])[0] || '';
            const suffix = text.split(match[1])[1] || '';
            let current = 0;
            const duration = 1400;
            const startTime = performance.now();

            const update = (now) => {
              const elapsed = now - startTime;
              const progress = Math.min(1, elapsed / duration);
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              current = Math.floor(eased * rawNum);
              el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                el.textContent = text;
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

  // --- 5. INITIALIZE ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Hero 3D Scene
    const hero3D = new Hero3DScene('hero-3d-canvas-box');

    // 2. Initialize Precision Cursor
    new CinemaOpticCursor();

    // 3. Bind Hero 3D Mode Switcher Buttons
    const modeButtons = document.querySelectorAll('.hero-3d-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (hero3D) hero3D.setMode(mode);
      });
    });

    // 4. Bind Audio Toggles
    const audioButtons = document.querySelectorAll('.cinema-audio-toggle');
    audioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cinemaAudio.toggle();
      });
    });

    // 5. Initialize Kinetic Metric Counters
    initCounters();
  });

})();
