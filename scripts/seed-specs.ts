/**
 * Технічні характеристики для порівняння: значення метаполя `custom.specs` кожного пристрою.
 *
 * Ключі — рядки схеми app/lib/compare/spec-schema.ts для категорії товару, значення — готовий
 * до показу текст. Однакові факти записані однаковими рядками (через константи нижче), щоб
 * фільтр «лише відмінності» ховав рядки, де моделі справді не відрізняються.
 *
 * Джерело — сторінки Tech Specs на support.apple.com (листопад 2026). Чого там немає або що
 * залежить від невідомої комплектації, того тут немає: порожній рядок сайт показує як «—».
 * - Пам'ять і конфігурації — лише ті, що продає магазин (опції товару в seed-catalog.ts).
 * - iPhone 17 Pro і 17 Pro Max: вага й час роботи для моделей із лотком nano-SIM, які
 *   продаються в Європі (модель лише з eSIM для США важча й працює на дві години довше).
 * - Apple Watch з алюмінію: вага моделей GPS.
 * - Аксесуари характеристик не мають.
 */

export type Specs = Record<string, string>;

/* ------------------------------------------------------------------ */
/* iPhone                                                              */
/* ------------------------------------------------------------------ */

const OLED = "Super Retina XDR (OLED)";
const OLED_120 = "Super Retina XDR (OLED), ProMotion до 120 Гц";

const NITS_3000 = "1000 ніт, пік 1600 ніт HDR, 3000 ніт надворі";
const NITS_2000 = "1000 ніт, пік 1600 ніт HDR, 2000 ніт надворі";
const NITS_1200 = "800 ніт, пік 1200 ніт HDR";

const VIDEO_120_PRORES = "4K Dolby Vision до 120 кадр/с, ProRes";
const VIDEO_60_PRORES = "4K Dolby Vision до 60 кадр/с, ProRes";
const VIDEO_60 = "4K Dolby Vision до 60 кадр/с";

const CHARGE_40W_MAGSAFE_25 = "50% за 20 хв (від 40 Вт), MagSafe до 25 Вт";
const CHARGE_20W_MAGSAFE_25 = "50% за 30 хв (від 20 Вт), MagSafe до 25 Вт";
const CHARGE_20W_MAGSAFE_15 = "50% за 30 хв (від 20 Вт), MagSafe до 15 Вт";

const ALUMINIUM_GLASS = "Алюміній, Ceramic Shield, скло ззаду";
const TITANIUM_GLASS = "Титан, Ceramic Shield, матове скло ззаду";
const STEEL_GLASS = "Нержавіюча сталь, Ceramic Shield, матове скло ззаду";

const IP68 = "IP68 (до 6 м, до 30 хв)";
const DUAL_SIM = "nano-SIM і eSIM";
const NONE = "Немає";

const USB_C_3 = "USB-C (USB 3, до 10 Гбіт/с)";
const USB_C_2 = "USB-C (USB 2, до 480 Мбіт/с)";

const FRONT_18 = "18 Мп Center Stage, f/1,9";
const FRONT_12 = "12 Мп, f/1,9";
const FRONT_12_OLD = "12 Мп, f/2,2";

const video = (hours: number) => `До ${hours} год відтворення відео`;

