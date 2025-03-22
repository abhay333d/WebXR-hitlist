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
      brick: {
        map: textureLoader.load(
          "./textures/brick_wall_1k/textures/brick_wall_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/brick_wall_1k/textures/brick_wall_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/brick_wall_1k/textures/brick_wall_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/brick_wall_1k/textures/brick_wall_arm_1k.jpg"
        ),
      },
      plaster: {
        map: textureLoader.load(
          "./textures/plaster_1k/textures/plaster_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/plaster_1k/textures/plaster_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/plaster_1k/textures/plaster_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/plaster_1k/textures/plaster_arm_1k.jpg"
        ),
      },
      concrete: {
        map: textureLoader.load(
          "./textures/concrete_1k/textures/concrete_diff_1k.jpg"
        ),
        normalMap: textureLoader.load(
          "./textures/concrete_1k/textures/concrete_nor_gl_1k.jpg"
        ),
        displacementMap: textureLoader.load(
          "./textures/concrete_1k/textures/concrete_disp_1k.jpg"
        ),
        aoMap: textureLoader.load(
          "./textures/concrete_1k/textures/concrete_arm_1k.jpg"
        ),
      },
    };

    Object.values(textureSets).forEach((textures) => {
      Object.values(textures).forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
      });
    });

    // Create wall plane
    const wallGeometry = new THREE.PlaneGeometry(3, 2);
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: textureSets.brick.map,
      normalMap: textureSets.brick.normalMap,
      displacementMap: textureSets.brick.displacementMap,
      aoMap: textureSets.brick.aoMap,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      displacementScale: 0.02,
    });

    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.visible = false;
    scene.add(wall);

    // Function to change wall texture
    const changeTexture = (textureKey) => {
      const textures = textureSets[textureKey];
      wallMaterial.map = textures.map;
      wallMaterial.normalMap = textures.normalMap;
      wallMaterial.displacementMap = textures.displacementMap;
      wallMaterial.aoMap = textures.aoMap;

      wallMaterial.map.repeat.set(3, 3);
      wallMaterial.normalMap.repeat.set(3, 3);
      wallMaterial.displacementMap.repeat.set(3, 3);
      wallMaterial.aoMap.repeat.set(3, 3);

      wallMaterial.needsUpdate = true;
    };

    // Create UI buttons for texture selection
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

    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace(
        "viewer"
      );
      const hitTestSource = await session.requestHitTestSource({
        space: viewerReferenceSpace,
        entityTypes: ["plane"],
      });

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        const referenceSpace = renderer.xr.getReferenceSpace();

        if (hitTestResults.length > 0) {
          let verticalHit = null;

          for (const hit of hitTestResults) {
            if (hit.plane && hit.plane.orientation === "vertical") {
              verticalHit = hit;
              break;
            }
          }

          if (verticalHit) {
            const hitPose = verticalHit.getPose(referenceSpace);
            const hitMatrix = new THREE.Matrix4().fromArray(
              hitPose.transform.matrix
            );
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            hitMatrix.decompose(position, quaternion, scale);
            wall.position.copy(position);
            wall.quaternion.copy(quaternion);
            wall.visible = true;
          } else {
            wall.visible = false;
          }
        } else {
          wall.visible = false;
        }

        renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      wall.visible = false;
    });
  };

  initialize();
});
