"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import type { Dish } from "@/lib/types";

type Pose = { x: number; y: number; z: number; lookX: number; lookY: number };

export default function FoodScene({
  index,
  dishes,
  order,
  reduced,
  onFailure,
  simulateFailure = false,
}: {
  index: number;
  dishes: Dish[];
  order: number[];
  reduced: boolean;
  onFailure: () => void;
  simulateFailure?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const previousIndex = useRef(index);
  const pending = useRef<{ index: number; wrap: boolean } | null>(null);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    if (index === previousIndex.current) return;
    pending.current = {
      index,
      wrap:
        previousIndex.current === order[order.length - 1] && index === order[0],
    };
    previousIndex.current = index;
    wake.current();
  }, [index, order]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: T.WebGLRenderer;
    try {
      if (simulateFailure) throw new Error("Development WebGL failure fixture");
      renderer = new T.WebGLRenderer({ antialias: true });
    } catch {
      onFailure();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    element.appendChild(renderer.domElement);

    const scene = new T.Scene();
    scene.background = new T.Color("#bdbbb0");
    scene.add(new T.AmbientLight("#fff2dc", 1.55));
    const key = new T.DirectionalLight("#fff6e5", 3.2);
    key.position.set(-5, 9, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -9,
      right: 9,
      top: 8,
      bottom: -8,
      near: 1,
      far: 30,
    });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.00025;
    scene.add(key);
    const fill = new T.DirectionalLight("#e7f1ed", 0.85);
    fill.position.set(8, 2, 7);
    scene.add(fill);
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) {
      renderer.dispose();
      renderer.domElement.remove();
      onFailure();
      return;
    }
    context.fillStyle = "#9b6840";
    context.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 240; i++) {
      const y = i * 2.25;
      const wave = Math.sin(i * 0.17) * 8 + Math.sin(i * 0.043) * 15;
      context.strokeStyle =
        i % 5 === 0 ? "rgba(57,31,17,.18)" : "rgba(232,184,119,.11)";
      context.lineWidth = i % 9 === 0 ? 1.8 : 0.7;
      context.beginPath();
      context.moveTo(0, y + wave);
      context.bezierCurveTo(140, y - wave, 335, y + wave * 1.8, 512, y);
      context.stroke();
    }
    const woodTexture = new T.CanvasTexture(canvas);
    woodTexture.colorSpace = T.SRGBColorSpace;
    woodTexture.wrapS = woodTexture.wrapT = T.RepeatWrapping;
    const wood = new T.MeshStandardMaterial({
      map: woodTexture,
      color: "#e6c49a",
      roughness: 0.62,
    });
    const wall = new T.MeshStandardMaterial({
      color: "#d8d0bb",
      roughness: 0.88,
    });
    const plaster = new T.MeshStandardMaterial({
      color: "#d0cbbc",
      roughness: 1,
    });
    const metal = new T.MeshStandardMaterial({
      color: "#7c6040",
      metalness: 0.7,
      roughness: 0.3,
    });
    const paper = new T.MeshStandardMaterial({
      color: "#fff6de",
      roughness: 0.9,
    });
    const photoMaterials = dishes.map(
      () => new T.MeshBasicMaterial({ color: "#e4ddc7" }),
    );
    const textures: T.Texture[] = [];
    const geometries: T.BufferGeometry[] = [];
    let disposed = false;
    let frame = 0;
    let delayTimer = 0;
    let visible = true;
    const addBox = (
      width: number,
      height: number,
      depth: number,
      material: T.Material,
      x: number,
      y: number,
      z: number,
      parent: T.Object3D = scene,
    ) => {
      const geometry = new T.BoxGeometry(width, height, depth);
      geometries.push(geometry);
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addBox(50, 40, 0.1, plaster, 0, 0, -1.7).castShadow = false;
    addBox(14.8, 7.25, 0.2, wall, 0, 0, -1.12);
    [-7.35, 7.35].forEach((x) => {
      addBox(0.32, 7.6, 2.4, wood, x, 0, 0);
      addBox(0.08, 7.65, 0.12, metal, x < 0 ? x + 0.19 : x - 0.19, 0, 1.22);
    });
    [-3.65, 0.02, 3.65].forEach((y) => {
      addBox(14.95, 0.28, 2.65, wood, 0, y, 0.17);
      addBox(14.95, 0.08, 0.1, metal, 0, y + 0.17, 1.5);
    });
    addBox(15.25, 0.18, 2.9, wood, 0, 3.95, 0.12);
    [-5.5, 5.5].forEach((x) => addBox(0.42, 0.58, 1.8, metal, x, -4.1, -0.05));

    const photoGeometry = new T.PlaneGeometry(2.18, 2.18);
    geometries.push(photoGeometry);
    const tagGeometry = new T.PlaneGeometry(1.88, 0.34);
    geometries.push(tagGeometry);
    const tagMaterials: T.MeshBasicMaterial[] = [];
    const tagTextures: T.Texture[] = [];
    const positions = new Map<number, { x: number; y: number }>();
    const loader = new T.TextureLoader();
    dishes.forEach((dish, i) => {
      const row = Math.floor(dish.scene / 5);
      const column = row === 0 ? dish.scene % 5 : 4 - (dish.scene % 5);
      const x = (column - 2) * 2.78;
      const y = row === 0 ? 1.82 : -1.85;
      positions.set(dish.scene, { x, y });
      const display = new T.Group();
      display.position.set(x, y, 0.42 + (column % 2) * 0.12);
      display.rotation.y = (column - 2) * -0.035;
      scene.add(display);
      addBox(2.34, 2.42, 0.15, paper, 0, 0, 0, display);
      const photo = new T.Mesh(photoGeometry, photoMaterials[i]);
      photo.position.z = 0.085;
      display.add(photo);
      addBox(0.12, 0.28, 0.75, metal, 0, -1.3, -0.25, display);
      addBox(1.22, 0.06, 0.46, metal, 0, -1.42, -0.02, display);
      const tagCanvas = document.createElement("canvas");
      tagCanvas.width = 512;
      tagCanvas.height = 92;
      const tagContext = tagCanvas.getContext("2d");
      if (tagContext) {
        tagContext.fillStyle = "#f7e7bd";
        tagContext.fillRect(0, 0, 512, 92);
        tagContext.fillStyle = "#30281c";
        tagContext.font = "600 31px Arial";
        tagContext.textAlign = "center";
        tagContext.textBaseline = "middle";
        tagContext.fillText(dish.shortName, 256, 46, 470);
        const tagTexture = new T.CanvasTexture(tagCanvas);
        tagTexture.colorSpace = T.SRGBColorSpace;
        tagTextures.push(tagTexture);
        const tagMaterial = new T.MeshBasicMaterial({ map: tagTexture });
        tagMaterials.push(tagMaterial);
        const tag = new T.Mesh(tagGeometry, tagMaterial);
        tag.position.set(x, row === 0 ? 0.23 : -3.44, 1.59);
        scene.add(tag);
      }
      const texture = loader.load(
        dish.photo,
        (loaded) => {
          if (disposed) {
            loaded.dispose();
            return;
          }
          loaded.colorSpace = T.SRGBColorSpace;
          photoMaterials[i].map = loaded;
          photoMaterials[i].color.set("#ffffff");
          photoMaterials[i].needsUpdate = true;
          requestRender();
        },
        undefined,
        () => {
          if (!disposed) onFailure();
        },
      );
      textures.push(texture);
    });

    let aspect = 1.7;
    const overview = (): Pose => ({
      x: 0,
      y: 0.4,
      z: aspect < 0.75 ? 37 : 15.8,
      lookX: 0,
      lookY: 0,
    });
    const focus = (sceneIndex: number): Pose => {
      const spot = positions.get(sceneIndex) ?? { x: 0, y: 0 };
      return {
        x: spot.x + (aspect < 0.75 ? 0 : 0.25),
        y: spot.y + 0.1,
        z: aspect < 0.75 ? 6.2 : 4.5,
        lookX: spot.x,
        lookY: spot.y,
      };
    };
    const mix = (a: Pose, b: Pose, t: number): Pose => ({
      x: T.MathUtils.lerp(a.x, b.x, t),
      y: T.MathUtils.lerp(a.y, b.y, t),
      z: T.MathUtils.lerp(a.z, b.z, t),
      lookX: T.MathUtils.lerp(a.lookX, b.lookX, t),
      lookY: T.MathUtils.lerp(a.lookY, b.lookY, t),
    });
    const ease = (t: number) => t * t * (3 - 2 * t);
    let currentScene = index;
    let pose = reduced ? focus(index) : overview();
    let motion:
      | { from: Pose; to: Pose; start: number; duration: number; wrap: boolean }
      | undefined = reduced
      ? undefined
      : {
          from: overview(),
          to: focus(index),
          start: performance.now() + 4000,
          duration: 2400,
          wrap: false,
        };
    const render = (time = performance.now()) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      if (pending.current) {
        window.clearTimeout(delayTimer);
        delayTimer = 0;
        const next = pending.current;
        pending.current = null;
        currentScene = next.index;
        motion = reduced
          ? undefined
          : {
              from: pose,
              to: focus(currentScene),
              start: time,
              duration: next.wrap ? 4900 : 2300,
              wrap: next.wrap,
            };
        if (reduced) pose = focus(currentScene);
      }
      if (motion) {
        const elapsed = (time - motion.start) / motion.duration;
        if (elapsed >= 1) {
          pose = motion.to;
          motion = undefined;
        } else if (elapsed >= 0) {
          if (motion.wrap) {
            const wide = overview();
            pose =
              elapsed < 0.42
                ? mix(motion.from, wide, ease(elapsed / 0.42))
                : elapsed < 0.58
                  ? wide
                  : mix(wide, motion.to, ease((elapsed - 0.58) / 0.42));
          } else {
            pose = mix(motion.from, motion.to, ease(elapsed));
            if (motion.from.z < 8) pose.z += 2.1 * Math.sin(Math.PI * elapsed);
          }
        }
      }
      camera.position.set(pose.x, pose.y, pose.z);
      camera.lookAt(pose.lookX, pose.lookY, 0);
      try {
        renderer.render(scene, camera);
      } catch {
        onFailure();
        return;
      }
      if (motion && time < motion.start && !delayTimer) {
        delayTimer = window.setTimeout(() => {
          delayTimer = 0;
          requestRender();
        }, motion.start - time);
      } else if (motion && time >= motion.start) {
        frame = requestAnimationFrame(render);
      }
    };
    const requestRender = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(render);
    };
    wake.current = requestRender;
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      aspect = width / height;
      camera.fov = aspect < 0.75 ? 50 : 38;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (motion && motion.start > performance.now()) {
        motion.from = overview();
        motion.to = focus(currentScene);
        pose = motion.from;
      } else if (!motion && reduced) {
        pose = focus(currentScene);
      }
      requestRender();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestRender();
    });
    observer.observe(element);
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", requestRender);
    requestRender();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(delayTimer);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", requestRender);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      wake.current = () => {};
      geometries.forEach((geometry) => geometry.dispose());
      photoMaterials.forEach((material) => material.dispose());
      tagMaterials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      tagTextures.forEach((texture) => texture.dispose());
      woodTexture.dispose();
      [wood, wall, plaster, metal, paper].forEach((material) =>
        material.dispose(),
      );
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dishes, reduced, onFailure, simulateFailure]);

  return <div ref={host} className="food-canvas" aria-hidden="true" />;
}
