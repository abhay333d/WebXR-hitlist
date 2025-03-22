import * as THREE from "three";
import { ARButton } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(ARButton.createButton(renderer));

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const createSurface = (position, normal) => {
      let rotation = new THREE.Vector3();
      let color;

      if (normal.y > 0.9) {
        rotation.set(-Math.PI / 2, 0, 0); // Floor
        color = 0x00ff00; // Green
      } else if (normal.y < -0.9) {
        rotation.set(Math.PI / 2, 0, 0); // Ceiling
        color = 0xff0000; // Red
      } else {
        rotation.set(0, Math.atan2(normal.x, normal.z), 0); // Wall
        color = 0x0000ff; // Blue
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
      plane.lookAt(position.clone().add(normal));
      scene.add(plane);
    };

    controller.addEventListener("select", () => {
      if (reticle.visible) {
        const position = new THREE.Vector3().setFromMatrixPosition(
          reticle.matrix
        );
        const normal = new THREE.Vector3(
          reticle.matrix.elements[4],
          reticle.matrix.elements[5],
          reticle.matrix.elements[6]
        );
        createSurface(position, normal);
      }
    });

    renderer.setAnimationLoop((timestamp, frame) => {
      if (!frame) return;

      const session = renderer.xr.getSession();
      if (!session) return;

      if (!hitTestSourceRequested) {
        session.requestReferenceSpace("viewer").then((referenceSpace) => {
          session
            .requestHitTestSource({ space: referenceSpace })
            .then((source) => {
              hitTestSource = source;
            });
        });
        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitPose = hit.getPose(referenceSpace);

          reticle.visible = true;
          reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }

      renderer.render(scene, camera);
    });

    renderer.xr.addEventListener("sessionend", () => {
      hitTestSourceRequested = false;
      hitTestSource = null;
    });
  };

  initialize();
});
