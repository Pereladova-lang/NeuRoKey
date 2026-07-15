import type { RobotContent } from "@/lib/exercise-types";

// 10 сюжетов × 3 уровня. Поле растёт 5×5 → 6×6 → 7×7, ловушек больше,
// запас энергии относительно длины кратчайшего пути становится теснее.
// Геометрия путей проверена вручную (и покрыта BFS-тестом): в вариантах
// "A" старт слева сверху, финиш справа снизу (путь: вправо по верхней
// строке, затем вниз по правому столбцу); в вариантах "B" — наоборот
// (старт слева снизу, финиш справа сверху: путь вправо по нижней строке,
// затем вверх по правому столбцу). Ловушки расставлены только вне этого
// пути, поэтому решение всегда существует.

const commandsAll: RobotContent["commands"] = ["up", "down", "left", "right"];

// --- Геометрия A (5x5 / 6x6 / 7x7), pathLen = 8 / 10 / 12 ---
const gridA5 = ["S....", ".#...", "..#..", ".#...", "....F"];
const gridA6 = ["S.....", ".#....", "..#...", "...#..", ".#.#..", ".....F"];
const gridA7 = [
  "S......",
  ".#.....",
  "..#....",
  "...#...",
  ".#.#...",
  "..#.#..",
  "......F",
];

// --- Геометрия B (5x5 / 6x6 / 7x7), pathLen = 8 / 10 / 12 ---
const gridB5 = ["....F", ".#...", "..#..", ".#...", "S...."];
const gridB6 = [".....F", ".#....", "..#...", "...#..", ".#.#..", "S....."];
const gridB7 = [
  "......F",
  ".#.....",
  "..#....",
  "...#...",
  ".#.#...",
  "..#.#..",
  "S......",
];

function level1(title: string, variant: "A" | "B") {
  return {
    title,
    grid: variant === "A" ? gridA5 : gridB5,
    energyLimit: 12,
    commands: commandsAll,
  };
}
function level2(title: string, variant: "A" | "B") {
  return {
    title,
    grid: variant === "A" ? gridA6 : gridB6,
    energyLimit: 12,
    commands: commandsAll,
  };
}
function level3(title: string, variant: "A" | "B") {
  return {
    title,
    grid: variant === "A" ? gridA7 : gridB7,
    energyLimit: 13,
    commands: commandsAll,
  };
}

export const robotTasks: { level: 1 | 2 | 3; content: RobotContent }[] = [
  // 1. Склад
  { level: 1, content: level1("Робот-доставщик: склад, этаж 1", "A") },
  { level: 2, content: level2("Робот-доставщик: склад, этаж 2", "A") },
  { level: 3, content: level3("Робот-доставщик: склад, этаж 3", "A") },

  // 2. Сад
  { level: 1, content: level1("Садовый робот: грядка у забора", "B") },
  { level: 2, content: level2("Садовый робот: грядка у теплицы", "B") },
  { level: 3, content: level3("Садовый робот: большой огород", "B") },

  // 3. Музей
  { level: 1, content: level1("Робот-уборщик: зал динозавров", "A") },
  { level: 2, content: level2("Робот-уборщик: зал картин", "A") },
  { level: 3, content: level3("Робот-уборщик: весь этаж музея", "A") },

  // 4. Кухня
  { level: 1, content: level1("Кухонный робот: доставка соли", "B") },
  { level: 2, content: level2("Кухонный робот: полная сервировка", "B") },
  { level: 3, content: level3("Кухонный робот: банкетный зал", "B") },

  // 5. Парк
  { level: 1, content: level1("Парковый робот: клумба у входа", "A") },
  { level: 2, content: level2("Парковый робот: аллея фонтанов", "A") },
  { level: 3, content: level3("Парковый робот: весь парк", "A") },

  // 6. Космическая станция
  { level: 1, content: level1("Робот на станции: модуль связи", "B") },
  { level: 2, content: level2("Робот на станции: модуль лаборатории", "B") },
  { level: 3, content: level3("Робот на станции: весь корабль", "B") },

  // 7. Завод
  { level: 1, content: level1("Заводской робот: линия сборки 1", "A") },
  { level: 2, content: level2("Заводской робот: линия сборки 2", "A") },
  { level: 3, content: level3("Заводской робот: весь цех", "A") },

  // 8. Аквариум
  { level: 1, content: level1("Робот-чистильщик: малый аквариум", "B") },
  { level: 2, content: level2("Робот-чистильщик: большой аквариум", "B") },
  { level: 3, content: level3("Робот-чистильщик: весь океанариум", "B") },

  // 9. Библиотека
  { level: 1, content: level1("Библиотечный робот: детский стеллаж", "A") },
  { level: 2, content: level2("Библиотечный робот: читальный зал", "A") },
  { level: 3, content: level3("Библиотечный робот: весь этаж", "A") },

  // 10. Детская площадка
  { level: 1, content: level1("Робот на площадке: песочница", "B") },
  { level: 2, content: level2("Робот на площадке: горки и качели", "B") },
  { level: 3, content: level3("Робот на площадке: вся территория", "B") },
];
