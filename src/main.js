import * as THREE from "three";
import { ARButton } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

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

    const loader = new GLTFLoader();

    // Function to create a virtual surface
    const createSurface = (position, rotation, color = 0x00ff00) => {
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6, // Adjust transparency
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.position.copy(position);
      plane.rotation.set(rotation.x, rotation.y, rotation.z);
      scene.add(plane);
    };

    // Function to load and place the model
    const loadModel = (position) => {
      loader.load(
        "./models/storage_bench.glb",
        (gltf) => {
          const model = gltf.scene;
          model.position.copy(position);
          model.scale.set(0.08, 0.08, 0.08);
          scene.add(model);
        },
        undefined,
        (error) => console.error("Error loading model:", error)
      );
    };

    controller.addEventListener("select", () => {
      if (reticle.visible) {
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(reticle.matrix);

        // Load a model OR create a virtual floor/wall
        createSurface(
          position,
          new THREE.Vector3(-Math.PI / 2, 0, 0),
          0x0000ff
        ); // Blue floor

        loadModel(position); // Optional: Place model too
      }
    });

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

          reticle.visible = true;
          reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
          reticle.visible = false;
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
