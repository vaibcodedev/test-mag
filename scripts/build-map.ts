/**
 * Будує схему району навколо шоуруму зі справжніх даних OpenStreetMap.
 *
 *   npm run map                 — координати й вулиця з app/lib/content/site.ts
 *   npm run map -- 49.23 28.46  — інші координати (після переїзду чи для перевірки)
 *   npm run map -- --from=osm.json — зібрати з уже збереженої відповіді Overpass
 *   npm run map -- --save=osm.json — заодно зберегти відповідь, щоб не питати сервер удруге
 *
 * Скрипт один раз питає Overpass API про вулиці, воду й парки довкола точки, проєктує їх
 * на полотно 600 × 480 і записує готові SVG-шляхи в
 * app/components/home/showroom-map/showroom-map.data.ts. Сайт під час роботи нікуди
 * не звертається: карта — це статичний малюнок у кольорах теми.
 * Дані © учасники OpenStreetMap (ODbL): підпис на карті обов'язковий.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { STORE_INFO } from "../app/lib/content/site.ts";

const VIEW = { width: 600, height: 480 };
/** Ширина ділянки в метрах; висота випливає з пропорції полотна. */
const SPAN_METERS = 1500;
/** Шоурум стоїть трохи нижче центру: над позначкою є місце для картки з логотипом. */
const ANCHOR = { x: 0.5, y: 0.56 };
/** Запас за межами полотна: контейнер на сайті обрізає схему, а лінії мають доходити до краю. */
const MARGIN = 60;
const OUTPUT = "app/components/home/showroom-map/showroom-map.data.ts";
const OVERPASS_HOSTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

type Point = { lat: number; lon: number };
type Tags = Record<string, string | undefined>;
type Member = { type: string; role: string; geometry?: Point[] };
type Element = {
  type: "way" | "relation";
  tags?: Tags;
  geometry?: Point[];
  members?: Member[];
};
type XY = [x: number, y: number];

const args = process.argv.slice(2);
const option = (name: string) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const numbers = args.filter((arg) => !arg.startsWith("--"));
const latitude = Number(numbers[0] ?? STORE_INFO.latitude);
const longitude = Number(numbers[1] ?? STORE_INFO.longitude);
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  throw new Error("Координати мають бути числами: npm run map -- 49.2331 28.4682");
}

/* ── Проєкція ─────────────────────────────────────────────────────────── */

const METERS_PER_DEGREE = 111_320;
const metersPerUnit = SPAN_METERS / VIEW.width;
const lonScale = Math.cos((latitude * Math.PI) / 180) * METERS_PER_DEGREE;

function project(point: Point): XY {
  const east = (point.lon - longitude) * lonScale;
  const north = (point.lat - latitude) * METERS_PER_DEGREE;
  return [
    VIEW.width * ANCHOR.x + east / metersPerUnit,
    VIEW.height * ANCHOR.y - north / metersPerUnit,
  ];
}

function unproject([x, y]: XY): Point {
  return {
    lon: longitude + ((x - VIEW.width * ANCHOR.x) * metersPerUnit) / lonScale,
    lat: latitude - ((y - VIEW.height * ANCHOR.y) * metersPerUnit) / METERS_PER_DEGREE,
  };
}

const northWest = unproject([-MARGIN, -MARGIN]);
const southEast = unproject([VIEW.width + MARGIN, VIEW.height + MARGIN]);
const bounds = {
  north: unproject([0, 0]).lat,
  south: unproject([0, VIEW.height]).lat,
  west: unproject([0, 0]).lon,
  east: unproject([VIEW.width, 0]).lon,
};

/* ── Дані ─────────────────────────────────────────────────────────────── */

