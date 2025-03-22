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

    // Load multiple textures
    const textureLoader = new THREE.TextureLoader();
    const textureSets = {
      wood: {
        map: textureLoader.load(
          "./textures/wood_floor_1k/textures/wood_floor_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/wood_floor_1k/textures/wood_floor_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/wood_floor_1k/textures/wood_floor_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/wood_floor_1k/textures/wood_floor_arm_1k.jpg"
        ),
      },
      marble: {
        map: textureLoader.load(
          "./textures/stone_embedded-tiles_1k/textures/stone_embedded_tiles_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/stone_embedded-tiles_1k/textures/stone_embedded_tiles_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/stone_embedded-tiles_1k/textures/stone_embedded_tiles_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/stone_embedded-tiles_1k/textures/stone_embedded_tiles_arm_1k.jpg"
        ),
      },
      tiles: {
        map: textureLoader.load(
          "./textures/grey_cartago/grey_cartago_01_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/grey_cartago/grey_cartago_01_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/grey_cartago/grey_cartago_01_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/grey_cartago/grey_cartago_01_arm_1k.jpg"
        ),
      },
    };

    Object.values(textureSets).forEach((textures) => {
      Object.values(textures).forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5); // Increase tiling to make texture cover larger areas
      });
    });

    // Create floor plane (Larger Size)
    const floorSize = 10; // Increase the size to cover the whole screen
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: textureSets.wood.map,
      normalMap: textureSets.wood.normalMap,
      displacementMap: textureSets.wood.displacementMap,
      aoMap: textureSets.wood.aoMap,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.visible = false; // Initially hidden
    scene.add(floor);

    // Function to change floor texture
    const changeTexture = (textureKey) => {
      const textures = textureSets[textureKey];
      floorMaterial.map = textures.map;
      floorMaterial.normalMap = textures.normalMap;
      floorMaterial.displacementMap = textures.displacementMap;
      floorMaterial.aoMap = textures.aoMap;

      // Apply larger tiling so textures cover more area
      floorMaterial.map.repeat.set(5, 5);
      floorMaterial.normalMap.repeat.set(5, 5);
      floorMaterial.displacementMap.repeat.set(5, 5);
      floorMaterial.aoMap.repeat.set(5, 5);

      floorMaterial.needsUpdate = true;
    };

    // Create UI buttons for texture selection at the TOP
    const textureMenu = document.createElement("div");
    textureMenu.style.position = "absolute";
    textureMenu.style.top = "10px"; // Move menu to the top
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

          floor.visible = true;
          floor.position.setFromMatrixPosition(
            new THREE.Matrix4().fromArray(hitPose.transform.matrix)
          );
        } else {
          floor.visible = false;
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
