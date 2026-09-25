"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import type { Dish } from "@/lib/types";

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
  const target = useRef(index * 7);
  const previousIndex = useRef(index);
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    if (index === previousIndex.current) return;
    const wrapsForward =
      previousIndex.current === order[order.length - 1] && index === order[0];
    const steps =
      index - previousIndex.current + (wrapsForward ? dishes.length : 0);
    target.current += steps * 7;
    previousIndex.current = index;
    wake.current();
  }, [index, order, dishes.length]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: T.WebGLRenderer;
    try {
      if (simulateFailure) throw new Error("Development WebGL failure fixture");
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onFailure();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor("#d8d2c1");
    element.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color("#d8d2c1");
    scene.add(new T.AmbientLight("#fff4da", 2.1));
    const light = new T.DirectionalLight("#ffffff", 2.2);
    light.position.set(-4, 6, 9);
    scene.add(light);
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 150);
    const period = dishes.length * 7;
    const geometry = new T.PlaneGeometry(2.6, 2.6);
    const companionGeometry = new T.PlaneGeometry(1.85, 1.85);
    const frameGeometry = new T.BoxGeometry(2.82, 2.92, 0.28);
    const companionFrameGeometry = new T.BoxGeometry(2.02, 2.14, 0.24);
    const wallGeometry = new T.BoxGeometry(6.15, 6.1, 0.16);
    const shelfGeometry = new T.BoxGeometry(6.1, 0.2, 1.75);
    const railGeometry = new T.BoxGeometry(6.1, 0.12, 0.12);
    const uprightGeometry = new T.BoxGeometry(0.16, 6.1, 0.2);
    const frameMaterial = new T.MeshStandardMaterial({
      color: "#f1ecdc",
      roughness: 0.72,
    });
    const wallMaterial = new T.MeshStandardMaterial({
      color: "#c4c0b4",
      roughness: 0.86,
    });
    const woodMaterial = new T.MeshStandardMaterial({
      color: "#916a42",
      roughness: 0.72,
    });
    const metalMaterial = new T.MeshStandardMaterial({
      color: "#4c473f",
      metalness: 0.45,
      roughness: 0.52,
    });
    const frames: T.Group[] = [],
      textures: T.Texture[] = [],
      photoMaterials = dishes.map(
        () => new T.MeshBasicMaterial({ color: "#e4ddc7" }),
      );
    let disposed = false,
      visible = true,
      frame = 0,
      x = target.current,
      width = 1,
      height = 1,
      previousTime = 0;
    const render = (time = 0) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const dt = Math.min((time - previousTime) / 1000 || 0.016, 0.05);
      previousTime = time;
      x = reduced
        ? target.current
        : T.MathUtils.lerp(x, target.current, 1 - Math.exp(-dt * 5));
      if (Math.abs(x - target.current) < 0.002) x = target.current;
      const phase = (((x / 7) % 1) + 1) % 1;
      const distance =
        (width / height < 0.75 ? 11.2 : 10.8) - 1.7 * Math.sin(Math.PI * phase);
      camera.position.set(x + 0.6, 0.55, distance);
      camera.lookAt(x, 0.15, 0);
      frames.forEach((group, i) => {
        const base = dishes[i].scene * 7;
        group.position.x = base + Math.round((x - base) / period) * period;
        group.visible = Math.abs(group.position.x - x) < 8;
      });
      try {
        renderer.render(scene, camera);
      } catch {
        onFailure();
        return;
      }
      if (x !== target.current) frame = requestAnimationFrame(render);
    };
    const requestRender = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(render);
    };
    wake.current = requestRender;
    const loader = new T.TextureLoader();
    dishes.forEach((dish, i) => {
      const group = new T.Group();
      group.position.x = dish.scene * 7;
      group.rotation.set(-0.025, i % 2 ? -0.1 : 0.1, 0);
      scene.add(group);
      frames.push(group);
      const wall = new T.Mesh(wallGeometry, wallMaterial);
      wall.position.z = -0.65;
      group.add(wall);
      [-2.45, 2.95].forEach((level) => {
        const shelf = new T.Mesh(shelfGeometry, woodMaterial);
        shelf.position.set(0, level, 0.55);
        group.add(shelf);
        const shelfRail = new T.Mesh(railGeometry, metalMaterial);
        shelfRail.position.set(0, level + 0.12, 1.47);
        group.add(shelfRail);
      });
      const topRail = new T.Mesh(railGeometry, metalMaterial);
      topRail.position.set(0, 3.02, 0.05);
      group.add(topRail);
      [-3.02, 3.02].forEach((side) => {
        const upright = new T.Mesh(uprightGeometry, metalMaterial);
        upright.position.set(side, 0, 0.05);
        group.add(upright);
      });
      const placements = [
        { item: i, x: 0.15, y: 0.45, z: 1.08, tilt: -0.04, main: true },
        {
          item: (i + dishes.length - 1) % dishes.length,
          x: -2.03,
          y: -1.26,
          z: 0.75,
          tilt: 0.13,
          main: false,
        },
        {
          item: (i + 1) % dishes.length,
          x: 2.08,
          y: 1.78,
          z: 0.77,
          tilt: -0.14,
          main: false,
        },
      ];
      placements.forEach(({ item, x, y, z, tilt, main }) => {
        const display = new T.Group();
        display.position.set(x, y, z);
        display.rotation.y = tilt;
        const backing = new T.Mesh(
          main ? frameGeometry : companionFrameGeometry,
          frameMaterial,
        );
        backing.position.z = -0.12;
        display.add(backing);
        const photo = new T.Mesh(
          main ? geometry : companionGeometry,
          photoMaterials[item],
        );
        photo.position.z = 0.06;
        display.add(photo);
        group.add(display);
      });
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
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", requestRender);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      wake.current = () => {};
      geometry.dispose();
      companionGeometry.dispose();
      frameGeometry.dispose();
      companionFrameGeometry.dispose();
      wallGeometry.dispose();
      shelfGeometry.dispose();
      railGeometry.dispose();
      uprightGeometry.dispose();
      frameMaterial.dispose();
      wallMaterial.dispose();
      woodMaterial.dispose();
      metalMaterial.dispose();
      photoMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dishes, reduced, onFailure, simulateFailure]);
  return <div ref={host} className="food-canvas" aria-hidden="true" />;
}