const IPHONE: Record<string, Specs> = {
  "iphone-17-pro-max": {
    display_size: "6,9″",
    display_type: OLED_120,
    display_resolution: "2868 × 1320, 460 ppi",
    display_brightness: NITS_3000,
    chip: "A19 Pro",
    storage: "256 ГБ, 512 ГБ, 1 ТБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "48 Мп, f/2,2, 120°",
    camera_tele: "48 Мп, 4x, f/2,8",
    camera_front: FRONT_18,
    video: VIDEO_120_PRORES,
    battery: video(37),
    charging: CHARGE_40W_MAGSAFE_25,
    material: "Алюміній, Ceramic Shield 2, Ceramic Shield ззаду",
    water: IP68,
    dimensions: "163,4 × 78,0 × 8,75 мм",
    weight: "231 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 6, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "iphone-17-pro": {
    display_size: "6,3″",
    display_type: OLED_120,
    display_resolution: "2622 × 1206, 460 ppi",
    display_brightness: NITS_3000,
    chip: "A19 Pro",
    storage: "256 ГБ, 512 ГБ, 1 ТБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "48 Мп, f/2,2, 120°",
    camera_tele: "48 Мп, 4x, f/2,8",
    camera_front: FRONT_18,
    video: VIDEO_120_PRORES,
    battery: video(31),
    charging: CHARGE_40W_MAGSAFE_25,
    material: "Алюміній, Ceramic Shield 2, Ceramic Shield ззаду",
    water: IP68,
    dimensions: "150,0 × 71,9 × 8,75 мм",
    weight: "204 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 6, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "iphone-air": {
    display_size: "6,5″",
    display_type: OLED_120,
    display_resolution: "2736 × 1260, 460 ppi",
    display_brightness: NITS_3000,
    chip: "A19 Pro",
    storage: "256 ГБ, 512 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: NONE,
    camera_tele: NONE,
    camera_front: FRONT_18,
    video: VIDEO_60,
    battery: video(27),
    charging: "50% за 30 хв (від 20 Вт), MagSafe до 20 Вт",
    material: "Титан, Ceramic Shield 2, Ceramic Shield ззаду",
    water: IP68,
    dimensions: "156,2 × 74,7 × 5,64 мм",
    weight: "165 г",
    sim: "Лише eSIM",
    wireless: "5G, Wi-Fi 7, Bluetooth 6, NFC, UWB, Thread",
    port: USB_C_2,
  },
  "iphone-17": {
    display_size: "6,3″",
    display_type: OLED_120,
    display_resolution: "2622 × 1206, 460 ppi",
    display_brightness: NITS_3000,
    chip: "A19",
    storage: "256 ГБ, 512 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: "48 Мп, f/2,2, 120°",
    camera_tele: NONE,
    camera_front: FRONT_18,
    video: VIDEO_60,
    battery: video(30),
    charging: CHARGE_40W_MAGSAFE_25,
    material: "Алюміній, Ceramic Shield 2, скло ззаду",
    water: IP68,
    dimensions: "149,6 × 71,5 × 7,95 мм",
    weight: "177 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 6, NFC, UWB, Thread",
    port: USB_C_2,
  },
  "iphone-16-pro-max": {
    display_size: "6,9″",
    display_type: OLED_120,
    display_resolution: "2868 × 1320, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A18 Pro",
    storage: "256 ГБ, 512 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "48 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 5x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_120_PRORES,
    battery: video(33),
    charging: CHARGE_20W_MAGSAFE_25,
    material: TITANIUM_GLASS,
    water: IP68,
    dimensions: "163 × 77,6 × 8,25 мм",
    weight: "227 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "iphone-16-pro": {
    display_size: "6,3″",
    display_type: OLED_120,
    display_resolution: "2622 × 1206, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A18 Pro",
    storage: "128 ГБ, 256 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "48 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 5x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_120_PRORES,
    battery: video(27),
    charging: CHARGE_20W_MAGSAFE_25,
    material: TITANIUM_GLASS,
    water: IP68,
    dimensions: "149,6 × 71,5 × 8,25 мм",
    weight: "199 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "iphone-16-plus": {
    display_size: "6,7″",
    display_type: OLED,
    display_resolution: "2796 × 1290, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A18",
    storage: "128 ГБ, 256 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(27),
    charging: CHARGE_20W_MAGSAFE_25,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "160,9 × 77,8 × 7,80 мм",
    weight: "199 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_2,
  },
  "iphone-16": {
    display_size: "6,1″",
    display_type: OLED,
    display_resolution: "2556 × 1179, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A18",
    storage: "128 ГБ, 256 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(22),
    charging: CHARGE_20W_MAGSAFE_25,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "147,6 × 71,6 × 7,80 мм",
    weight: "170 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_2,
  },
  "iphone-16e": {
    display_size: "6,1″",
    display_type: OLED,
    display_resolution: "2532 × 1170, 460 ppi",
    display_brightness: NITS_1200,
    chip: "A18",
    storage: "128 ГБ, 256 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: NONE,
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(26),
    charging: "50% за 30 хв (від 20 Вт), бездротове Qi",
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "146,7 × 71,5 × 7,80 мм",
    weight: "167 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC",
    port: USB_C_2,
  },
  "iphone-15-plus": {
    display_size: "6,7″",
    display_type: OLED,
    display_resolution: "2796 × 1290, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A16 Bionic",
    storage: "128 ГБ, 256 ГБ",
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,4, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(26),
    charging: CHARGE_20W_MAGSAFE_15,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "160,9 × 77,8 × 7,80 мм",
    weight: "201 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC, UWB",
    port: USB_C_2,
  },
  "iphone-15": iphone15("128 ГБ, 256 ГБ"),
  "iphone-14": iphone14(),
  "used-iphone-15-pro-max-256": {
    display_size: "6,7″",
    display_type: OLED_120,
    display_resolution: "2796 × 1290, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A17 Pro",
    storage: "256 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 5x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_60_PRORES,
    battery: video(29),
    charging: CHARGE_20W_MAGSAFE_15,
    material: TITANIUM_GLASS,
    water: IP68,
    dimensions: "159,9 × 76,7 × 8,25 мм",
    weight: "221 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "used-iphone-15-pro-256": {
    display_size: "6,1″",
    display_type: OLED_120,
    display_resolution: "2556 × 1179, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A17 Pro",
    storage: "256 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 3x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_60_PRORES,
    battery: video(23),
    charging: CHARGE_20W_MAGSAFE_15,
    material: TITANIUM_GLASS,
    water: IP68,
    dimensions: "146,6 × 70,6 × 8,25 мм",
    weight: "187 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB, Thread",
    port: USB_C_3,
  },
  "used-iphone-15-128": iphone15("128 ГБ"),
  "used-iphone-14-pro-max-256": {
    display_size: "6,7″",
    display_type: OLED_120,
    display_resolution: "2796 × 1290, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A16 Bionic",
    storage: "256 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 3x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_60_PRORES,
    battery: video(29),
    charging: "50% за 35 хв (від 20 Вт), MagSafe до 15 Вт",
    material: STEEL_GLASS,
    water: IP68,
    dimensions: "160,7 × 77,6 × 7,85 мм",
    weight: "240 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC, UWB",
    port: "Lightning",
  },
  "used-iphone-14-pro-128": {
    display_size: "6,1″",
    display_type: OLED_120,
    display_resolution: "2556 × 1179, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A16 Bionic",
    storage: "128 ГБ",
    camera_main: "48 Мп, f/1,78",
    camera_ultrawide: "12 Мп, f/2,2, 120°",
    camera_tele: "12 Мп, 3x, f/2,8",
    camera_front: FRONT_12,
    video: VIDEO_60_PRORES,
    battery: video(23),
    charging: CHARGE_20W_MAGSAFE_15,
    material: STEEL_GLASS,
    water: IP68,
    dimensions: "147,5 × 71,5 × 7,85 мм",
    weight: "206 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC, UWB",
    port: "Lightning",
  },
  "used-iphone-14-128": iphone14(),
  "used-iphone-13-pro-128": {
    display_size: "6,1″",
    display_type: OLED_120,
    display_resolution: "2532 × 1170, 460 ppi",
    display_brightness: "1000 ніт, пік 1200 ніт HDR",
    chip: "A15 Bionic",
    storage: "128 ГБ",
    camera_main: "12 Мп, f/1,5",
    camera_ultrawide: "12 Мп, f/1,8, 120°",
    camera_tele: "12 Мп, 3x, f/2,8",
    camera_front: FRONT_12_OLD,
    video: VIDEO_60_PRORES,
    battery: video(22),
    charging: CHARGE_20W_MAGSAFE_15,
    material: STEEL_GLASS,
    water: IP68,
    dimensions: "146,7 × 71,5 × 7,65 мм",
    weight: "204 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.0, NFC, UWB",
    port: "Lightning",
  },
  "used-iphone-13-128": {
    display_size: "6,1″",
    display_type: OLED,
    display_resolution: "2532 × 1170, 460 ppi",
    display_brightness: NITS_1200,
    chip: "A15 Bionic",
    storage: "128 ГБ",
    camera_main: "12 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,4, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12_OLD,
    video: VIDEO_60,
    battery: video(19),
    charging: CHARGE_20W_MAGSAFE_15,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "146,7 × 71,5 × 7,65 мм",
    weight: "174 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.0, NFC, UWB",
    port: "Lightning",
  },
  "used-iphone-13-mini-128": {
    display_size: "5,4″",
    display_type: OLED,
    display_resolution: "2340 × 1080, 476 ppi",
    display_brightness: NITS_1200,
    chip: "A15 Bionic",
    storage: "128 ГБ",
    camera_main: "12 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,4, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12_OLD,
    video: VIDEO_60,
    battery: video(17),
    charging: CHARGE_20W_MAGSAFE_15,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "131,5 × 64,2 × 7,65 мм",
    weight: "141 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.0, NFC, UWB",
    port: "Lightning",
  },
};

