import * as THREE from "three";
import { ARButton } from "three/examples/jsm/Addons.js";

document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 3);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(ARButton.createButton(renderer));

    const textureLoader = new THREE.TextureLoader();
    const textureSets = {
      wood: textureLoader.load("./textures/wood.jpg"),
      marble: textureLoader.load("./textures/marble.jpg"),
      tiles: textureLoader.load("./textures/tiles.jpg"),
    };

    Object.values(textureSets).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });

    // Full-Screen Plane for Texture
    const aspect = window.innerWidth / window.innerHeight;
    const planeGeometry = new THREE.PlaneGeometry(2 * aspect, 2);
    const planeMaterial = new THREE.MeshStandardMaterial({
      map: textureSets.wood,
      transparent: true, // Makes it slightly transparent
      opacity: 0.8,
    });

    const screenPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(screenPlane);

    // Position the plane in front of the camera
    screenPlane.position.z = -2;

    const changeTexture = (textureKey) => {
      planeMaterial.map = textureSets[textureKey];
      planeMaterial.needsUpdate = true;
    };

    // UI for Texture Selection
    const textureMenu = document.createElement("div");
    textureMenu.style.position = "absolute";
    textureMenu.style.top = "10px";
    textureMenu.style.left = "50%";
    textureMenu.style.transform = "translateX(-50%)";
    textureMenu.style.display = "flex";
    textureMenu.style.gap = "10px";
    textureMenu.style.background = "rgba(255, 255, 255, 0.8)";
    textureMenu.style.padding = "10px";
    textureMenu.style.borderRadius = "10px";

    Object.keys(textureSets).forEach((key) => {
      const button = document.createElement("button");
      button.innerText = key.charAt(0).toUpperCase() + key.slice(1);
      button.style.padding = "8px";
      button.style.border = "none";
      button.style.cursor = "pointer";
      button.style.background = "#ddd";
      button.style.borderRadius = "5px";
      button.onclick = () => changeTexture(key);
      textureMenu.appendChild(button);
    });

    document.body.appendChild(textureMenu);

    renderer.setAnimationLoop(() => {
      screenPlane.quaternion.copy(camera.quaternion); // Make sure the plane always faces the camera
      renderer.render(scene, camera);
    });
  };

  initialize();
});
