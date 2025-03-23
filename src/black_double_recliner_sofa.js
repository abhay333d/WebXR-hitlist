import * as THREE from "three";
import { ARButton } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const ringMaterial = new THREE.MeshBasicMaterial();
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.matrixAutoUpdate = false;
    ring.visible = false;
    scene.add(ring);

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

    const loadModel = (position) => {
      loader.load(
        "./models/black_double_recliner_sofa.glb",
        (gltf) => {
          const model = gltf.scene;
          model.position.copy(position);
          model.scale.set(0.8, 0.8, 0.8);

          // Compute bounding box to adjust position
          const bbox = new THREE.Box3().setFromObject(model);
          const modelHeight = bbox.max.y - bbox.min.y;

          // Adjust y-position to place the base on the ring
          model.position.y -= bbox.min.y/4;

          scene.add(model);
        },
        undefined,
        (error) => console.error("Error loading model:", error)
      );
    };

    controller.addEventListener("select", () => {
      if (ring.visible) {
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(ring.matrix);
        loadModel(position);
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

          ring.visible = true;
          ring.matrix.fromArray(hitPose.transform.matrix);
        } else {
          ring.visible = false;
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
