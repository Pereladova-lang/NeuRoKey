import type { RobotContent } from "@/lib/exercise-types";

// 10 сюжетов × 3 уровня. Поле растёт 5×5 → 6×6 → 7×7.
// Каждая из 10 раскладок внутри уровня уникальна (не дублируется и не
// является тривиальным зеркалом другой): позиции S/F и ловушек "#"
// сгенерированы случайным поиском с проверкой решаемости (BFS), затем
// зафиксированы как константы. Плотность ловушек растёт с уровнем
// (4 → 6 → 9 на поле), а запас energyLimit относительно длины
// кратчайшего пути становится теснее (+4 → +3 → +2). Решаемость каждой
// раскладки в пределах energyLimit дополнительно проверяется BFS-тестом
// в tests/unit/seed-content.test.ts.

const commandsAll: RobotContent["commands"] = ["up", "down", "left", "right"];

// --- Уровень 1: 5×5, 10 уникальных раскладок ---
const level1Grids: { grid: string[]; energyLimit: number }[] = [
  { grid: ["....S", ".....", ".F.#.", "#.#..", "....#"], energyLimit: 9 },
  { grid: [".S...", ".#...", ".#...", ".....", ".#.F#"], energyLimit: 10 },
  { grid: ["S....", ".#...", "#....", "..#..", ".F..#"], energyLimit: 11 },
  { grid: [".....", "..F..", "#...#", "..##S", "....."], energyLimit: 12 },
  { grid: ["##...", ".F.#.", ".....", "..#.S", "....."], energyLimit: 9 },
  { grid: [".....", "#.#.#", ".F..#", ".....", "...S."], energyLimit: 8 },
  { grid: ["....#", "...#.", "..#..", ".F...", ".#..S"], energyLimit: 8 },
  { grid: ["..#..", ".....", "..S..", "#..#.", "#...F"], energyLimit: 8 },
  { grid: [".#.F.", "#....", ".....", "#..#.", "S...."], energyLimit: 11 },
  { grid: [".....", "##..S", "#.#..", ".F...", "....."], energyLimit: 9 },
];

// --- Уровень 2: 6×6, 10 уникальных раскладок ---
const level2Grids: { grid: string[]; energyLimit: number }[] = [
  { grid: ["..#...", "...S#.", "#..#.F", "......", "...#.#", "......"], energyLimit: 8 },
  { grid: ["....#.", ".S....", ".#...#", ".#....", "...#.#", "..F..."], energyLimit: 8 },
  { grid: [".F....", ".#.#..", "#...S.", "#..#..", "....#.", "......"], energyLimit: 8 },
  { grid: ["..S...", "..###.", ".#.#..", "......", "#.....", ".....F"], energyLimit: 11 },
  { grid: [".....S", "......", "....#.", "...#..", ".#..#.", "...##F"], energyLimit: 8 },
  { grid: ["..#...", "..S...", "......", "#..##.", "#F....", ".#...."], energyLimit: 7 },
  { grid: ["..#.#.", ".#S...", ".#....", ".....F", "....#.", ".#...."], energyLimit: 8 },
  { grid: ["F.....", ".#....", ".....#", "##....", ".#...#", ".....S"], energyLimit: 13 },
  { grid: ["...#..", "..#..F", ".....#", ".#S...", "....#.", "#....."], energyLimit: 8 },
  { grid: ["......", "...#F.", "....#.", ".S.#..", "..##.#", "......"], energyLimit: 10 },
];

