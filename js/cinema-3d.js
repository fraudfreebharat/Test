/**
 * ==========================================================================
 * MAYRA DENTAL CARE — CINEMATIC 3D ENGINE (JS/CINEMA-3D.JS)
 * Procedural WebGL 3D Dental Anatomy, Scroll Choreography & Film Soundscape
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. PROCEDURAL CINEMATIC WEB AUDIO AMBIENCE SYNTHESIZER ---
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

      // Calm cinematic drone chords (Medical ambient aesthetic: D - F# - A - E)
      const freqs = [73.42, 110.00, 146.83, 220.00, 329.63];
      this.oscillators = freqs.map((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + index * 60, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.02 / (index + 1), this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        return { osc, gain, filter };
      });

      // Smooth fade in
      this.masterGain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 2.5);
      this.isPlaying = true;
      this.updateAudioButtons(true);
    }

    stopAmbience() {
      if (!this.ctx || !this.isPlaying) return;
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      setTimeout(() => {
        this.oscillators.forEach(o => {
          try { o.osc.stop(); } catch (e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
        this.updateAudioButtons(false);
      }, 1200);
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
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
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

  // --- 2. THREE.JS PROCEDURAL 3D DENTAL ANATOMY & SCROLL ENGINE ---
  class Dental3DScene {
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

      this.currentMode = 'natural'; // natural, wireframe, x-ray, explode
      this.targetRotationY = 0;
      this.targetRotationX = 0.15;
      this.targetCameraZ = 6.2;
      this.targetCameraY = 0.2;
      this.targetExplode = 0;

      this.isUserDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.scrollProgress = 0;
      this.clock = null;

      this.init();
    }

    async init() {
      // Ensure Three.js is loaded
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
      this.scene.fog = new THREE.FogExp2(0x0A2622, 0.04);

      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      this.camera.position.set(0, 0.3, 6.2);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
      // Ambient clinical soft wash
      const ambientLight = new THREE.AmbientLight(0xE0F2EE, 0.9);
      this.scene.add(ambientLight);

      // Key light: Surgical clean white
      const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
      keyLight.position.set(4, 5, 4);
      this.scene.add(keyLight);

      // Cool clinical cyan/teal rim light
      const rimLight = new THREE.DirectionalLight(0x268573, 2.0);
      rimLight.position.set(-5, 2, -3);
      this.scene.add(rimLight);

      // Warm restorative champagne gold fill
      const warmLight = new THREE.DirectionalLight(0xBD8E44, 0.8);
      warmLight.position.set(2, -4, 3);
      this.scene.add(warmLight);
    }

    buildProceduralDentalModel() {
      this.toothGroup = new THREE.Group();

      // --- A. Anatomical Molar Crown (Porcelain / E-Max Enamel) ---
      // Sculpted lathed organic geometry with occlusal grooves
      const crownGeo = new THREE.CylinderGeometry(1.4, 1.15, 1.4, 32, 16);
      const pos = crownGeo.attributes.position;
      // Morph vertices organically to create 4 distinct occlusal cusps
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y > 0.3) {
          // Top chewing surface: create four distinct molar cusps
          const cuspMod = Math.sin(x * 3.2) * Math.sin(z * 3.2) * 0.22;
          pos.setY(i, y + cuspMod);
          // subtle occlusal groove depression
          if (Math.abs(x) < 0.4 && Math.abs(z) < 0.4) {
            pos.setY(i, y - 0.14);
          }
        }
      }
      crownGeo.computeVertexNormals();

      this.crownMaterialNatural = new THREE.MeshPhysicalMaterial({
        color: 0xFDFAF5,
        roughness: 0.14,
        metalness: 0.05,
        transmission: 0.35, // True ceramic translucency!
        ior: 1.54,
        thickness: 0.8,
        specularIntensity: 1.0,
        specularColor: 0xFFFFFF,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1
      });

      this.crownMaterialWireframe = new THREE.MeshStandardMaterial({
        color: 0x268573,
        wireframe: true,
        emissive: 0x0A4A45,
        emissiveIntensity: 0.4
      });

      this.crownMaterialXRay = new THREE.MeshPhysicalMaterial({
        color: 0x64B5F6,
        roughness: 0.2,
        transmission: 0.85,
        transparent: true,
        opacity: 0.45,
        wireframe: false
      });

      this.crownMesh = new THREE.Mesh(crownGeo, this.crownMaterialNatural);
      this.crownMesh.position.y = 0.8;
      this.toothGroup.add(this.crownMesh);

      // --- B. Dual Anatomical Roots ---
      const rootCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.1, 0),
        new THREE.Vector3(-0.6, -0.8, 0.1),
        new THREE.Vector3(-0.4, -1.8, 0.25)
      ]);
      const rootGeo1 = new THREE.TubeGeometry(rootCurve1, 24, 0.32, 16, false);

      const rootCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.45, 0.1, 0),
        new THREE.Vector3(0.65, -0.8, -0.1),
        new THREE.Vector3(0.45, -1.8, -0.2)
      ]);
      const rootGeo2 = new THREE.TubeGeometry(rootCurve2, 24, 0.32, 16, false);

      const rootsGeo = new THREE.BufferGeometry();
      // Combine roots
      this.rootsMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xF2ECE1,
        roughness: 0.35,
        metalness: 0.0,
        transmission: 0.15
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
        new THREE.Vector3(-0.45, 0.6, 0),
        new THREE.Vector3(-0.55, -0.6, 0.1),
        new THREE.Vector3(-0.4, -1.75, 0.24)
      ]);
      const canalGeo = new THREE.TubeGeometry(canalCurve, 20, 0.09, 8, false);
      this.pulpCanalMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF7A45,
        wireframe: false
      });
      this.pulpCanalMesh = new THREE.Mesh(canalGeo, this.pulpCanalMaterial);
      this.pulpCanalMesh.visible = false;
      this.toothGroup.add(this.pulpCanalMesh);

      // --- D. Titanium Dental Implant Fixture (Straumann Style) ---
      const implantGroup = new THREE.Group();
      const screwGeo = new THREE.CylinderGeometry(0.5, 0.3, 1.8, 20, 16);
      const implantMat = new THREE.MeshStandardMaterial({
        color: 0x94A3B8,
        metalness: 0.9,
        roughness: 0.25
      });
      const screwMesh = new THREE.Mesh(screwGeo, implantMat);
      screwMesh.position.y = -0.9;
      implantGroup.add(screwMesh);

      // Golden Custom Abutment
      const abutmentGeo = new THREE.ConeGeometry(0.65, 0.7, 16);
      const abutmentMat = new THREE.MeshStandardMaterial({
        color: 0xC59E47,
        metalness: 0.85,
        roughness: 0.2
      });
      const abutmentMesh = new THREE.Mesh(abutmentGeo, abutmentMat);
      abutmentMesh.position.y = 0.2;
      abutmentMesh.rotation.x = Math.PI;
      implantGroup.add(abutmentMesh);

      this.implantMesh = implantGroup;
      this.implantMesh.visible = false;
      this.toothGroup.add(this.implantMesh);

      this.scene.add(this.toothGroup);
    }

    buildLaserScanner() {
      // 3D Optical Scanner Laser Sheet
      const laserGeo = new THREE.PlaneGeometry(4.2, 0.08);
      const laserMat = new THREE.MeshBasicMaterial({
        color: 0x2EE59D,
        transparent: true,
        opacity: 0.8,
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
        color: 0x48BB95,
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

      // Mode logic
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

      // Update button active state
      const btns = document.querySelectorAll('.mode-btn');
      btns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });
    }

    bindEvents() {
      // Mouse drag rotation
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

      // Touch events for mobile
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

      // Resize listener
      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });

      // Scroll choreography binding
      this.bindScrollChoreography();
    }

    bindScrollChoreography() {
      const filmSection = document.getElementById('cinematic-3d-viewport');
      if (!filmSection) return;

      const handleScroll = () => {
        const rect = filmSection.getBoundingClientRect();
        const windowH = window.innerHeight;

        // Progress from 0 to 1 as section crosses viewport
        const total = rect.height + windowH;
        const current = windowH - rect.top;
        const progress = Math.max(0, Math.min(1, current / total));
        this.scrollProgress = progress;

        // Film Director Scene Updates
        this.updateFilmScene(progress);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    updateFilmScene(progress) {
      const sceneLabel = document.getElementById('film-scene-indicator');
      const timecodeLabel = document.getElementById('film-timecode');
      const chapterList = document.querySelectorAll('.film-chapter-step');

      // Update Timecode (Film Clock)
      if (timecodeLabel) {
        const totalSecs = Math.floor(progress * 142);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        const frames = String(Math.floor((progress * 1420) % 24)).padStart(2, '0');
        timecodeLabel.textContent = `TC 00:${mins}:${secs}:${frames}`;
      }

      // Cinematic Acts & Camera Moves
      if (progress < 0.25) {
        // ACT I: Natural Anatomy Overview
        if (sceneLabel) sceneLabel.textContent = 'ACT I // ENAMEL BIOMIMETICS';
        this.targetCameraZ = 6.2;
        this.targetCameraY = 0.2;
        if (!this.isUserDragging) {
          this.targetRotationY = progress * 4.0;
          this.targetRotationX = 0.1;
        }
        this.updateActiveChapter(0);
      } else if (progress < 0.50) {
        // ACT II: Laser Scan Diagnostic Sweep
        if (sceneLabel) sceneLabel.textContent = 'ACT II // 20-MICRON OPTICAL SCAN';
        this.targetCameraZ = 5.2;
        this.targetCameraY = 0.5;
        if (!this.isUserDragging) {
          this.targetRotationY = 1.2 + (progress - 0.25) * 3.5;
        }
        // Laser plane vertical sweep
        if (this.laserPlane) {
          this.laserPlane.position.y = -1.8 + ((progress - 0.25) / 0.25) * 3.2;
        }
        this.updateActiveChapter(1);
      } else if (progress < 0.75) {
        // ACT III: Internal Canal Illumination
        if (sceneLabel) sceneLabel.textContent = 'ACT III // MICRO-ENDODONTIC CANAL';
        this.targetCameraZ = 4.8;
        this.targetCameraY = -0.2;
        if (!this.isUserDragging) {
          this.targetRotationY = 2.4 + (progress - 0.5) * 2.5;
        }
        this.updateActiveChapter(2);
      } else {
        // ACT IV: Zirconia Crown Lock & Reconstruction
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
      // Elegant 2D animated canvas fallback if WebGL fails
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

      const delta = this.clock ? this.clock.getDelta() : 0.016;
      const time = this.clock ? this.clock.getElapsedTime() : 0;

      // Auto gentle float if user is not dragging
      if (!this.isUserDragging) {
        this.targetRotationY += 0.003;
      }

      // Smooth interpolation (Lerp)
      if (this.toothGroup) {
        this.toothGroup.rotation.y += (this.targetRotationY - this.toothGroup.rotation.y) * 0.08;
        this.toothGroup.rotation.x += (this.targetRotationX - this.toothGroup.rotation.x) * 0.08;

        // Floating breath oscillation
        this.toothGroup.position.y = Math.sin(time * 1.5) * 0.08;

        // Explode anatomy transition
        if (this.crownMesh) {
          const targetCrownY = 0.8 + this.targetExplode * 1.2;
          this.crownMesh.position.y += (targetCrownY - this.crownMesh.position.y) * 0.1;
        }
        if (this.rootsMesh) {
          const targetRootsY = -this.targetExplode * 0.8;
          this.rootsMesh.position.y += (targetRootsY - this.rootsMesh.position.y) * 0.1;
        }
      }

      // Camera smooth zoom lerp
      if (this.camera) {
        this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 0.05;
        this.camera.position.y += (this.targetCameraY - this.camera.position.y) * 0.05;
      }

      // Particles ambient drift
      if (this.particles) {
        this.particles.rotation.y = time * 0.03;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // --- 3. 3D CARD PARALLAX TILT PHYSICS ---
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card, .showcase-frame, .service-card, .pricing-card, .principle-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within element
        const y = e.clientY - rect.top;  // y position within element

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -7; // max 7 deg tilt
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.transition = 'transform 100ms ease-out';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  // --- 4. GLOBAL INITIALIZATION ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Scene if canvas container exists
    const scene3D = new Dental3DScene('cinema-3d-canvas-box');

    // 2. Bind Mode Switcher Buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (scene3D) scene3D.setMode(mode);
      });
    });

    // 3. Bind Ambient Audio Toggles
    const audioButtons = document.querySelectorAll('.cinema-audio-toggle');
    audioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cinemaAudio.toggle();
      });
    });

    // 4. Initialize 3D Card Tilt Physics
    init3DCardTilt();
  });

})();
