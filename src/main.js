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
        map: textureLoader.load("./textures/brick_wall.jpg"),
      },
      concrete: {
        map: textureLoader.load("./textures/concrete_wall.jpg"),
      },
      wallpaper: {
        map: textureLoader.load("./textures/wallpaper.jpg"),
      },
    };

    // Wall material with transparency
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: textureSets.brick.map,
      transparent: true,
      opacity: 0.6, // Semi-transparent wall
      side: THREE.DoubleSide,
    });

    // Wall Plane
    const wallGeometry = new THREE.PlaneGeometry(5, 3);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.visible = false;
    scene.add(wall);

    // Change wall texture
    const changeTexture = (textureKey) => {
      wallMaterial.map = textureSets[textureKey].map;
      wallMaterial.needsUpdate = true;
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

    // AR Hit Test
    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace(
        "viewer"
      );
      const hitTestSource = await session.requestHitTestSource({
        space: viewerReferenceSpace,
      });

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitPose = hit.getPose(referenceSpace);

          wall.visible = true;
          wall.position.setFromMatrixPosition(
            new THREE.Matrix4().fromArray(hitPose.transform.matrix)
          );
          wall.rotation.y = Math.PI; // Ensure it aligns properly
        } else {
          wall.visible = false;
        }

        renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      console.log("session end");
    });
  };

  initialize();
});