/** iPhone 15 продається і новим, і вживаним: відрізняється лише пам'ять. */
function iphone15(storage: string): Specs {
  return {
    display_size: "6,1″",
    display_type: OLED,
    display_resolution: "2556 × 1179, 460 ppi",
    display_brightness: NITS_2000,
    chip: "A16 Bionic",
    storage,
    camera_main: "48 Мп, f/1,6",
    camera_ultrawide: "12 Мп, f/2,4, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(20),
    charging: CHARGE_20W_MAGSAFE_15,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "147,6 × 71,6 × 7,80 мм",
    weight: "171 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC, UWB",
    port: USB_C_2,
  };
}

/** iPhone 14: новий і вживаний — та сама модель на 128 ГБ. */
function iphone14(): Specs {
  return {
    display_size: "6,1″",
    display_type: OLED,
    display_resolution: "2532 × 1170, 460 ppi",
    display_brightness: NITS_1200,
    chip: "A15 Bionic",
    storage: "128 ГБ",
    camera_main: "12 Мп, f/1,5",
    camera_ultrawide: "12 Мп, f/2,4, 120°",
    camera_tele: NONE,
    camera_front: FRONT_12,
    video: VIDEO_60,
    battery: video(20),
    charging: CHARGE_20W_MAGSAFE_15,
    material: ALUMINIUM_GLASS,
    water: IP68,
    dimensions: "146,7 × 71,5 × 7,80 мм",
    weight: "172 г",
    sim: DUAL_SIM,
    wireless: "5G, Wi-Fi 6, Bluetooth 5.3, NFC, UWB",
    port: "Lightning",
  };
}

/* ------------------------------------------------------------------ */
/* Mac                                                                 */
/* ------------------------------------------------------------------ */

const LIQUID_RETINA = "Liquid Retina (IPS)";
const LIQUID_RETINA_XDR = "Liquid Retina XDR, ProMotion до 120 Гц";
const NITS_XDR = "1000 ніт SDR, пік 1600 ніт HDR";

const CPU_8 = "8 ядер (4 продуктивних + 4 енергоефективних)";
const CPU_10 = "10 ядер (4 продуктивних + 6 енергоефективних)";
const CPU_12 = "12 ядер (8 продуктивних + 4 енергоефективних)";
const CPU_14 = "14 ядер (10 продуктивних + 4 енергоефективних)";

const STREAMING_18 = "До 18 год потокового відео";
const MOVIES_18 = "До 18 год відтворення відео";
const MAINS = "Живлення від мережі";

const FAST_CHARGE_70 = "MagSafe 3, швидке заряджання від 70 Вт";
const FAST_CHARGE_96 = "MagSafe 3, швидке заряджання від 96 Вт";
const FAST_CHARGE_140 = "MagSafe 3, швидке заряджання від 140 Вт";

const PORTS_AIR_TB4 = "2 × Thunderbolt 4 (USB-C), MagSafe 3, 3,5 мм";
const PORTS_AIR_TB3 = "2 × Thunderbolt 3 / USB 4 (USB-C), MagSafe 3, 3,5 мм";
const PORTS_PRO_TB4 = "3 × Thunderbolt 4, HDMI, SDXC, MagSafe 3, 3,5 мм";
const PORTS_PRO_TB5 = "3 × Thunderbolt 5, HDMI, SDXC, MagSafe 3, 3,5 мм";

