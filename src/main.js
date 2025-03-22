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

    // Function to create a virtual surface (floor, wall, ceiling)
    const createSurface = (position, normal) => {
      let rotation = new THREE.Vector3();
      let color;

      // Determine the type of surface based on normal direction
      if (Math.abs(normal.y) > 0.9) {
        // Floor or Ceiling
        rotation.set(-Math.PI / 2, 0, 0);
        color = normal.y > 0 ? 0x00ff00 : 0xff0000; // Green for floor, Red for ceiling
      } else {
        // Walls (assuming mostly vertical)
        rotation.set(0, Math.atan2(normal.x, normal.z), 0);
        color = 0x0000ff; // Blue for walls
      }

      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.copy(position);
      plane.lookAt(position.clone().add(normal)); // Ensure correct orientation
      scene.add(plane);
    };

    controller.addEventListener("select", () => {
      if (reticle.visible) {
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3(0, 1, 0);

        position.setFromMatrixPosition(reticle.matrix);
        normal.set(
          reticle.matrix.elements[4],
          reticle.matrix.elements[5],
          reticle.matrix.elements[6]
        ); // Extract normal

        createSurface(position, normal);
      }
    });

    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      const referenceSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({
        space: referenceSpace,
      });

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const hitPose = hit.getPose(renderer.xr.getReferenceSpace());
          const hitNormal = hit.results[0].normal || new THREE.Vector3(0, 1, 0); // Default to floor

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
