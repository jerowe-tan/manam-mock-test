"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import type { Dish } from "@/lib/types";

export default function FoodScene({
  index,
  dishes,
  reduced,
  onFailure,
  simulateFailure = false,
}: {
  index: number;
  dishes: Dish[];
  reduced: boolean;
  onFailure: () => void;
  simulateFailure?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(index * 7);
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    target.current = index * 7;
    wake.current();
  }, [index]);
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
    renderer.setClearColor(0, 0);
    element.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 150);
    const geometry = new T.PlaneGeometry(4.9, 4.9);
    const frameGeometry = new T.BoxGeometry(5.14, 5.4, 0.12);
    const frameMaterial = new T.MeshBasicMaterial({ color: "#faf7ee" });
    const frames: T.Group[] = [],
      textures: T.Texture[] = [],
      photoMaterials: T.MeshBasicMaterial[] = [];
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
      const distance = width / height < 0.85 ? 10 : 8.6;
      camera.position.set(x + 0.6, 0.45, distance);
      camera.lookAt(x, 0, 0);
      frames.forEach((group) => {
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
    dishes.forEach((dish) => {
      const group = new T.Group();
      group.position.x = dish.scene * 7;
      group.rotation.set(-0.035, -0.1, -0.055);
      scene.add(group);
      frames.push(group);
      const backing = new T.Mesh(frameGeometry, frameMaterial);
      backing.position.y = -0.1;
      group.add(backing);
      const photoMaterial = new T.MeshBasicMaterial({ color: "#e4ddc7" });
      photoMaterials.push(photoMaterial);
      const photo = new T.Mesh(geometry, photoMaterial);
      photo.position.z = 0.07;
      group.add(photo);
      const texture = loader.load(
        dish.photo,
        (loaded) => {
          if (disposed) {
            loaded.dispose();
            return;
          }
          loaded.colorSpace = T.SRGBColorSpace;
          photoMaterial.map = loaded;
          photoMaterial.color.set("#ffffff");
          photoMaterial.needsUpdate = true;
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
      frameGeometry.dispose();
      frameMaterial.dispose();
      photoMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [dishes, reduced, onFailure, simulateFailure]);
  return <div ref={host} className="food-canvas" aria-hidden="true" />;
}