async function loadElements(): Promise<Element[]> {
  const saved = option("from");
  if (saved) return (JSON.parse(readFileSync(saved, "utf8")) as { elements: Element[] }).elements;

  const box = [southEast.lat, northWest.lon, northWest.lat, southEast.lon]
    .map((value) => value.toFixed(5))
    .join(",");
  const query = `[out:json][timeout:40];
(
  way["highway"~"^(trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"](${box});
  way["natural"="water"](${box});
  relation["natural"="water"](${box});
  way["waterway"="river"](${box});
  way["leisure"~"^(park|garden)$"](${box});
  relation["leisure"="park"](${box});
);
out geom;`;

  // Публічні сервери Overpass часто перевантажені: обходимо їх двічі.
  for (const host of [...OVERPASS_HOSTS, ...OVERPASS_HOSTS]) {
    try {
      const response = await fetch(host, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "storefront-map-build",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const data = JSON.parse(text) as { elements: Element[] };
      const target = option("save");
      if (target) writeFileSync(target, text);
      return data.elements;
    } catch (error) {
      console.warn(`${host}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error("Overpass API не відповів на жодному сервері. Спробуйте пізніше.");
}

/* ── Геометрія ────────────────────────────────────────────────────────── */

const inView = ([x, y]: XY) =>
  x >= -MARGIN && x <= VIEW.width + MARGIN && y >= -MARGIN && y <= VIEW.height + MARGIN;
const onCanvas = ([x, y]: XY) => x >= 0 && x <= VIEW.width && y >= 0 && y <= VIEW.height;
/** Середина полотна, яку видно за будь-якої пропорції контейнера: тут стоять підписи. */
const SAFE = { x: 0.2, y: 0.1 };
const inSafeArea = ([x, y]: XY) =>
  x >= VIEW.width * SAFE.x &&
  x <= VIEW.width * (1 - SAFE.x) &&
  y >= VIEW.height * SAFE.y &&
  y <= VIEW.height * (1 - SAFE.y);

/** Спрощення Дугласа — Пекера: прибирає точки, що відхиляються менш ніж на tolerance. */
function simplify(points: XY[], tolerance: number): XY[] {
  if (points.length < 3) return points;
  const first = points[0] as XY;
  const last = points[points.length - 1] as XY;
  let index = 0;
  let distance = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i] as XY;
    const dx = last[0] - first[0];
    const dy = last[1] - first[1];
    const length = Math.hypot(dx, dy);
    // У замкненого кільця перша й остання точки збігаються: міряємо відстань до самої точки.
    const offset =
      length === 0
        ? Math.hypot(x - first[0], y - first[1])
        : Math.abs(dy * x - dx * y + last[0] * first[1] - last[1] * first[0]) / length;
    if (offset > distance) {
      distance = offset;
      index = i;
    }
  }
  if (distance <= tolerance) return [first, last];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

/** Лінія → шматки, що проходять полотном (з запасом). */
function clipLine(points: XY[]): XY[][] {
  const parts: XY[][] = [];
  let current: XY[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i] as XY;
    const next = points[i + 1];
    const previous = points[i - 1];
    const keep = inView(point) || (next && inView(next)) || (previous && inView(previous));
    if (keep) current.push(point);
    else if (current.length > 1) {
      parts.push(current);
      current = [];
    } else current = [];
  }
  if (current.length > 1) parts.push(current);
  return parts;
}

const round = (value: number) => Math.round(value * 10) / 10;

function linePath(points: XY[]): string {
  return simplify(points, 0.5)
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${round(x)} ${round(y)}`)
    .join("");
}

/** Багатокутник: далекі точки притискаються до рамки, щоб шлях не тягнувся на кілометри. */
function polygonPath(points: XY[]): string {
  const limit = 400;
  const clamped = points.map(([x, y]): XY => [
    Math.min(VIEW.width + limit, Math.max(-limit, x)),
    Math.min(VIEW.height + limit, Math.max(-limit, y)),
  ]);
  return `${linePath(clamped)}Z`;
}

/** Зшиває зовнішні лінії мультиполігона в замкнені кільця. */
function stitchRings(lines: Point[][]): Point[][] {
  const key = (point: Point) => `${point.lat.toFixed(7)},${point.lon.toFixed(7)}`;
  const pool = lines.map((line) => [...line]);
  const rings: Point[][] = [];

  while (pool.length > 0) {
    const ring = pool.shift() as Point[];
    let grown = true;
    while (grown && key(ring[0] as Point) !== key(ring[ring.length - 1] as Point)) {
      grown = false;
      const tail = key(ring[ring.length - 1] as Point);
      for (let i = 0; i < pool.length; i += 1) {
        const candidate = pool[i] as Point[];
        if (key(candidate[0] as Point) === tail) {
          ring.push(...candidate.slice(1));
        } else if (key(candidate[candidate.length - 1] as Point) === tail) {
          ring.push(...candidate.reverse().slice(1));
        } else continue;
        pool.splice(i, 1);
        grown = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

/* ── Підписи ──────────────────────────────────────────────────────────── */

type Label = { text: string; x: number; y: number; angle: number };

/** «Соборна вулиця», «вулиця Миколи Оводова» → «вул. Соборна», «вул. Миколи Оводова». */
function shortStreetName(name: string): string {
  const core = name.replace(/\s*вулиця\s*/i, " ").trim();
  return core === name.trim() ? core : `вул. ${core}`;
}

/** Підпис вулиці піднятий над її лінією на стільки одиниць полотна. */
const LABEL_OFFSET = 18;

/**
 * З'єднує шматки однієї вулиці, що стикуються кінцями: в OSM вулиця порізана на квартали,
 * а підпису потрібна довга рівна ділянка.
 */
function joinLines(lines: XY[][]): XY[][] {
  const same = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;
  const pool = lines.map((line) => [...line]);
  const joined: XY[][] = [];

  while (pool.length > 0) {
    let line = pool.shift() as XY[];
    let grown = true;
    while (grown) {
      grown = false;
      for (let index = 0; index < pool.length; index += 1) {
        const other = pool[index] as XY[];
        const head = line[0] as XY;
        const tail = line[line.length - 1] as XY;
        const otherHead = other[0] as XY;
        const otherTail = other[other.length - 1] as XY;
        if (same(tail, otherHead)) line = [...line, ...other.slice(1)];
        else if (same(tail, otherTail)) line = [...line, ...other.reverse().slice(1)];
        else if (same(head, otherTail)) line = [...other, ...line.slice(1)];
        else if (same(head, otherHead)) line = [...other.reverse(), ...line.slice(1)];
        else continue;
        pool.splice(index, 1);
        grown = true;
        break;
      }
    }
    joined.push(line);
  }
  return joined;
}

/** Крок, з яким уздовж вулиці шукаємо місце для підпису. */
const LABEL_STEP = 15;

/**
 * Місця для підпису вздовж вулиці: точки на спрямленій лінії з кутом її нахилу, в середині
 * полотна й не під карткою шоуруму. `length` — довжина вулиці на полотні: за нею
 * вибираємо, які вулиці підписати.
 */
function labelSpots(lines: XY[][]): { length: number; spots: Omit<Label, "text">[] } {
  const spots: Omit<Label, "text">[] = [];
  let total = 0;
  for (const raw of joinLines(lines)) {
    // Для підпису беремо спрямлену лінію: дрібні вигини вулиці кут не визначають.
    const line = simplify(raw, 5);
    for (let i = 0; i < line.length - 1; i += 1) {
      const start = line[i] as XY;
      const end = line[i + 1] as XY;
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      if (onCanvas(start) && onCanvas(end)) total += length;
      // Короткий відрізок — це поворот: підпис на ньому стояв би під дивним кутом.
      if (length < 60) continue;
      let angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      const radians = (angle * Math.PI) / 180;
      // Підпис не ближче ніж за півдовжини тексту від кінців відрізка.
      for (let offset = 35; offset <= length - 35; offset += LABEL_STEP) {
        const x = start[0] + ((end[0] - start[0]) * offset) / length;
        const y = start[1] + ((end[1] - start[1]) * offset) / length;
        if (!inSafeArea([x, y]) || !clearOfMarker(x, y)) continue;
        spots.push({
          x: round(x + Math.sin(radians) * LABEL_OFFSET),
          y: round(y - Math.cos(radians) * LABEL_OFFSET),
          angle: round(angle),
        });
      }
    }
  }
  return { length: total, spots };
}

function centroid(points: XY[]): XY {
  const visible = points.filter(inSafeArea);
  const source = visible.length > 0 ? visible : points;
  const sum = source.reduce(([x, y], [px, py]) => [x + px, y + py] as XY, [0, 0] as XY);
  return [round(sum[0] / source.length), round(sum[1] / source.length)];
}

/* ── Збирання ─────────────────────────────────────────────────────────── */

const MAJOR = new Set(["trunk", "primary", "secondary"]);
/** Слово з адреси, за яким упізнаємо вулицю шоуруму: «вул. Соборна, 64» → «Соборна». */
const homeStreet = STORE_INFO.street
  .replace(/^(вул\.|вулиця|просп\.|проспект|пл\.|площа)\s*/i, "")
  .replace(/,.*$/, "")
  .trim();

const elements = await loadElements();

const roads = { home: [] as string[], major: [] as string[], minor: [] as string[] };
const streetLines = new Map<string, { lines: XY[][]; home: boolean; major: boolean }>();
const water: string[] = [];
const parks: string[] = [];
const labels: Label[] = [];
const riverPoints: XY[] = [];
let riverName = "";

for (const element of elements) {
  const tags = element.tags ?? {};

  if (element.type === "way" && tags.highway && element.geometry) {
    const lines = clipLine(element.geometry.map(project));
    if (lines.length === 0) continue;
    const name = tags.name ?? "";
    const home = homeStreet !== "" && name.includes(homeStreet);
    const major = MAJOR.has(tags.highway);
    const target = home ? roads.home : major ? roads.major : roads.minor;
    target.push(...lines.map(linePath));
    if (name) {
      const labelled = major || tags.highway === "tertiary";
      const entry = streetLines.get(name) ?? { lines: [], home, major: labelled };
      entry.lines.push(...lines);
      streetLines.set(name, entry);
    }
    continue;
  }

  if (tags.waterway === "river" && element.geometry) {
    riverName ||= tags.name ?? "";
    riverPoints.push(...element.geometry.map(project).filter(inSafeArea));
    continue;
  }

  const rings =
    element.type === "relation"
      ? stitchRings(
          (element.members ?? [])
            .filter((member) => member.role !== "inner" && member.geometry)
            .map((member) => member.geometry as Point[]),
        )
      : element.geometry
        ? [element.geometry]
        : [];

  for (const ring of rings) {
    const points = ring.map(project);
    if (!points.some(inView)) continue;
    if (tags.natural === "water") water.push(polygonPath(points));
    else if (tags.leisure) {
      parks.push(polygonPath(points));
      if (tags.name && points.some(inSafeArea)) {
        const [x, y] = centroid(points);
        labels.push({ text: tags.name.replace(/\s+ім\.?\s.*$/, ""), x, y, angle: 0 });
      }
    }
  }
}

/** Картка з логотипом над позначкою: під нею підписів не ставимо. */
const marker: XY = [VIEW.width * ANCHOR.x, VIEW.height * ANCHOR.y];
const clearOfMarker = (x: number, y: number) =>
  Math.abs(x - marker[0]) > 95 || y > marker[1] + 12 || y < marker[1] - 110;

// Підписи вулиць: вулиця шоуруму й кілька найдовших головних, без накладання.
const far = (x: number, y: number) =>
  labels.every((label) => Math.hypot(label.x - x, label.y - y) > 80);

const streets = [...streetLines.entries()]
  .filter(([, entry]) => entry.home || entry.major)
  .map(([name, entry]) => ({ name, home: entry.home, ...labelSpots(entry.lines) }))
  .sort((a, b) => Number(b.home) - Number(a.home) || b.length - a.length);

let streetCount = 0;
for (const street of streets) {
  if (streetCount >= 5) break;
  // Найближче до шоуруму вільне місце: підпис має бути поруч із тим, на що дивляться.
  const spot = street.spots
    .filter((candidate) => far(candidate.x, candidate.y))
    .sort(
      (a, b) =>
        Math.hypot(a.x - marker[0], a.y - marker[1]) - Math.hypot(b.x - marker[0], b.y - marker[1]),
    )[0];
  if (!spot) continue;
  labels.push({ text: shortStreetName(street.name), ...spot });
  streetCount += 1;
}

if (riverName && riverPoints.length > 0) {
  const [x, y] = riverPoints[Math.floor(riverPoints.length / 2)] as XY;
  if (far(x, y)) labels.push({ text: riverName, x: round(x), y: round(y), angle: 0 });
}

const content = `/**
 * Згенеровано скриптом scripts/build-map.ts (npm run map) — руками не редагувати.
 * Дані © учасники OpenStreetMap, ліцензія ODbL: https://www.openstreetmap.org/copyright
 */

export type ShowroomMapLabel = { text: string; x: number; y: number; angle: number };

export const SHOWROOM_MAP = {
  /** Точка, довкола якої збудовано схему. */
  center: { latitude: ${latitude}, longitude: ${longitude} },
  view: { width: ${VIEW.width}, height: ${VIEW.height} },
  bounds: ${JSON.stringify(
    Object.fromEntries(
      Object.entries(bounds).map(([key, value]) => [key, Number(value.toFixed(6))]),
    ),
  )},
  water: ${JSON.stringify(water.join(""))},
  parks: ${JSON.stringify(parks.join(""))},
  minorRoads: ${JSON.stringify(roads.minor.join(""))},
  majorRoads: ${JSON.stringify(roads.major.join(""))},
  /** Вулиця, на якій стоїть шоурум. */
  homeStreet: ${JSON.stringify(roads.home.join(""))},
  labels: ${JSON.stringify(labels)} as ShowroomMapLabel[],
} as const;
`;

writeFileSync(OUTPUT, content);
console.log(
  `Схему записано в ${OUTPUT}: вулиць ${roads.minor.length + roads.major.length + roads.home.length}, ` +
    `води ${water.length}, парків ${parks.length}, підписів ${labels.length}, ` +
    `${Math.round(content.length / 1024)} КБ.`,
);