const WIFI_6E = "Wi-Fi 6E, Bluetooth 5.3";

const TWO_6K = "До двох 6K, 60 Гц";
const TWO_6K_OR_8K = "До двох 6K, 60 Гц, або один 8K, 60 Гц";

const CAMERA_12_CENTER_STAGE = "12 Мп Center Stage, відео 1080p";
const CAMERA_1080P = "FaceTime HD 1080p";

const AUDIO_4 = "4 динаміки, 3 мікрофони, Spatial Audio";
const AUDIO_6 = "6 динаміків, 3 мікрофони, Spatial Audio";
const AUDIO_6_STUDIO = "6 динаміків, 3 студійні мікрофони, Spatial Audio";
const AUDIO_DESKTOP = "Вбудований динамік, вихід 3,5 мм";

const KEYBOARD_LAPTOP = "Magic Keyboard з підсвіткою і Touch ID";
const NO_DISPLAY = "Без вбудованого екрана";
const NO_KEYBOARD = "Немає в комплекті";

/** MacBook Air 13″ із чипами M2–M4: один корпус і один екран. */
const AIR_13 = {
  display_size: "13,6″",
  display_type: LIQUID_RETINA,
  display_resolution: "2560 × 1664, 224 ppi",
  display_brightness: "500 ніт",
  charging: FAST_CHARGE_70,
  audio: AUDIO_4,
  keyboard: KEYBOARD_LAPTOP,
  dimensions: "1,13 × 30,41 × 21,5 см",
  weight: "1,24 кг",
};

const PRO_14 = {
  display_size: "14,2″",
  display_type: LIQUID_RETINA_XDR,
  display_resolution: "3024 × 1964, 254 ppi",
  display_brightness: NITS_XDR,
  storage: "512 ГБ, 1 ТБ",
  charging: FAST_CHARGE_96,
  wireless: WIFI_6E,
  external_displays: TWO_6K_OR_8K,
  camera_front: CAMERA_12_CENTER_STAGE,
  audio: AUDIO_6_STUDIO,
  keyboard: KEYBOARD_LAPTOP,
  dimensions: "1,55 × 31,26 × 22,12 см",
};

const PRO_16 = {
  display_size: "16,2″",
  display_type: LIQUID_RETINA_XDR,
  display_resolution: "3456 × 2234, 254 ppi",
  display_brightness: NITS_XDR,
  charging: FAST_CHARGE_140,
  ports: PORTS_PRO_TB5,
  wireless: WIFI_6E,
  camera_front: CAMERA_12_CENTER_STAGE,
  audio: AUDIO_6_STUDIO,
  keyboard: KEYBOARD_LAPTOP,
  dimensions: "1,68 × 35,57 × 24,81 см",
};

/** Комп'ютери без екрана: Mac mini та Mac Studio. */
const DESKTOP = {
  display_type: NO_DISPLAY,
  battery: MAINS,
  wireless: WIFI_6E,
  camera_front: NONE,
  audio: AUDIO_DESKTOP,
  keyboard: NO_KEYBOARD,
};

