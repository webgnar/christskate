import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { Character } from './entities/Character';
import { PlayerController } from './entities/PlayerController';

// Import textures
import flowerTexture from '/assets/textures/flower.jpg';
import shoeTexture from '/assets/textures/shoe.png';
import muscleTexture from '/assets/textures/muscle.png';
import stripesTexture from '/assets/textures/stripes.png';
import boardTexture from '/assets/textures/board.png';
import faceTexture from '/assets/textures/face.png';
import groundTexture from '/assets/textures/ground.png';

// Create texture loader at the top level
const textureLoader = new THREE.TextureLoader();
// Create font loader at the top level
const fontLoader = new FontLoader();

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.timeOfDay = 0; // 0 to 1 (0: noon, 0.5: midnight)
        
        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Add axes helper - X (red), Y (green), Z (blue)
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.y = 2;  // Move compass up 2 units
        this.scene.add(axesHelper);

        // Add axis labels using 3D text
        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textOptions = {
                font: font,
                size: 0.5,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            };

            // X-axis label (red)
            const xGeometry = new TextGeometry('X', textOptions);
            const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const xLabel = new THREE.Mesh(xGeometry, xMaterial);
            xLabel.position.set(5.5, 1.75, 0);  // Adjusted Y position to match axesHelper
            this.scene.add(xLabel);

            // Y-axis label (green)
            const yGeometry = new TextGeometry('Y', textOptions);
            const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const yLabel = new THREE.Mesh(yGeometry, yMaterial);
            yLabel.position.set(-0.25, 7.5, 0);  // Adjusted Y position (2 + 5.5)
            this.scene.add(yLabel);

            // Z-axis label (blue)
            const zGeometry = new TextGeometry('Z', textOptions);
            const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            const zLabel = new THREE.Mesh(zGeometry, zMaterial);
            zLabel.position.set(-0.25, 1.75, 5.5);  // Adjusted Y position to match axesHelper
            zLabel.rotation.y = -Math.PI / 2;
            this.scene.add(zLabel);
        });

        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Camera setup - position camera to look along X axis
        this.camera.position.set(-5, 5, 0);  // Moved to X=-5, keeping Y=5 and Z=0
        this.camera.lookAt(10, 0, 0);  // Still looking towards positive X (where B and C are)

        // Controls for development
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(10, 0, 0);  // Keep orbit center at the same point
        this.controls.update();

        this.createEnvironment();
        this.createCharacter();
        this.createLighting();
        this.createSun();

        // Load character textures
        this.loadCharacterTextures();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Start animation loop
        this.animate();
    }

    loadCharacterTextures() {
        // Load flower texture for torso
        textureLoader.load(flowerTexture, 
            (texture) => {
                console.log('Flower texture loaded successfully from:', flowerTexture);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                this.character.setTexture('torso', texture);
            },
            (xhr) => {
                console.log('Loading flower texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading flower texture:', error);
                console.error('Attempted to load from path:', flowerTexture);
            }
        );

        // Load shoe texture for feet
        textureLoader.load(shoeTexture,
            (texture) => {
                console.log('Shoe texture loaded successfully from:', shoeTexture);
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                this.character.setTexture('feet', texture);
            },
            (xhr) => {
                console.log('Loading shoe texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading shoe texture:', error);
                console.error('Attempted to load from path:', shoeTexture);
            }
        );

        // Load muscle texture for arms
        textureLoader.load(muscleTexture,
            // Success callback
            (texture) => {
                console.log('Muscle texture loaded successfully');
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                texture.rotation = Math.PI / 2;  // Rotate 90 degrees
                texture.center.set(0.5, 0.5);    // Set rotation center to middle of texture
                this.character.setTexture('arms', texture);
            },
            // Progress callback
            (xhr) => {
                console.log('Loading muscle texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            // Error callback
            (error) => {
                console.error('Error loading muscle texture:', error);
            }
        );

        // Load stripes texture for legs
        textureLoader.load(stripesTexture,
            // Success callback
            (texture) => {
                console.log('Stripes texture loaded successfully');
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                this.character.setTexture('legs', texture);
            },
            // Progress callback
            (xhr) => {
                console.log('Loading stripes texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            // Error callback
            (error) => {
                console.error('Error loading stripes texture:', error);
            }
        );

        // Load board texture for skateboard deck
        textureLoader.load(boardTexture,
            // Success callback
            (texture) => {
                console.log('Board texture loaded successfully');
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                // Get the skateboard instance and set its deck texture
                this.character.getSkateboard().setTexture('deck', texture);
            },
            // Progress callback
            (xhr) => {
                console.log('Loading board texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            // Error callback
            (error) => {
                console.error('Error loading board texture:', error);
            }
        );

        // Load face texture for head
        textureLoader.load(faceTexture,
            // Success callback
            (texture) => {
                console.log('Face texture loaded successfully');
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                this.character.setTexture('head', texture);
            },
            // Progress callback
            (xhr) => {
                console.log('Loading face texture: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            // Error callback
            (error) => {
                console.error('Error loading face texture:', error);
            }
        );
    }

    createEnvironment() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 1000);
        
        // Create a simple material that isn't affected by lighting
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,  // White color for the ground
            side: THREE.DoubleSide
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.scene.add(this.ground);

        // Load texture using imported path
        textureLoader.load(groundTexture, 
            // Success callback
            (texture) => {
                console.log('Texture loaded successfully!');
                console.log('Texture dimensions:', texture.image.width, 'x', texture.image.height);
                
                // Configure texture
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                
                // Calculate repeat values to maintain square pattern
                // Assuming we want the pattern to be 10 units wide on the ground
                const patternSize = 10; // Size in world units for one pattern repeat
                texture.repeat.set(
                    groundGeometry.parameters.width / patternSize,  // 100/10 = 10 repeats across
                    groundGeometry.parameters.height / patternSize  // 1000/10 = 100 repeats along
                );
                
                // Apply texture to material
                groundMaterial.map = texture;
                groundMaterial.needsUpdate = true;
                
                console.log('Texture applied to material with repeat:', texture.repeat.x, texture.repeat.y);
            }
        );

        // Create reference rectangle
        this.createReferenceRectangle();

        // Skybox
        this.createSkybox();
        
        // Stars
        this.createStars();
    }

    createReferenceRectangle() {
        // Add corner labels using 3D text
        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textOptions = {
                font: font,
                size: 1,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            };

            // Create and position the labels at the corners in proper 3D space
            const labels = [
                { text: 'A', position: [-10, 0.1, -10], color: 0xff0000 },  // Red for A
                { text: 'B', position: [10, 0.1, -10], color: 0x0000ff },   // Blue for B
                { text: 'C', position: [10, 0.1, 10], color: 0xffff00 },    // Yellow for C
                { text: 'D', position: [-10, 0.1, 10], color: 0xff00ff }    // Magenta for D
            ];

            labels.forEach(label => {
                const textGeometry = new TextGeometry(label.text, textOptions);
                const textMaterial = new THREE.MeshBasicMaterial({ color: label.color });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(...label.position);
                textMesh.rotation.x = -Math.PI / 2;
                this.scene.add(textMesh);
            });
        });
    }

    createSun() {
        // Create a glowing sun sphere
        const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 1
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // Add a larger, more transparent glow sphere
        const glowGeometry = new THREE.SphereGeometry(21, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffee88,
            transparent: true,
            opacity: 0.3
        });
        this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(this.sunGlow);

        // Create moon
        const moonGeometry = new THREE.SphereGeometry(5, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 1
        });
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);

        // Moon glow
        const moonGlowGeometry = new THREE.SphereGeometry(7, 32, 32);
        const moonGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8888ff,
            transparent: true,
            opacity: 0.2
        });
        this.moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
        this.moon.add(this.moonGlow);

        this.scene.add(this.sun);
        this.scene.add(this.moon);
    }

    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
        skyGeometry.scale(-1, 1, 1);

        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                timeOfDay: { value: this.timeOfDay }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = normalize(worldPosition.xyz);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float timeOfDay;
                varying vec3 vWorldPosition;

                vec3 getSunsetColor() {
                    float h = abs(vWorldPosition.y);
                    
                    vec3 topColor = vec3(0.1, 0.15, 0.4);    // Dark blue
                    vec3 middleColor = vec3(0.95, 0.33, 0.15); // Orange
                    vec3 bottomColor = vec3(0.95, 0.6, 0.4);  // Light orange/pink
                    
                    if (h > 0.3) {
                        return mix(middleColor, topColor, (h - 0.3) / 0.7);
                    } else {
                        return mix(bottomColor, middleColor, h / 0.3);
                    }
                }

                vec3 getDayColor() {
                    vec3 topColor = vec3(0.1, 0.3, 0.9);   // Sky blue
                    vec3 bottomColor = vec3(0.5, 0.6, 1.0); // Light blue
                    float h = abs(vWorldPosition.y);
                    return mix(bottomColor, topColor, h);
                }

                vec3 getNightColor() {
                    vec3 topColor = vec3(0.0, 0.0, 0.1);   // Dark blue
                    vec3 bottomColor = vec3(0.05, 0.05, 0.15); // Slightly lighter blue
                    float h = abs(vWorldPosition.y);
                    return mix(bottomColor, topColor, h);
                }

                void main() {
                    vec3 dayColor = getDayColor();
                    vec3 nightColor = getNightColor();
                    vec3 sunsetColor = getSunsetColor();
                    
                    float time = timeOfDay;
                    vec3 finalColor;
                    
                    // Six states with transitions:
                    // 0.0-0.167: Sunrise (1% to 50% sun)
                    // 0.167-0.333: Morning to Noon (50% to 100% sun)
                    // 0.333-0.5: Afternoon to Sunset (100% to 1% sun)
                    // 0.5-0.667: Moonrise (1% to 50% moon)
                    // 0.667-0.833: Evening to Midnight (50% to 100% moon)
                    // 0.833-1.0: Late night to Dawn (100% to 1% moon)
                    
                    if (time < 0.167) { // Sunrise
                        float t = time / 0.167;
                        finalColor = mix(sunsetColor, dayColor, smoothstep(0.0, 1.0, t));
                    } else if (time < 0.333) { // Morning to Noon
                        finalColor = dayColor;
                    } else if (time < 0.5) { // Afternoon to Sunset
                        float t = (time - 0.333) / 0.167;
                        finalColor = mix(dayColor, sunsetColor, smoothstep(0.0, 1.0, t));
                    } else if (time < 0.667) { // Moonrise
                        float t = (time - 0.5) / 0.167;
                        finalColor = mix(sunsetColor, nightColor, smoothstep(0.0, 1.0, t));
                    } else if (time < 0.833) { // Evening to Midnight
                        finalColor = nightColor;
                    } else { // Late night to Dawn
                        float t = (time - 0.833) / 0.167;
                        finalColor = mix(nightColor, sunsetColor, smoothstep(0.0, 1.0, t));
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.FrontSide
        });

        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skybox);
    }

    createCharacter() {
        // Create new character instance
        this.character = new Character();
        // Add character to scene
        this.scene.add(this.character.getObject());
        // Store reference to character light
        this.characterLight = this.character.getLight();
        
        // Create player controller
        this.playerController = new PlayerController(this.character);
    }

    createLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    createStars() {
        // Create main star field
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        // Create random star positions on the inside of a sphere
        for (let i = 0; i < starCount; i++) {
            const radius = 450; // Slightly smaller than skybox
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Vary star sizes
            const random = Math.random();
            if (random > 0.99) {
                sizes[i] = 3.0; // Very bright stars (1%)
            } else if (random > 0.95) {
                sizes[i] = 2.0; // Medium bright stars (4%)
            } else {
                sizes[i] = 1.0; // Regular stars (95%)
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0,
            size: 2,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);

        // Create constellations
        const constellations = [
            // Orion
            [[0, 200, -350], [20, 220, -350], [40, 240, -350],
             [0, 260, -350], [-20, 280, -350],
             [40, 260, -350], [60, 280, -350],
             [-40, 260, -350], [-60, 280, -350],
             [0, 180, -350], [-20, 160, -350],
             [20, 160, -350], [40, 140, -350]],
            
            // Big Dipper
            [[200, 300, -300], [220, 310, -300], [240, 315, -300],
             [260, 320, -300], [270, 340, -300], [260, 360, -300],
             [240, 370, -300]],
             
            // Cassiopeia
            [[-200, 350, -250], [-180, 370, -250], [-160, 350, -250],
             [-140, 370, -250], [-120, 350, -250]]
        ];

        // Create constellation geometry
        const constellationGeometry = new THREE.BufferGeometry();
        const constellationPoints = [];
        const constellationSizes = [];

        constellations.forEach(constellation => {
            constellation.forEach(point => {
                constellationPoints.push(...point);
                constellationSizes.push(4.0); // Larger size for constellation stars
            });
        });

        constellationGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(constellationPoints, 3));
        constellationGeometry.setAttribute('size',
            new THREE.Float32BufferAttribute(constellationSizes, 1));

        const constellationMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0,
            size: 3,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });

        this.constellationStars = new THREE.Points(constellationGeometry, constellationMaterial);
        this.scene.add(this.constellationStars);

        // Create constellation lines
        const lineGeometry = new THREE.BufferGeometry();
        const lineVertices = [];

        constellations.forEach(constellation => {
            for (let i = 0; i < constellation.length - 1; i++) {
                lineVertices.push(...constellation[i], ...constellation[i + 1]);
            }
        });

        lineGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(lineVertices, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        this.scene.add(this.constellationLines);
    }

    updateDayNightCycle(deltaTime) {
        // Complete cycle every 60 seconds
        this.timeOfDay = (this.timeOfDay + deltaTime / 60) % 1;
        
        // Update celestial bodies positions
        const radius = 100;
        const angle = this.timeOfDay * Math.PI * 2;
        
        // Sun position
        const sunX = Math.cos(angle) * radius;
        const sunY = Math.sin(angle) * radius;
        this.sun.position.set(sunX, sunY, 0);
        
        // Moon position (opposite to sun)
        const moonX = -Math.cos(angle) * radius;
        const moonY = -Math.sin(angle) * radius;
        this.moon.position.set(moonX, moonY, 0);
        
        // Calculate intensities based on the 6 states
        let sunIntensity, moonIntensity, starsIntensity, characterLightIntensity;
        
        if (this.timeOfDay < 0.167) { // Sunrise (1% to 50%)
            sunIntensity = lerp(0.01, 0.5, this.timeOfDay / 0.167);
            moonIntensity = lerp(0.5, 0, this.timeOfDay / 0.167);
            starsIntensity = lerp(0.5, 0, this.timeOfDay / 0.167);
            characterLightIntensity = lerp(0.5, 0, this.timeOfDay / 0.167);
        } else if (this.timeOfDay < 0.333) { // Morning to Noon (50% to 100%)
            sunIntensity = lerp(0.5, 1.0, (this.timeOfDay - 0.167) / 0.167);
            moonIntensity = 0;
            starsIntensity = 0;
            characterLightIntensity = 0;
        } else if (this.timeOfDay < 0.5) { // Afternoon to Sunset (100% to 1%)
            sunIntensity = lerp(1.0, 0.01, (this.timeOfDay - 0.333) / 0.167);
            moonIntensity = lerp(0, 0.01, (this.timeOfDay - 0.333) / 0.167);
            starsIntensity = 0;
            characterLightIntensity = lerp(0, 0.3, (this.timeOfDay - 0.333) / 0.167);
        } else if (this.timeOfDay < 0.667) { // Moonrise (1% to 50%)
            sunIntensity = 0;
            moonIntensity = lerp(0.01, 0.5, (this.timeOfDay - 0.5) / 0.167);
            starsIntensity = lerp(0, 0.8, (this.timeOfDay - 0.5) / 0.167);
            characterLightIntensity = lerp(0.3, 0.7, (this.timeOfDay - 0.5) / 0.167);
        } else if (this.timeOfDay < 0.833) { // Evening to Midnight (50% to 100%)
            sunIntensity = 0;
            moonIntensity = lerp(0.5, 1.0, (this.timeOfDay - 0.667) / 0.167);
            starsIntensity = 0.8;
            characterLightIntensity = 0.7;
        } else { // Late night to Dawn (100% to 1%)
            sunIntensity = lerp(0, 0.01, (this.timeOfDay - 0.833) / 0.167);
            moonIntensity = lerp(1.0, 0.5, (this.timeOfDay - 0.833) / 0.167);
            starsIntensity = lerp(0.8, 0.5, (this.timeOfDay - 0.833) / 0.167);
            characterLightIntensity = lerp(0.7, 0.5, (this.timeOfDay - 0.833) / 0.167);
        }
        
        // Helper functions
        function lerp(start, end, t) {
            return start * (1 - t) + end * t;
        }

        function smoothstep(min, max, value) {
            const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
            return x * x * (3 - 2 * x);
        }
        
        // Apply intensities with smooth transitions
        this.sun.material.opacity = sunIntensity;
        this.sunGlow.material.opacity = sunIntensity * 0.3;
        this.moon.material.opacity = moonIntensity;
        this.moonGlow.material.opacity = moonIntensity * 0.3;
        
        // Update stars visibility
        this.stars.material.opacity = starsIntensity;
        this.constellationStars.material.opacity = starsIntensity * 1.2;
        this.constellationLines.material.opacity = starsIntensity * 0.3;

        // Update skybox
        this.skybox.material.uniforms.timeOfDay.value = this.timeOfDay;

        // Rotate stars slowly
        const time = this.clock.getElapsedTime();
        this.stars.rotation.y = time * 0.02;
        this.constellationStars.rotation.y = time * 0.02;
        this.constellationLines.rotation.y = time * 0.02;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update player controller
        if (this.playerController) {
            this.playerController.update(deltaTime);
        }
        
        // Update character if it exists
        if (this.character) {
            this.character.update(deltaTime);
        }

        // Update day/night cycle
        this.updateDayNightCycle(deltaTime);
        
        // Update character light intensity from day/night cycle
        if (this.character) {
            this.character.setLightIntensity(this.characterLight.intensity);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
const game = new Game(); 