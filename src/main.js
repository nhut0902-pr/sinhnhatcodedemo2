import './style.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// Constants
const CARD_WIDTH = 5
const CARD_HEIGHT = 7
const CARD_COLOR = 0xFFFFFF
const COVER_COLOR = 0xFF5757

// Three.js Core Setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 0, 10)

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
document.getElementById('scene-container').appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 5, 5)
directionalLight.castShadow = true
scene.add(directionalLight)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 5
controls.maxDistance = 20
controls.autoRotate = false
controls.enabled = false // Disable initially

// UI Elements
const startBtn = document.getElementById('start-btn')
const startScreen = document.getElementById('start-screen')
const instruction = document.getElementById('instruction')
const messageBox = document.getElementById('message-box')
const closeMsg = document.getElementById('close-msg')

// Objects
let cardGroup, cover, insideBase, insideTop;
let isOpened = false;
let isAnimating = false;

// Systems
let confettiParticles = [];
let balloons = [];
let giftBox;
let textMesh;

// 1. Scene Setup function
function init() {
    createCard();
    createBalloons();
    createGiftBox();
    createText();

    // Add event listeners
    startBtn.addEventListener('click', startExperience);
    closeMsg.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

    animate()
}

function createCard() {
    cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardWidth = 4;
    const cardHeight = 6;
    const cardThickness = 0.05;

    // Inside Base (The back of the card)
    const insideBaseGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
    const insideBaseMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    insideBase = new THREE.Mesh(insideBaseGeometry, insideBaseMaterial);
    insideBase.position.z = -cardThickness / 2;
    cardGroup.add(insideBase);

    // Cover Group (for rotation from the edge)
    cover = new THREE.Group();
    cover.position.x = -cardWidth / 2; // Pivot at the left edge
    cardGroup.add(cover);

    // The Front Cover mesh
    const coverGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
    const coverMaterial = new THREE.MeshPhongMaterial({ color: 0xff4b2b });
    const coverMesh = new THREE.Mesh(coverGeometry, coverMaterial);
    coverMesh.position.x = cardWidth / 2; // Offset so it aligns correctly with the pivot
    coverMesh.position.z = cardThickness / 2;
    cover.add(coverMesh);

    // Add some decoration to the cover
    const decoGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
    const decoMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const deco = new THREE.Mesh(decoGeometry, decoMaterial);
    deco.position.z = cardThickness + 0.01;
    coverMesh.add(deco);

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        if (!controls.enabled) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([insideBase, coverMesh], true);

        if (intersects.length > 0) {
            toggleCard();
        }
    });
}

function toggleCard() {
    if (isAnimating) return;
    isAnimating = true;

    const targetRotation = isOpened ? 0 : -Math.PI * 0.8;

    gsap.to(cover.rotation, {
        y: targetRotation,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
            isOpened = !isOpened;
            isAnimating = false;
            if (isOpened) {
                messageBox.classList.remove('hidden');
                triggerConfetti();
            }
        }
    });

    if (isOpened) {
        messageBox.classList.add('hidden');
    }
}

function startExperience() {
    startScreen.style.opacity = '0';
    setTimeout(() => {
        startScreen.classList.add('hidden');
        instruction.classList.remove('hidden');
        controls.enabled = true;

        // Initial animation
        gsap.to(camera.position, {
            z: 8,
            y: 1,
            duration: 2,
            ease: "power2.inOut"
        });

        gsap.to(cardGroup.rotation, {
            y: Math.PI * 2,
            duration: 2,
            ease: "power2.inOut"
        });

        // Add background music logic if we had a file
        // For now, let's just use visual feedback
    }, 1000);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation Loop
function animate() {
    requestAnimationFrame(animate)

    // Animate Balloons
    balloons.forEach(balloon => {
        balloon.position.y += Math.sin(Date.now() * 0.001 + balloon.offset) * 0.005;
        balloon.rotation.y += 0.01;
    });

    // Update Confetti
    updateConfetti();

    // Gift box rotation
    if (giftBox) {
        giftBox.rotation.y += 0.01;
    }

    controls.update()
    renderer.render(scene, camera)
}

function createBalloons() {
    const balloonColors = [0xff416c, 0x4158d0, 0xc850c0, 0xffcc70];

    for (let i = 0; i < 15; i++) {
        const group = new THREE.Group();

        // Balloon
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
            shininess: 100
        });
        const balloon = new THREE.Mesh(geometry, material);
        group.add(balloon);

        // String
        const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 1);
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const string = new THREE.Mesh(stringGeo, stringMat);
        string.position.y = -0.7;
        group.add(string);

        group.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 2,
            (Math.random() - 0.5) * 10 - 5
        );
        group.offset = Math.random() * 100;

        scene.add(group);
        balloons.push(group);
    }
}

function createGiftBox() {
    giftBox = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    giftBox.add(box);

    const ribbon1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.2, 1.05),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    giftBox.add(ribbon1);

    const ribbon2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.05, 1.05),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    giftBox.add(ribbon2);

    giftBox.position.set(5, -3, 2);
    scene.add(giftBox);
}

function triggerConfetti() {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    for (let i = 0; i < 100; i++) {
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            side: THREE.DoubleSide
        });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.set(0, 0, 0);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.2,
            Math.random() * 0.2,
            Math.random() * 0.2
        );

        scene.add(particle);
        confettiParticles.push(particle);
    }
}

function updateConfetti() {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.position.add(p.velocity);
        p.velocity.y -= 0.005; // Gravity

        p.rotation.x += p.rotationSpeed.x;
        p.rotation.y += p.rotationSpeed.y;
        p.rotation.z += p.rotationSpeed.z;

        if (p.position.y < -10) {
            scene.remove(p);
            confettiParticles.splice(i, 1);
        }
    }
}

function createText() {
    const loader = new FontLoader();
    // Using a hosted font for simplicity
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
        const textGeo = new TextGeometry('Happy Birthday!', {
            font: font,
            size: 0.8,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        });

        textGeo.computeBoundingBox();
        const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

        const textMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 100 });
        textMesh = new THREE.Mesh(textGeo, textMat);

        textMesh.position.x = centerOffset;
        textMesh.position.y = 4;
        textMesh.position.z = -2;

        scene.add(textMesh);

        // Float animation
        gsap.to(textMesh.position, {
            y: 4.5,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });
    });
}

init()