// --- Уровень 3: 7×7, 10 уникальных раскладок ---
const level3Grids: { grid: string[]; energyLimit: number }[] = [
  { grid: ["....#..", "...#...", "..#.##.", "#S...#.", ".#.....", "......#", ".....F."], energyLimit: 9 },
  { grid: ["#.#...#", ".....#.", ".....S.", ".#...#.", "..##...", "..#F...", "......."], energyLimit: 7 },
  { grid: [".#.#...", "......#", "..F....", ".#.#..#", ".##....", "...#..S", "......."], energyLimit: 9 },
  { grid: [".#.#...", ".......", "..#....", "....#..", "S.#...#", ".#...##", "....F.."], energyLimit: 8 },
  { grid: ["...#.S.", "..#....", "..#....", "..F....", "#.#..##", ".....#.", "#......"], energyLimit: 8 },
  { grid: ["....##.", ".##....", ".F.#...", ".....#.", "....S.#", "....#..", "....#.."], energyLimit: 7 },
  { grid: ["...#.#.", ".......", ".......", ".......", "...#F##", "..S#..#", "##....."], energyLimit: 7 },
  { grid: ["#.#.#..", "#.#..#.", "....#..", ".....#.", "....S..", "...#...", "..F...."], energyLimit: 6 },
  { grid: ["....#..", ".....#.", "S......", ".....F.", "..#....", "##....#", ".#..##."], energyLimit: 8 },
  { grid: ["....#.#", ".....#.", ".#..##.", ".......", "S.#.F.#", ".......", "....#.."], energyLimit: 8 },
];

function level1(title: string, index: number) {
  const g = level1Grids[index];
  return { title, grid: g.grid, energyLimit: g.energyLimit, commands: commandsAll };
}
function level2(title: string, index: number) {
  const g = level2Grids[index];
  return { title, grid: g.grid, energyLimit: g.energyLimit, commands: commandsAll };
}
function level3(title: string, index: number) {
  const g = level3Grids[index];
  return { title, grid: g.grid, energyLimit: g.energyLimit, commands: commandsAll };
}

export const robotTasks: { level: 1 | 2 | 3; content: RobotContent }[] = [
  // 1. Склад
  { level: 1, content: level1("Робот-доставщик: склад, этаж 1", 0) },
  { level: 2, content: level2("Робот-доставщик: склад, этаж 2", 0) },
  { level: 3, content: level3("Робот-доставщик: склад, этаж 3", 0) },

  // 2. Сад
  { level: 1, content: level1("Садовый робот: грядка у забора", 1) },
  { level: 2, content: level2("Садовый робот: грядка у теплицы", 1) },
  { level: 3, content: level3("Садовый робот: большой огород", 1) },

  // 3. Музей
  { level: 1, content: level1("Робот-уборщик: зал динозавров", 2) },
  { level: 2, content: level2("Робот-уборщик: зал картин", 2) },
  { level: 3, content: level3("Робот-уборщик: весь этаж музея", 2) },

  // 4. Кухня
  { level: 1, content: level1("Кухонный робот: доставка соли", 3) },
  { level: 2, content: level2("Кухонный робот: полная сервировка", 3) },
  { level: 3, content: level3("Кухонный робот: банкетный зал", 3) },

  // 5. Парк
  { level: 1, content: level1("Парковый робот: клумба у входа", 4) },
  { level: 2, content: level2("Парковый робот: аллея фонтанов", 4) },
  { level: 3, content: level3("Парковый робот: весь парк", 4) },

  // 6. Космическая станция
  { level: 1, content: level1("Робот на станции: модуль связи", 5) },
  { level: 2, content: level2("Робот на станции: модуль лаборатории", 5) },
  { level: 3, content: level3("Робот на станции: весь корабль", 5) },

  // 7. Завод
  { level: 1, content: level1("Заводской робот: линия сборки 1", 6) },
  { level: 2, content: level2("Заводской робот: линия сборки 2", 6) },
  { level: 3, content: level3("Заводской робот: весь цех", 6) },

  // 8. Аквариум
  { level: 1, content: level1("Робот-чистильщик: малый аквариум", 7) },
  { level: 2, content: level2("Робот-чистильщик: большой аквариум", 7) },
  { level: 3, content: level3("Робот-чистильщик: весь океанариум", 7) },

  // 9. Библиотека
  { level: 1, content: level1("Библиотечный робот: детский стеллаж", 8) },
  { level: 2, content: level2("Библиотечный робот: читальный зал", 8) },
  { level: 3, content: level3("Библиотечный робот: весь этаж", 8) },

  // 10. Детская площадка
  { level: 1, content: level1("Робот на площадке: песочница", 9) },
  { level: 2, content: level2("Робот на площадке: горки и качели", 9) },
  { level: 3, content: level3("Робот на площадке: вся территория", 9) },
];
