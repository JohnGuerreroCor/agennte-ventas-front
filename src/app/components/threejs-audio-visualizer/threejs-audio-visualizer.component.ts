import { Component, ElementRef, NgZone, OnInit, HostListener } from '@angular/core';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

@Component({
  selector: 'app-visualizer',
  templateUrl: './threejs-audio-visualizer.component.html',
  styleUrls: ['./threejs-audio-visualizer.component.css'],
})
export class VisualizerComponent implements OnInit {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private uniforms!: { [key: string]: { value: any } };
  private analyser!: THREE.AudioAnalyser;
  private clock = new THREE.Clock();
  private mouseX = 0;
  private mouseY = 0;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initThree();
    this.addMesh();
    this.initAudio();
    this.animate();
  }

  private initThree() {
    const container = this.el.nativeElement;

    // Renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Escena y cámara
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, -2, 14);
    this.camera.lookAt(0, 0, 0);

    // Postprocesado
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.18,
      0.23,
      0.4
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);
  }

  private addMesh() {
    // Configuración de uniforms
    this.uniforms = {
      u_time: { value: 0.0 },
      u_frequency: { value: 0.0 },
      u_red: { value: 0.1 },
      u_green: { value: 0.7 },
      u_blue: { value: 0.4 },
    };

    // Material con shaders
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `uniform float u_time;
      uniform float u_frequency;
      void main() {
        vec3 newPosition = position + normal * (sin(u_time + position.x) * u_frequency * 0.01);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }`,
      fragmentShader: `uniform float u_red;
      uniform float u_green;
      uniform float u_blue;
      void main() {
        gl_FragColor = vec4(u_red, u_green, u_blue, 1.0);
      }`,
      wireframe: true,
    });

    // Geometría
    const geometry = new THREE.IcosahedronGeometry(2, 10);
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  private initAudio() {
    const listener = new THREE.AudioListener();
    this.camera.add(listener);

    // Cargar un archivo de audio
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio(listener);

    audioLoader.load('assets/telephone_call.mp3', (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();

      // Configurar el analizador de audio
      this.analyser = new THREE.AudioAnalyser(sound, 256);
    });
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        // Actualiza valores de uniform
        this.uniforms['u_time'].value = this.clock.getElapsedTime();
        if (this.analyser) {
          this.uniforms['u_frequency'].value = this.analyser.getAverageFrequency();
        }

        // Interacción con mouse
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.composer.render();
        requestAnimationFrame(render);
      };
      render();
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    this.mouseX = (event.clientX - windowHalfX) / 100;
    this.mouseY = (event.clientY - windowHalfY) / 100;
  }
}