const MAC: Record<string, Specs> = {
  "macbook-air-13-m4": {
    ...AIR_13,
    chip: "M4",
    cpu: CPU_10,
    gpu: "8 або 10 ядер",
    ram: "16 або 24 ГБ",
    storage: "256 ГБ, 512 ГБ",
    battery: STREAMING_18,
    ports: PORTS_AIR_TB4,
    wireless: WIFI_6E,
    external_displays: TWO_6K,
    camera_front: CAMERA_12_CENTER_STAGE,
  },
  "macbook-air-15-m4": {
    display_size: "15,3″",
    display_type: LIQUID_RETINA,
    display_resolution: "2880 × 1864, 224 ppi",
    display_brightness: "500 ніт",
    chip: "M4",
    cpu: CPU_10,
    gpu: "10 ядер",
    ram: "16 або 24 ГБ",
    storage: "256 ГБ, 512 ГБ",
    battery: STREAMING_18,
    charging: FAST_CHARGE_70,
    ports: PORTS_AIR_TB4,
    wireless: WIFI_6E,
    external_displays: TWO_6K,
    camera_front: CAMERA_12_CENTER_STAGE,
    audio: AUDIO_6,
    keyboard: KEYBOARD_LAPTOP,
    dimensions: "1,15 × 34,04 × 23,76 см",
    weight: "1,51 кг",
  },
  "macbook-air-13-m3": {
    ...AIR_13,
    chip: "M3",
    cpu: CPU_8,
    gpu: "8 або 10 ядер",
    ram: "16 ГБ",
    storage: "256 ГБ, 512 ГБ",
    battery: MOVIES_18,
    ports: PORTS_AIR_TB3,
    wireless: WIFI_6E,
    external_displays: "Один 6K, 60 Гц; другий 5K із закритою кришкою",
    camera_front: CAMERA_1080P,
  },
  "macbook-pro-14-m5": {
    ...PRO_14,
    chip: "M5",
    cpu: "10 ядер (4 суперядра + 6 енергоефективних)",
    gpu: "10 ядер",
    ram: "16 або 24 ГБ",
    battery: "До 24 год потокового відео",
    ports: PORTS_PRO_TB4,
    weight: "1,55 кг",
  },
  "macbook-pro-14-m4-pro": {
    ...PRO_14,
    chip: "M4 Pro",
    cpu: "12 або 14 ядер",
    gpu: "16 або 20 ядер",
    ram: "24 ГБ",
    battery: "До 22 год потокового відео",
    ports: PORTS_PRO_TB5,
    weight: "1,60 кг",
  },
  "macbook-pro-16-m4-pro": {
    ...PRO_16,
    chip: "M4 Pro",
    cpu: CPU_14,
    gpu: "20 ядер",
    ram: "24 або 48 ГБ",
    storage: "512 ГБ",
    battery: "До 24 год потокового відео",
    external_displays: TWO_6K_OR_8K,
    weight: "2,14 кг",
  },
  "macbook-pro-16-m4-max": {
    ...PRO_16,
    chip: "M4 Max",
    cpu: "14 або 16 ядер",
    gpu: "32 або 40 ядер",
    ram: "36 або 48 ГБ",
    storage: "1 ТБ",
    battery: "До 21 год потокового відео",
    external_displays: "До чотирьох: три 6K, 60 Гц, і один 4K, 144 Гц",
    weight: "2,15 кг",
  },
  "imac-24-m4": {
    display_size: "24″",
    display_type: "Retina 4,5K",
    display_resolution: "4480 × 2520, 218 ppi",
    display_brightness: "500 ніт",
    chip: "M4",
    cpu: "8 або 10 ядер",
    gpu: "8 або 10 ядер",
    ram: "16 або 24 ГБ",
    storage: "256 ГБ, 512 ГБ",
    battery: MAINS,
    ports: "2 або 4 × Thunderbolt 4 (USB-C), 3,5 мм",
    wireless: WIFI_6E,
    external_displays: "Один 6K (2 порти) або до двох 6K (4 порти)",
    camera_front: CAMERA_12_CENTER_STAGE,
    audio: AUDIO_6_STUDIO,
    keyboard: "Magic Keyboard і Magic Mouse в комплекті",
    dimensions: "46,1 × 54,7 × 14,7 см",
    weight: "4,42–4,44 кг",
  },
  "mac-mini-m4": {
    ...DESKTOP,
    chip: "M4",
    cpu: CPU_10,
    gpu: "10 ядер",
    ram: "16 або 24 ГБ",
    storage: "256 ГБ, 512 ГБ",
    ports: "3 × Thunderbolt 4, 2 × USB-C, HDMI, Ethernet, 3,5 мм",
    external_displays: "До трьох: два 6K і один 5K, 60 Гц",
    dimensions: "5,0 × 12,7 × 12,7 см",
    weight: "0,67 кг",
  },
  "mac-mini-m4-pro": {
    ...DESKTOP,
    chip: "M4 Pro",
    cpu: CPU_12,
    gpu: "16 ядер",
    ram: "24 або 48 ГБ",
    storage: "512 ГБ, 1 ТБ",
    ports: "3 × Thunderbolt 5, 2 × USB-C, HDMI, Ethernet, 3,5 мм",
    external_displays: "До трьох 6K, 60 Гц",
    dimensions: "5,0 × 12,7 × 12,7 см",
    weight: "0,73 кг",
  },
  "mac-studio-m4-max": {
    ...DESKTOP,
    chip: "M4 Max",
    cpu: "14 або 16 ядер",
    gpu: "32 або 40 ядер",
    ram: "36 або 64 ГБ",
    storage: "512 ГБ, 1 ТБ",
    ports: "4 × Thunderbolt 5, 2 × USB-C, 2 × USB-A, HDMI, 10GbE, SDXC",
    external_displays: "До п'яти: чотири 6K, 60 Гц, і один 4K, 144 Гц",
    dimensions: "9,5 × 19,7 × 19,7 см",
    weight: "2,74 кг",
  },
  "used-macbook-air-13-m2": {
    ...AIR_13,
    chip: "M2",
    cpu: CPU_8,
    gpu: "8 ядер",
    ram: "8 ГБ",
    storage: "256 ГБ",
    battery: MOVIES_18,
    ports: PORTS_AIR_TB3,
    wireless: "Wi-Fi 6, Bluetooth 5.3",
    external_displays: "Один 6K, 60 Гц",
    camera_front: CAMERA_1080P,
  },
};

/* ------------------------------------------------------------------ */
/* iPad                                                                */
/* ------------------------------------------------------------------ */

const IPAD_OLED = "Ultra Retina XDR (Tandem OLED), ProMotion до 120 Гц";
const IPAD_BATTERY = "До 10 год вебсерфінгу або відео по Wi-Fi";
const IPAD_CAMERA = "12 Мп, f/1,8";
const IPAD_FRONT_LANDSCAPE = "12 Мп Center Stage, на довгому боці";
const IPAD_FRONT_PORTRAIT = "12 Мп Center Stage, на короткому боці";

const THUNDERBOLT = "Thunderbolt / USB 4 (до 40 Гбіт/с)";
const ESIM_5G = "5G, лише eSIM (модель Wi-Fi + Cellular)";

const PENCIL_PRO = "Apple Pencil Pro, Apple Pencil (USB-C)";
const PENCIL_USB_C = "Apple Pencil (USB-C), Apple Pencil (1-го покоління)";

const KEYBOARD_PRO = "Magic Keyboard для iPad Pro";
const KEYBOARD_AIR = "Magic Keyboard для iPad Air";
const KEYBOARD_FOLIO = "Magic Keyboard Folio";

const TOUCH_ID = "Touch ID у верхній кнопці";

