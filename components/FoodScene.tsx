"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import { buildTable } from "./food-models";

export default function FoodScene({
  index,
  reduced,
  onFailure,
  simulateFailure = false,
}: {
  index: number;
  reduced: boolean;
  onFailure: () => void;
  simulateFailure?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(index * 10);
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    target.current = index * 10;
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    element.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const world = buildTable();
    scene.add(world);
    const ground = new T.Mesh(
      new T.PlaneGeometry(80, 40),
      new T.ShadowMaterial({ opacity: 0.18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(10, -0.13, 0);
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(new T.HemisphereLight("#fff4d7", "#9c8149", 2.7));
    const light = new T.DirectionalLight("#fff3d6", 4);
    light.position.set(-3, 9, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = -7;
    light.shadow.camera.right = 7;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.normalBias = 0.025;
    scene.add(light, light.target);
    const fill = new T.DirectionalLight("#fff9ea", 1.6);
    fill.position.set(3, 3, -5);
    scene.add(fill);
    const camera = new T.PerspectiveCamera(37, 1, 0.1, 100);
    let x = target.current,
      frame = 0,
      visible = true,
      disposed = false,
      width = 1,
      height = 1;
    let previousTime = 0;
    const render = (time = 0) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const dt = Math.min((time - previousTime) / 1000 || 0.016, 0.05);
      previousTime = time;
      x = reduced
        ? target.current
        : T.MathUtils.lerp(x, target.current, 1 - Math.exp(-dt * 5));
      if (Math.abs(x - target.current) < 0.002) x = target.current;
      const distance = width / height < 0.85 ? 1.3 : 1;
      camera.position.set(x + 3.4 * distance, 6.7 * distance, 7.1 * distance);
      camera.lookAt(x, 0.35, 0);
      light.position.x = x - 3;
      light.target.position.set(x, 0, 0);
      light.target.updateMatrixWorld();
      world.children.forEach((group) => {
        group.visible = Math.abs(group.position.x - x) < 7;
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
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      scene.traverse((object) => {
        if (object instanceof T.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((m) => materials.add(m));
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced, onFailure, simulateFailure]);
  return <div ref={host} className="food-canvas" aria-hidden="true" />;
}
