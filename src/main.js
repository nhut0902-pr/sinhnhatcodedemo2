import './style.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// Constants
const CARD_WIDTH = 4
const CARD_HEIGHT = 6
const CARD_COLOR = 0xFFFFFF
const COVER_COLOR = 0xFF4B2B

// Three.js Core Setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 5, 20)

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
document.getElementById('scene-container').appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 10, 5)
directionalLight.castShadow = true
scene.add(directionalLight)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 2
controls.maxDistance = 30
controls.enabled = false

// UI Elements
const startBtn = document.getElementById('start-btn')
const startScreen = document.getElementById('start-screen')
const instruction = document.getElementById('instruction')
const messageBox = document.getElementById('message-box')
const closeMsg = document.getElementById('close-msg')

// Systems
let confettiParticles = [];
let fireworkParticles = [];
let balloons = [];
let giftBox;
let textMesh;
let candles = [];
let cake;
let userName = "";
let cardGroup, cover, insideBase;
let isOpened = false;
let isAnimating = false;

// 1. Scene Setup function
function init() {
    createRestaurant();
    createCake();
    createCard();
    createBalloons();
    createGiftBox();

    startBtn.addEventListener('click', () => {
        userName = document.getElementById('user-name').value || "Bạn";
        startExperience();
    });

    closeMsg.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

    animate()
}

function createRestaurant() {
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x221100, shininess: 30 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshPhongMaterial({ color: 0x332211 });
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat);
    wallBack.position.z = -15;
    wallBack.position.y = 6;
    scene.add(wallBack);

    const tableTopGeo = new THREE.CylinderGeometry(6, 6, 0.5, 64);
    const tableTopMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = -1;
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    scene.add(tableTop);

    const tableLegGeo = new THREE.CylinderGeometry(0.5, 0.8, 3);
    const tableLeg = new THREE.Mesh(tableLegGeo, new THREE.MeshPhongMaterial({ color: 0x442200 }));
    tableLeg.position.y = -2.5;
    scene.add(tableLeg);

    const pointLight = new THREE.PointLight(0xffaa55, 1.5, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);
}

function createCake() {
    cake = new THREE.Group();
    scene.add(cake);

    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 32), new THREE.MeshPhongMaterial({ color: 0xffcccc }));
    tier1.position.y = -0.25;
    cake.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 32), new THREE.MeshPhongMaterial({ color: 0xffffff }));
    tier2.position.y = 0.65;
    cake.add(tier2);

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const candleGroup = new THREE.Group();
        candleGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), new THREE.MeshPhongMaterial({ color: 0xff416c })));
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
        flame.position.y = 0.25;
        candleGroup.add(flame);
        candleGroup.flame = flame;
        candleGroup.position.set(Math.cos(angle) * 1, 1.25, Math.sin(angle) * 1);
        cake.add(candleGroup);
        candles.push(candleGroup);
    }
    cake.position.set(0, -0.75, 0);
    cake.scale.set(0.01, 0.01, 0.01);
}

function createCard() {
    cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 768;
    const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    insideBase = new THREE.Mesh(new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, 0.05), new THREE.MeshPhongMaterial({ map: texture }));
    insideBase.context = context; insideBase.texture = texture;
    insideBase.position.z = -0.025;
    cardGroup.add(insideBase);

    cover = new THREE.Group();
    cover.position.x = -CARD_WIDTH / 2;
    cardGroup.add(cover);

    const coverMesh = new THREE.Mesh(new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, 0.05), new THREE.MeshPhongMaterial({ color: COVER_COLOR }));
    coverMesh.position.x = CARD_WIDTH / 2;
    coverMesh.position.z = 0.025;
    cover.add(coverMesh);

    cardGroup.position.set(0, 0, 0);
    cardGroup.scale.set(0.01, 0.01, 0.01);
}

function updateCardText(name) {
    const ctx = insideBase.context;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = '#ff416c'; ctx.font = 'bold 60px cursive'; ctx.textAlign = 'center';
    ctx.fillText("Chúc Mừng", 256, 150); ctx.fillText("Sinh Nhật", 256, 230);
    ctx.fillStyle = '#333'; ctx.font = '40px sans-serif'; ctx.fillText(name, 256, 350);
    const lines = ["Chúc bạn một tuổi mới", "thật nhiều niềm vui,", "hạnh phúc và thành công!"];
    ctx.font = '30px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, 256, 450 + i * 50));
    insideBase.texture.needsUpdate = true;
}