const cellularWeight = (wifi: number, cellular: number) =>
  `${wifi} г (Wi-Fi), ${cellular} г (Wi-Fi + Cellular)`;

const IPAD_PRO = {
  display_type: IPAD_OLED,
  display_brightness: NITS_XDR,
  storage: "256 ГБ, 512 ГБ",
  camera_main: IPAD_CAMERA,
  camera_front: IPAD_FRONT_LANDSCAPE,
  battery: IPAD_BATTERY,
  port: THUNDERBOLT,
  cellular: ESIM_5G,
  pencil: PENCIL_PRO,
  keyboard: KEYBOARD_PRO,
  unlock: "Face ID",
};

const IPAD_PRO_11 = {
  ...IPAD_PRO,
  display_size: "11″",
  display_resolution: "2420 × 1668, 264 ppi",
  dimensions: "249,7 × 177,5 × 5,3 мм",
  weight: cellularWeight(444, 446),
};

const IPAD_PRO_13 = {
  ...IPAD_PRO,
  display_size: "13″",
  display_resolution: "2752 × 2064, 264 ppi",
  dimensions: "281,6 × 215,5 × 5,1 мм",
  weight: cellularWeight(579, 582),
};

const M5_WIRELESS = "Wi-Fi 7, Bluetooth 6, Thread";
const M5_CHARGING = "50% за 30 хв (від 60 Вт)";

const IPAD_AIR = {
  display_type: LIQUID_RETINA,
  storage: "128 ГБ, 256 ГБ",
  camera_main: IPAD_CAMERA,
  camera_front: IPAD_FRONT_LANDSCAPE,
  battery: IPAD_BATTERY,
  port: USB_C_3,
  wireless: WIFI_6E,
  cellular: ESIM_5G,
  pencil: PENCIL_PRO,
  keyboard: KEYBOARD_AIR,
  unlock: TOUCH_ID,
};

const IPAD_AIR_11 = {
  ...IPAD_AIR,
  display_size: "11″",
  display_resolution: "2360 × 1640, 264 ppi",
  display_brightness: "500 ніт",
  dimensions: "247,6 × 178,5 × 6,1 мм",
};

/** iPad (A16) та iPad 10-го покоління мають однаковий корпус. */
const IPAD_BASE = {
  display_type: LIQUID_RETINA,
  display_resolution: "2360 × 1640, 264 ppi",
  display_brightness: "500 ніт",
  camera_main: IPAD_CAMERA,
  camera_front: IPAD_FRONT_LANDSCAPE,
  battery: IPAD_BATTERY,
  port: USB_C_2,
  pencil: PENCIL_USB_C,
  keyboard: KEYBOARD_FOLIO,
  unlock: TOUCH_ID,
  dimensions: "248,6 × 179,5 × 7 мм",
  weight: cellularWeight(477, 481),
};

const IPAD: Record<string, Specs> = {
  "ipad-pro-11-m5": {
    ...IPAD_PRO_11,
    chip: "M5",
    charging: M5_CHARGING,
    wireless: M5_WIRELESS,
  },
  "ipad-pro-13-m5": {
    ...IPAD_PRO_13,
    chip: "M5",
    charging: M5_CHARGING,
    wireless: M5_WIRELESS,
  },
  "ipad-pro-11-m4": { ...IPAD_PRO_11, chip: "M4", wireless: WIFI_6E },
  "ipad-pro-13-m4": { ...IPAD_PRO_13, chip: "M4", wireless: WIFI_6E },
  "ipad-air-11-m3": { ...IPAD_AIR_11, chip: "M3", weight: "460 г" },
  "ipad-air-13-m3": {
    ...IPAD_AIR,
    display_size: "13″",
    display_resolution: "2732 × 2048, 264 ppi",
    display_brightness: "600 ніт",
    chip: "M3",
    dimensions: "280,6 × 214,9 × 6,1 мм",
    weight: cellularWeight(616, 617),
  },
  "ipad-air-11-m2": { ...IPAD_AIR_11, chip: "M2", weight: "462 г" },
  "ipad-mini-a17-pro": {
    display_size: "8,3″",
    display_type: LIQUID_RETINA,
    display_resolution: "2266 × 1488, 326 ppi",
    display_brightness: "500 ніт",
    chip: "A17 Pro",
    storage: "128 ГБ, 256 ГБ",
    camera_main: IPAD_CAMERA,
    camera_front: IPAD_FRONT_PORTRAIT,
    battery: IPAD_BATTERY,
    port: USB_C_3,
    wireless: WIFI_6E,
    cellular: ESIM_5G,
    pencil: PENCIL_PRO,
    keyboard: "Лише Bluetooth-клавіатури",
    unlock: TOUCH_ID,
    dimensions: "195,4 × 134,8 × 6,3 мм",
    weight: cellularWeight(293, 297),
  },
  "ipad-11-a16": {
    ...IPAD_BASE,
    display_size: "11″",
    chip: "A16",
    storage: "128 ГБ, 256 ГБ",
    wireless: "Wi-Fi 6, Bluetooth 5.3",
    cellular: ESIM_5G,
  },
  "ipad-10": {
    ...IPAD_BASE,
    display_size: "10,9″",
    chip: "A14 Bionic",
    storage: "64 ГБ, 256 ГБ",
    wireless: "Wi-Fi 6, Bluetooth 5.2",
    cellular: "5G, nano-SIM і eSIM (модель Wi-Fi + Cellular)",
  },
  "used-ipad-air-5-64": {
    display_size: "10,9″",
    display_type: LIQUID_RETINA,
    display_resolution: "2360 × 1640, 264 ppi",
    display_brightness: "500 ніт",
    chip: "M1",
    storage: "64 ГБ",
    camera_main: IPAD_CAMERA,
    camera_front: IPAD_FRONT_PORTRAIT,
    battery: IPAD_BATTERY,
    port: USB_C_3,
    wireless: "Wi-Fi 6, Bluetooth 5.0",
    cellular: "Немає (модель Wi-Fi)",
    pencil: "Apple Pencil (2-го покоління), Apple Pencil (USB-C)",
    keyboard: "Magic Keyboard, Smart Keyboard Folio",
    unlock: TOUCH_ID,
    dimensions: "247,6 × 178,5 × 6,1 мм",
    weight: "461 г",
  },
};

