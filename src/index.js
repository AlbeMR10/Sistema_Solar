import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer;
let camera;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;

let nave, naveCam;
let keys = {};
let useNaveCam = false;

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "SISTEMA SOLAR";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 50);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  let camcontrols = new OrbitControls(camera, renderer.domElement);

  //Rejilla de referencia indicando tamaño y divisiones
  grid = new THREE.GridHelper(60, 60);
  //Mostrarla en vertical
  grid.geometry.rotateX(Math.PI / 2);
  grid.position.set(0, 0, 0.05);
  //scene.add(grid);

  //Añadimos las luces
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xffffff, 2, 100);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  //Creamos el fondo (una esfera gigante invertida)
  const starTexture = new THREE.TextureLoader().load("src/textures/fondo.jpg");
  const skyGeo = new THREE.SphereGeometry(500, 64, 64);
  const skyMat = new THREE.MeshBasicMaterial({
    map: starTexture,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  window.sky = sky;

  //Creamos texturas
  const sun_txr = new THREE.TextureLoader().load("src/textures/sun.jpg");

  const mercury_txr = new THREE.TextureLoader().load(
    "/src/textures/mercury.jpg"
  );
  const venus_txr = new THREE.TextureLoader().load("/src/textures/venus.jpg");
  const earth_txr = new THREE.TextureLoader().load("/src/textures/earth.jpg");
  const mars_txr = new THREE.TextureLoader().load("/src/textures/mars.jpg");
  const jupiter_txr = new THREE.TextureLoader().load(
    "/src/textures/jupiter.jpg"
  );
  const saturn_txr = new THREE.TextureLoader().load("/src/textures/saturn.jpg");
  const uranus_txr = new THREE.TextureLoader().load("/src/textures/uranus.jpg");
  const neptune_txr = new THREE.TextureLoader().load(
    "/src/textures/neptune.jpg"
  );

  const luna_txr = new THREE.TextureLoader().load("/src/textures/moon.jpg");
  const make_txr = new THREE.TextureLoader().load("/src/textures/makemake.jpg");

  //Creamos el sol, los planetas y sus satelites
  Estrella(4, 0xffff00, sun_txr);

  Planeta(0.4, 6, 1, 0xb1b1b1, 1.0, 0.85, mercury_txr); // Mercurio
  Planeta(0.5, 10, 0.8, 0xeed39f, 0.95, 0.8, venus_txr); // Venus
  Planeta(0.6, 14, 0.69, 0xffffff, 0.9, 0.75, earth_txr); // Tierra
  Planeta(0.5, 18, 0.6, 0xc1440e, 0.85, 0.7, mars_txr); // Marte
  Planeta(1.65, 23, 0.5, 0xd2b48c, 0.8, 0.65, jupiter_txr); // Júpiter
  Planeta(1.0, 28, 0.43, 0xf5deb3, 0.75, 0.6, saturn_txr); // Saturno
  Planeta(0.75, 33, 0.4, 0x7fffd4, 0.75, 0.55, uranus_txr); // Urano
  Planeta(0.75, 40, 0.35, 0x4169e1, 0.7, 0.5, neptune_txr); // Neptuno

  Luna(Planetas[2], 0.16, 1.0, 2.0, 0xaaaaaa, 0.8, luna_txr);
  Luna(Planetas[5], 0.2, 1.3, 0.5, 0xbbbbbb, 1, make_txr);

  // Creamos una nave que sera la que nos sirva para movernos de forma interactiva
  const navePivot = new THREE.Object3D();
  scene.add(navePivot);

  navePivot.position.set(-20, 10, 20);
  navePivot.lookAt(0, 0, 0);

  const naveGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
  const naveMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc });
  nave = new THREE.Mesh(naveGeo, naveMat);

  nave.rotation.x = -Math.PI / 2;

  navePivot.add(nave);

  naveCam = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  navePivot.add(naveCam);
  naveCam.position.set(0, 0.2, -0.9);
  naveCam.lookAt(0, 0, 0);

  // Guarda referencias si las necesitas
  window.navePivot = navePivot;
  window.nave = nave;
  window.naveCam = naveCam;

  //Inicio tiempo
  t0 = Date.now();
}

function Estrella(rad, col, texture = undefined) {
  let geometry = new THREE.SphereBufferGeometry(rad, 40, 40);
  let material = new THREE.MeshPhongMaterial({ color: col });

  if (texture) {
    texture.needsUpdate = true;
    material = new THREE.MeshPhongMaterial({ map: texture });
  } else {
    material = new THREE.MeshPhongMaterial({ color: col });
  }

  estrella = new THREE.Mesh(geometry, material);
  scene.add(estrella);
}

function Planeta(radio, dist, vel, col, f1, f2, texture = undefined) {
  const geom = new THREE.SphereGeometry(radio, 40, 40);
  let material;

  if (texture) {
    texture.needsUpdate = true;
    material = new THREE.MeshPhongMaterial({ map: texture });
  } else {
    material = new THREE.MeshPhongMaterial({ color: col });
  }
  let planeta = new THREE.Mesh(geom, material);
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;

  Planetas.push(planeta);
  scene.add(planeta);

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);
  scene.add(orbita);
}

function Luna(planeta, radio, dist, vel, col, angle, texture = undefined) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 10, 10);
  let material;

  if (texture) {
    texture.needsUpdate = true;
    material = new THREE.MeshPhongMaterial({ map: texture });
  } else {
    material = new THREE.MeshPhongMaterial({ color: col });
  }
  var luna = new THREE.Mesh(geom, material);
  luna.userData.dist = dist;
  luna.userData.speed = vel;

  Lunas.push(luna);
  pivote.add(luna);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  requestAnimationFrame(animationLoop);

  sky.position.copy(camera.position);
  renderer.render(scene, camera);

  if (estrella) {
    estrella.rotation.z += 0.004;
  }

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) *
      object.userData.f1 *
      object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) *
      object.userData.f2 *
      object.userData.dist;
    object.rotation.z += 0.01;
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
  }

  updateNave();

  if (useNaveCam) {
    nave.visible = false;
    renderer.render(scene, naveCam);
  } else {
    renderer.render(scene, camera);
  }
}

document.addEventListener("keypress", (e) => {
  if (e.code === "KeyC") {
    useNaveCam = !useNaveCam;
  }
});

document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

function updateNave() {
  const speed = 0.05;
  const rotSpeed = 0.02;
  if (useNaveCam) {
    // Rotación del pivote (yaw/roll)
    if (keys["ArrowLeft"]) navePivot.rotation.y -= rotSpeed;
    if (keys["ArrowRight"]) navePivot.rotation.y += rotSpeed;
    if (keys["ArrowUp"]) navePivot.rotation.x += rotSpeed;
    if (keys["ArrowDown"]) navePivot.rotation.x -= rotSpeed;

    // Traslación local del pivote
    if (keys["KeyW"]) navePivot.translateZ(speed); // hacia el Sol
    if (keys["KeyS"]) navePivot.translateZ(-speed);
    if (keys["KeyA"]) navePivot.rotation.z += rotSpeed;
    if (keys["KeyD"]) navePivot.rotation.z -= rotSpeed;
  }
}
