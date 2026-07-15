export type CognitiveScores = {
  attention: number;
  memory: number;
  logic: number;
  control: number;
};

export type ComicContent = {
  title: string;
  panels: { image: string; speech: string | null }[]; // null = скрытая реплика
  hiddenPanelIndex: number;
  options: string[]; // 3 варианта реплики
  correctIndex: number;
};

export type DataContent = {
  title: string;
  chart: { labels: string[]; values: number[]; yLabel: string };
  questions: { text: string; options: string[]; correctIndex: number }[]; // 2-3 вопроса
};

export type RobotContent = {
  title: string;
  grid: string[]; // строки поля: "." пусто, "#" ловушка, "S" старт, "F" финиш
  energyLimit: number; // макс. число команд
  commands: ("up" | "down" | "left" | "right")[]; // доступные
};