/* ------------------------------------------------------------------ */
/* Apple Watch                                                         */
/* ------------------------------------------------------------------ */

const WATCH_ALUMINIUM = "Алюміній, скло Ion-X";
const WATCH_TITANIUM = "Титан, сапфірове скло";

const WATCH_LTPO3 = "Always-On Retina LTPO3 OLED";
const WATCH_LTPO = "Always-On Retina LTPO OLED";

const WATER_50 = "50 м, пил IP6X";
const WATER_50_SE = "50 м";
const WATER_100 = "100 м, пил IP6X, дайвінг до 40 м";

const HEALTH_FULL = "ЕКГ, пульс, кисень у крові, температура зап'ястя";

const SAFETY = "SOS, виявлення падіння та ДТП";
const SAFETY_SIREN = "SOS, виявлення падіння та ДТП, сирена";

const GPS_L1 = "L1 GPS";
const GPS_DUAL = "Двочастотний GPS (L1 + L5)";

const WATCH_UWB = "Wi-Fi 4, Bluetooth 5.3, UWB";
const WATCH_NO_UWB = "Wi-Fi 4, Bluetooth 5.3";

const CELLULAR_5G_OPTION = "5G у моделях GPS + Cellular";
const CELLULAR_LTE_OPTION = "LTE у моделях GPS + Cellular";

const lowPower = (hours: number, saving: number) =>
  `До ${hours} год, до ${saving} год в режимі енергозбереження`;
const fastCharge = (time: string) => `Швидке: 80% за ${time}`;
const twoSizes = (small: string, large: string) => `${small}, ${large}`;

const WATCH: Record<string, Specs> = {
  "apple-watch-series-11": {
    case_size: "42 або 46 мм",
    material: WATCH_ALUMINIUM,
    display_type: WATCH_LTPO3,
    display_brightness: "До 2000 ніт",
    water: WATER_50,
    weight: twoSizes("30,3 г (42 мм)", "37,8 г (46 мм)"),
    chip: "S10",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: SAFETY,
    gps: GPS_L1,
    battery: lowPower(24, 38),
    charging: fastCharge("30 хв"),
    cellular: CELLULAR_5G_OPTION,
    wireless: WATCH_UWB,
  },
  "apple-watch-series-11-titanium": {
    case_size: "42 або 46 мм",
    material: WATCH_TITANIUM,
    display_type: WATCH_LTPO3,
    display_brightness: "До 2000 ніт",
    water: WATER_50,
    weight: twoSizes("34,6 г (42 мм)", "43,1 г (46 мм)"),
    chip: "S10",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: SAFETY,
    gps: GPS_L1,
    battery: lowPower(24, 38),
    charging: fastCharge("30 хв"),
    cellular: "5G",
    wireless: WATCH_UWB,
  },
  "apple-watch-se-3": {
    case_size: "40 або 44 мм",
    material: WATCH_ALUMINIUM,
    display_type: WATCH_LTPO,
    display_brightness: "До 1000 ніт",
    water: WATER_50_SE,
    weight: twoSizes("26,3 г (40 мм)", "32,9 г (44 мм)"),
    chip: "S10",
    storage: "64 ГБ",
    health: "Пульс, температура зап'ястя",
    safety: SAFETY,
    gps: GPS_L1,
    battery: lowPower(18, 32),
    charging: fastCharge("45 хв"),
    cellular: CELLULAR_5G_OPTION,
    wireless: WATCH_NO_UWB,
  },
  "apple-watch-ultra-3": {
    case_size: "49 мм",
    material: WATCH_TITANIUM,
    display_type: WATCH_LTPO3,
    display_brightness: "До 3000 ніт",
    water: WATER_100,
    weight: "61,6–61,8 г",
    chip: "S10",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: "SOS (і через супутник), падіння та ДТП, сирена",
    gps: GPS_DUAL,
    battery: lowPower(42, 72),
    charging: fastCharge("45 хв"),
    cellular: "5G і супутниковий зв'язок",
    wireless: WATCH_UWB,
  },
  "apple-watch-series-10": {
    case_size: "42 або 46 мм",
    material: WATCH_ALUMINIUM,
    display_type: WATCH_LTPO3,
    display_brightness: "До 2000 ніт",
    water: WATER_50,
    weight: twoSizes("30 г (42 мм)", "36,4 г (46 мм)"),
    chip: "S10",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: SAFETY,
    gps: GPS_L1,
    battery: lowPower(18, 36),
    charging: fastCharge("30 хв"),
    cellular: CELLULAR_LTE_OPTION,
    wireless: WATCH_UWB,
  },
  "apple-watch-ultra-2": {
    case_size: "49 мм",
    material: WATCH_TITANIUM,
    display_type: "Always-On Retina LTPO2 OLED",
    display_brightness: "До 3000 ніт",
    water: WATER_100,
    weight: "61,4–61,8 г",
    chip: "S9",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: SAFETY_SIREN,
    gps: GPS_DUAL,
    battery: lowPower(36, 72),
    charging: fastCharge("1 год"),
    cellular: "LTE",
    wireless: WATCH_UWB,
  },
  "apple-watch-se-2": {
    case_size: "40 або 44 мм",
    material: WATCH_ALUMINIUM,
    display_type: "Retina LTPO OLED, без Always-On",
    display_brightness: "До 1000 ніт",
    water: WATER_50_SE,
    weight: twoSizes("26,4 г (40 мм)", "32,9 г (44 мм)"),
    chip: "S8",
    storage: "32 ГБ",
    health: "Пульс",
    safety: SAFETY,
    gps: GPS_L1,
    battery: "До 18 год",
    charging: "80% за 1,5 год",
    cellular: CELLULAR_LTE_OPTION,
    wireless: WATCH_NO_UWB,
  },
  "used-apple-watch-series-9-45": {
    case_size: "45 мм",
    material: WATCH_ALUMINIUM,
    display_type: WATCH_LTPO,
    display_brightness: "До 2000 ніт",
    water: WATER_50,
    weight: "38,7 г",
    chip: "S9",
    storage: "64 ГБ",
    health: HEALTH_FULL,
    safety: SAFETY,
    gps: GPS_L1,
    battery: lowPower(18, 36),
    charging: fastCharge("45 хв"),
    wireless: WATCH_UWB,
  },
};