function createBalloons() {
    const colors = [0xff416c, 0x4158d0, 0xc850c0, 0xffcc70];
    for (let i = 0; i < 15; i++) {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshPhongMaterial({ color: colors[i % 4] })));
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        string.position.y = -0.7; group.add(string);
        group.position.set((Math.random() - 0.5) * 20, Math.random() * 10, (Math.random() - 0.5) * 10 - 5);
        group.offset = Math.random() * 100;
        scene.add(group); balloons.push(group);
    }
}

function createGiftBox() {
    giftBox = new THREE.Group();
    giftBox.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0xffd700 })));
    giftBox.position.set(0, 0, 0); giftBox.scale.set(0.01, 0.01, 0.01);
    scene.add(giftBox);
}

function startExperience() {
    startScreen.style.opacity = '0';
    updateCardText(userName);
    setTimeout(() => {
        startScreen.classList.add('hidden');
        instruction.innerHTML = "<p>Nhấn vào nến để thổi!</p>";
        instruction.classList.remove('hidden');
        controls.enabled = true;
        gsap.to(camera.position, { z: 12, y: 4, duration: 2 });
        gsap.to(cake.scale, { x: 1, y: 1, z: 1, duration: 2, ease: "elastic.out(1, 0.5)" });
        gsap.to(cardGroup.position, { x: -4, z: -2, duration: 2 });
        gsap.to(cardGroup.scale, { x: 1, y: 1, z: 1, duration: 2 });
        gsap.to(giftBox.position, { x: 4, z: -2, duration: 2 });
        gsap.to(giftBox.scale, { x: 1, y: 1, z: 1, duration: 2 });
    }, 1000);
}

function blowOutCandles() {
    candles.forEach(c => c.flame.visible = false);
    triggerGrandFinale();
}

function triggerGrandFinale() {
    instruction.innerHTML = "<p>HAPPY BIRTHDAY!</p>";
    balloons.forEach(b => gsap.to(b.scale, { x: 0, y: 0, z: 0, duration: 0.5 }));
    if (!isOpened) toggleCard();
    for (let i = 0; i < 10; i++) setTimeout(triggerFirework, i * 500);
    createText(`HAPPY BIRTHDAY ${userName.toUpperCase()}!`);
}

function toggleCard() {
    if (isAnimating) return;
    isAnimating = true;
    const target = isOpened ? 0 : -Math.PI * 0.8;
    gsap.to(cover.rotation, { y: target, duration: 1.5, onComplete: () => { isOpened = !isOpened; isAnimating = false; if (isOpened) triggerConfetti(); }});
}

function triggerConfetti() {
    for (let i = 0; i < 100; i++) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide }));
        p.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.2, (Math.random() - 0.5) * 0.2);
        p.rotationSpeed = new THREE.Vector3(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2);
        scene.add(p); confettiParticles.push(p);
    }
}

function triggerFirework() {
    const origin = new THREE.Vector3((Math.random() - 0.5) * 20, Math.random() * 5 + 5, (Math.random() - 0.5) * 10 - 5);
    for (let i = 0; i < 50; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }));
        p.position.copy(origin);
        const angle = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, speed = Math.random() * 0.2;
        p.velocity = new THREE.Vector3(Math.sin(phi) * Math.cos(angle) * speed, Math.sin(phi) * Math.sin(angle) * speed, Math.cos(phi) * speed);
        scene.add(p); fireworkParticles.push(p);
    }
}

function createText(txt) {
    new FontLoader().load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
        if (textMesh) scene.remove(textMesh);
        const geo = new TextGeometry(txt, { font: font, size: 0.6, height: 0.2 });
        geo.computeBoundingBox();
        textMesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0xffd700 }));
        textMesh.position.set(-0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x), 5, -8);
        scene.add(textMesh);
        gsap.to(textMesh.position, { y: 5.5, duration: 2, repeat: -1, yoyo: true });
    });
}

function animate() {
    requestAnimationFrame(animate);
    balloons.forEach(b => { b.position.y += Math.sin(Date.now() * 0.001 + b.offset) * 0.005; b.rotation.y += 0.01; });
    confettiParticles.forEach((p, i) => { p.position.add(p.velocity); p.velocity.y -= 0.005; p.rotation.x += p.rotationSpeed.x; if (p.position.y < -10) { scene.remove(p); confettiParticles.splice(i, 1); }});
    fireworkParticles.forEach((p, i) => { p.position.add(p.velocity); p.velocity.y -= 0.002; p.scale.multiplyScalar(0.98); if (p.scale.x < 0.01) { scene.remove(p); fireworkParticles.splice(i, 1); }});
    if (giftBox) giftBox.rotation.y += 0.01;
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('click', (e) => {
    if (!controls.enabled) return;
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.intersectObjects([insideBase, cover], true).length > 0) toggleCard();
    else if (raycaster.intersectObjects(candles, true).length > 0) blowOutCandles();
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
