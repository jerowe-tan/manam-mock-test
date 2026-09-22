import * as T from "three";

export function buildTable() {
  const world = new T.Group();
  const materials = new Map<string, T.MeshStandardMaterial>();
  const material = (color: string, roughness = 0.6, metalness = 0) => {
    const key = `${color}:${roughness}:${metalness}`;
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshStandardMaterial({ color, roughness, metalness }),
      );
    return materials.get(key)!;
  };
  const mesh = (
    parent: T.Group,
    geometry: T.BufferGeometry,
    color: string,
    position: number[],
    scale = [1, 1, 1],
    roughness = 0.6,
    metalness = 0,
  ) => {
    const m = new T.Mesh(geometry, material(color, roughness, metalness));
    m.position.set(position[0], position[1], position[2]);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const sphere = new T.SphereGeometry(1, 20, 14);
  const cube = new T.BoxGeometry(1, 1, 1);
  const cylinder = (a: number, b: number, h: number) =>
    new T.CylinderGeometry(a, b, h, 64);
  const ring = (
    parent: T.Group,
    r: number,
    tube: number,
    y: number,
    color: string,
  ) => {
    const m = mesh(parent, new T.TorusGeometry(r, tube, 12, 96), color, [
      0,
      y,
      0,
    ]);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const scatter = (
    parent: T.Group,
    count: number,
    radius: number,
    y: number,
    colors: string[],
    size: number,
  ) => {
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * radius;
      const m = mesh(
        parent,
        cube,
        colors[i % colors.length],
        [Math.cos(a) * r, y + random() * 0.15, Math.sin(a) * r],
        [
          size * (0.5 + random()),
          size * (0.45 + random() * 0.5),
          size * (0.5 + random()),
        ],
      );
      m.rotation.set(random(), random() * 6, random() * 0.7);
    }
  };
  const leaf = (
    parent: T.Group,
    x: number,
    y: number,
    z: number,
    rotation: number,
    size = 1,
  ) => {
    const m = mesh(
      parent,
      sphere,
      "#3b6f2b",
      [x, y, z],
      [0.16 * size, 0.035 * size, 0.43 * size],
    );
    m.rotation.set(0.2, rotation, 0.15);
    return m;
  };
  const lime = (parent: T.Group, x: number, z: number) => {
    const g = new T.Group();
    g.position.set(x, 0.48, z);
    g.rotation.z = 0.22;
    parent.add(g);
    mesh(g, cylinder(0.38, 0.34, 0.12), "#56802c", [0, 0, 0]);
    mesh(g, cylinder(0.32, 0.32, 0.014), "#dedb84", [0, 0.07, 0]);
    for (let i = 0; i < 8; i++) {
      const wedge = mesh(
        g,
        new T.CylinderGeometry(
          0.29,
          0.29,
          0.018,
          12,
          1,
          false,
          (i * Math.PI) / 4,
          0.69,
        ),
        "#bad461",
        [0, 0.084, 0],
      );
      wedge.receiveShadow = false;
    }
  };
  for (let index = 0; index < 3; index++) {
    const dish = new T.Group();
    dish.position.x = index * 10;
    world.add(dish);
    const cloth = mesh(
      dish,
      cube,
      index === 2 ? "#e7cfd1" : "#ede1bd",
      [1.35, -0.09, 0.65],
      [4.1, 0.04, 4.7],
    );
    cloth.rotation.y = -0.28;
    for (let j = 0; j < 11; j++) {
      const stripe = mesh(
        dish,
        cube,
        "#d3c39b",
        [0, 0, 0],
        [4.1, 0.005, 0.016],
      );
      stripe.position.set(0, 0.55, (j - 5) * 0.075);
      cloth.add(stripe);
      stripe.scale.set(1, 0.1, 0.004);
    }
    // A spoon catches the key light and gives the food a familiar sense of scale.
    const spoon = new T.Group();
    spoon.position.set(2.75, 0.12, 0.3);
    spoon.rotation.y = -0.18;
    dish.add(spoon);
    mesh(
      spoon,
      sphere,
      "#b4aca0",
      [0, 0.02, -0.7],
      [0.26, 0.07, 0.4],
      0.22,
      0.85,
    );
    mesh(
      spoon,
      cylinder(0.065, 0.09, 1.5),
      "#b4aca0",
      [0, 0.02, 0.35],
      [1, 1, 1],
      0.23,
      0.85,
    ).rotation.x = Math.PI / 2;
    if (index === 0) {
      mesh(
        dish,
        cylinder(2.35, 2.35, 0.18),
        "#745031",
        [0, 0.02, 0],
        [1.15, 1, 0.88],
      );
      mesh(
        dish,
        cylinder(2.05, 1.95, 0.2),
        "#262923",
        [0, 0.23, 0],
        [1.13, 1, 0.88],
        0.42,
        0.5,
      );
      const rim = ring(dish, 2.01, 0.1, 0.35, "#363b31");
      rim.scale.set(1.13, 0.88, 1);
      for (const x of [-2.5, 2.5]) {
        const handle = mesh(
          dish,
          new T.TorusGeometry(0.3, 0.095, 10, 24),
          "#272c26",
          [x, 0.28, 0],
          [1, 0.7, 1],
        );
        handle.rotation.x = Math.PI / 2;
      }
      const food = new T.Group();
      food.scale.set(1.12, 1, 0.86);
      dish.add(food);
      scatter(
        food,
        310,
        1.88,
        0.4,
        ["#86401e", "#aa6630", "#c28645", "#dfa25a", "#713918"],
        0.2,
      );
      scatter(food, 60, 1.7, 0.61, ["#eeceb0", "#c29297", "#f2dfbf"], 0.09);
      for (let i = 0; i < 58; i++) {
        const a = random() * 6.28,
          r = Math.sqrt(random()) * 1.8;
        const onion = mesh(
          food,
          new T.TorusGeometry(0.05, 0.019, 6, 9),
          i % 3 ? "#629036" : "#c8d994",
          [Math.cos(a) * r, 0.69, Math.sin(a) * r],
        );
        onion.rotation.x = Math.PI / 2 + random() * 0.4;
      }
      for (let i = 0; i < 7; i++) {
        const chili = mesh(
          food,
          sphere,
          "#af341d",
          [(random() - 0.5) * 2.7, 0.7, (random() - 0.5) * 2.7],
          [0.065, 0.06, 0.24],
        );
        chili.rotation.y = random() * 6;
      }
      lime(dish, -1.6, -0.85);
      lime(dish, -2.65, 1.4);
      leaf(dish, 1.1, 0.77, 0.4, 1);
      leaf(dish, 1.23, 0.79, 0.49, 2);
    } else if (index === 1) {
      const points = [
        [0, 0],
        [1.35, 0],
        [1.65, 0.18],
        [1.9, 0.6],
        [2.02, 0.98],
        [1.95, 1.03],
        [1.83, 0.64],
        [1.6, 0.3],
        [0, 0.26],
      ].map(([x, y]) => new T.Vector2(x, y));
      mesh(
        dish,
        new T.LatheGeometry(points, 80),
        "#f6efd8",
        [0, 0.04, 0],
        [1, 1, 1],
        0.27,
      );
      ring(dish, 1.98, 0.045, 1.04, "#e4cba3");
      mesh(
        dish,
        cylinder(1.84, 1.84, 0.025),
        "#965627",
        [0, 0.77, 0],
        [1, 1, 1],
        0.18,
      );
      for (let i = 0; i < 7; i++) {
        const angle = i * 1.3;
        const beef = mesh(
          dish,
          cube,
          i % 2 ? "#74422b" : "#9b6544",
          [Math.cos(angle) * 1.05, 0.86, Math.sin(angle) * 1.1],
          [0.52, 0.26, 0.45],
        );
        beef.rotation.y = angle;
        const melon = mesh(
          dish,
          cube,
          "#dd6359",
          [Math.sin(angle) * 1.15, 0.94, Math.cos(angle) * 1.12],
          [0.38, 0.25, 0.34],
        );
        melon.rotation.y = angle + 0.8;
        leaf(
          dish,
          Math.cos(angle) * 1.3,
          1.08,
          Math.sin(angle) * 1.3,
          angle,
          1.3,
        );
        const bean = mesh(dish, cylinder(0.045, 0.045, 0.65), "#709343", [
          Math.cos(angle) * 0.6,
          1,
          Math.sin(angle) * 0.65,
        ]);
        bean.rotation.z = 1.2;
        bean.rotation.y = angle;
      }
      lime(dish, -2.5, 1.2);
    } else {
      mesh(
        dish,
        cylinder(2.2, 1.8, 0.12),
        "#f5edd7",
        [0, 0.1, 0],
        [1, 1, 1],
        0.22,
      );
      ring(dish, 2.1, 0.035, 0.19, "#c8b27e");
      mesh(dish, cylinder(1.28, 1.3, 0.3), "#624033", [0, 0.32, 0]);
      mesh(dish, cylinder(1.26, 1.26, 0.65), "#8c64a0", [0, 0.79, 0]);
      mesh(
        dish,
        cylinder(1.28, 1.28, 0.08),
        "#b197c9",
        [0, 1.15, 0],
        [1, 1, 1],
        0.33,
      );
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        mesh(
          dish,
          sphere,
          "#f5e6d0",
          [Math.cos(a) * 0.79, 1.32, Math.sin(a) * 0.79],
          [0.27, 0.22, 0.27],
        );
      }
      mesh(dish, sphere, "#9a73b2", [0, 1.49, 0], [0.53, 0.5, 0.53]);
      scatter(dish, 55, 1.05, 1.25, ["#bc8650", "#e6c28b", "#d1a267"], 0.07);
      leaf(dish, 0.45, 1.86, 0, 1, 0.8);
      leaf(dish, 0.53, 1.89, 0.13, 2.3, 0.8);
    }
  }
  return world;
}