/* ------------------------------------------------------------------ */
/* AirPods                                                             */
/* ------------------------------------------------------------------ */

const ANC_ADAPTIVE = "Активне, з адаптивним аудіо";
const YES = "Є";
const SPATIAL = "Персоналізоване, з відстеженням рухів голови";
const CASE_WIRELESS = "USB-C, MagSafe, Qi, зарядка Apple Watch";
const STEM_PRESS = "Натискання на ніжку";
const STEM_PRESS_SWIPE = "Натискання і свайп по ніжці";
const IN_EAR = "Внутрішньоканальні з амбушурами";
const OPEN_FIT = "Вкладиші без амбушурів";

const budWeight = (bud: string, charger: string) => `${bud} г навушник, ${charger} г футляр`;

const AIRPODS: Record<string, Specs> = {
  "airpods-4": {
    form: OPEN_FIT,
    anc: NONE,
    transparency: NONE,
    spatial_audio: SPATIAL,
    chip: "H2",
    battery: "До 5 год",
    battery_case: "До 30 год",
    charging: "USB-C",
    health: NONE,
    water: "IP54",
    controls: STEM_PRESS,
    weight: budWeight("4,3", "32,3"),
  },
  "airpods-4-anc": {
    form: OPEN_FIT,
    anc: ANC_ADAPTIVE,
    transparency: YES,
    spatial_audio: SPATIAL,
    chip: "H2",
    battery: "До 5 год, до 4 год із шумопоглинанням",
    battery_case: "До 30 год, до 20 год із шумопоглинанням",
    charging: "USB-C, Qi, зарядка Apple Watch",
    health: NONE,
    water: "IP54",
    controls: STEM_PRESS,
    weight: budWeight("4,3", "34,7"),
  },
  "airpods-pro-3": {
    form: IN_EAR,
    anc: ANC_ADAPTIVE,
    transparency: YES,
    spatial_audio: SPATIAL,
    chip: "H2",
    battery: "До 8 год із шумопоглинанням",
    battery_case: "До 24 год із шумопоглинанням",
    charging: CASE_WIRELESS,
    health: "Датчик пульсу, перевірка слуху, слуховий апарат",
    water: "IP57",
    controls: STEM_PRESS_SWIPE,
    weight: budWeight("5,55", "43,99"),
  },
  "airpods-pro-2": {
    form: IN_EAR,
    anc: ANC_ADAPTIVE,
    transparency: YES,
    spatial_audio: SPATIAL,
    chip: "H2",
    battery: "До 6 год",
    battery_case: "До 30 год",
    charging: CASE_WIRELESS,
    health: "Перевірка слуху, слуховий апарат",
    water: "IP54",
    controls: STEM_PRESS_SWIPE,
    weight: budWeight("5,3", "50,8"),
  },
  "airpods-max": {
    form: "Повнорозмірні накладні",
    anc: "Активне",
    transparency: YES,
    spatial_audio: SPATIAL,
    chip: "H1",
    battery: "До 20 год із шумопоглинанням",
    battery_case: "Smart Case не заряджає",
    charging: "USB-C, без футляра",
    health: NONE,
    controls: "Digital Crown і кнопка режимів",
    weight: "386,2 г",
  },
};

/* ------------------------------------------------------------------ */
/* Усі характеристики                                                  */
/* ------------------------------------------------------------------ */

/** Характеристики за handle товару. Товару без запису метаполе не записується. */
export const SPECS: Record<string, Specs> = {
  ...IPHONE,
  ...MAC,
  ...IPAD,
  ...WATCH,
  ...AIRPODS,
};

/** Значення метаполя `custom.specs`: JSON-об'єкт або undefined, якщо характеристик немає. */
export function specsMetafieldValue(handle: string): string | undefined {
  const specs = SPECS[handle];
  return specs && Object.keys(specs).length > 0 ? JSON.stringify(specs) : undefined;
}
