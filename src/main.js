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

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const textureSets = {
      brick: {
        map: textureLoader.load(
          "./textures/wood_floor_1k/textures/wood_floor_diff_1k.jpg"
        ),
      },
      concrete: {
        map: textureLoader.load(
          "./textures/stone_embedded_tiles_1k/textures/stone_embedded_tiles_diff_1k.jpg"
        ),
      },
      wallpaper: {
        map: textureLoader.load(
          "./textures/grey_cartago/grey_cartago_01_diff_1k.jpg"
        ),
      },
    };

    // Wall material with transparency
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: textureSets.brick.map,
      transparent: true,
      opacity: 1, // Fully visible wall
      side: THREE.DoubleSide,
    });

    // Create a full-screen wall plane
    let wallGeometry = new THREE.PlaneGeometry(2, 2);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    scene.add(wall);

    // Function to update wall size dynamically
    const updateWallSize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      wallGeometry.dispose();
      wall.geometry = new THREE.PlaneGeometry(2 * aspect, 2);
      wall.position.set(0, 0, -2);
    };

    updateWallSize();
    window.addEventListener("resize", updateWallSize);

    // Change wall texture
    const changeTexture = (textureKey) => {
      wallMaterial.map = textureSets[textureKey].map;
      wallMaterial.map.needsUpdate = true;
    };

    // Texture Selection UI
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
      button.onclick = () => changeTexture(key);
      textureMenu.appendChild(button);
    });

    document.body.appendChild(textureMenu);

    renderer.xr.addEventListener("sessionstart", async () => {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      console.log("session end");
    });
  };

  initialize();
});
