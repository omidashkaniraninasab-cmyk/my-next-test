// تولیدکننده جدول‌های کراسورد با سایزهای مختلف
export class PuzzleGenerator {
  // ایجاد جدول خالی
  static createEmptyGrid(size) {
    return Array(size).fill().map(() => Array(size).fill(1)); // 1 = خانه سفید
  }

  // ایجاد جدول با الگوی تصادفی
  static generateRandomGrid(size, blackCellRatio = 0.2) {
    const grid = this.createEmptyGrid(size);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (Math.random() < blackCellRatio) {
          grid[i][j] = 0; // خانه سیاه
        }
      }
    }
    
    return grid;
  }

  // تولید راهنماهای افقی و عمودی
  static generateClues(grid, words) {
    const size = grid.length;
    const across = {};
    const down = {};
    let clueNumber = 1;

    // راهنماهای افقی
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === 1 && (j === 0 || grid[i][j-1] === 0)) {
          let length = 0;
          while (j + length < size && grid[i][j + length] === 1) {
            length++;
          }
          if (length > 1) {
            across[clueNumber] = {
              clue: this.getRandomClue('across'),
              start: [i, j],
              length: length
            };
            clueNumber++;
          }
        }
      }
    }

    // راهنماهای عمودی
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        if (grid[i][j] === 1 && (i === 0 || grid[i-1][j] === 0)) {
          let length = 0;
          while (i + length < size && grid[i + length][j] === 1) {
            length++;
          }
          if (length > 1) {
            down[clueNumber] = {
              clue: this.getRandomClue('down'),
              start: [i, j],
              length: length
            };
            clueNumber++;
          }
        }
      }
    }

    return { across, down };
  }

  // تولید جواب تصادفی
  static generateSolution(grid) {
    const size = grid.length;
    const solution = Array(size).fill().map(() => Array(size).fill(''));
    const persianLetters = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی';

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === 1) {
          // انتخاب حرف تصادفی فارسی
          const randomIndex = Math.floor(Math.random() * persianLetters.length);
          solution[i][j] = persianLetters[randomIndex];
        }
      }
    }

    return solution;
  }

  // راهنماهای تصادفی
  static getRandomClue(direction) {
    const acrossClues = [
      "نام یک شهر ایران",
      "نام یک میوه",
      "وسیله نقلیه",
      "حیوان خانگی",
      "رنگ",
      "شغل",
      "کشور",
      "غذا",
      "نوشیدنی",
      "ورزش",
      "فیلم",
      "کتاب",
      "خواننده",
      "گیاه",
      "فصل سال"
    ];

    const downClues = [
      "نام یک رودخانه",
      "دانشمند معروف",
      "سیاره",
      "عنصر شیمیایی",
      "ابزار موسیقی",
      "پایتخت کشور",
      "درخت",
      "حشره",
      "پرنده",
      "ماه تقویم",
      "عدد",
      "شکل هندسی",
      "ماده معدنی",
      "اختراع",
      "کشفیات علمی"
    ];

    const clues = direction === 'across' ? acrossClues : downClues;
    return clues[Math.floor(Math.random() * clues.length)];
  }

  // تولید جدول کامل
  static generatePuzzle(size, title = "جدول جدید") {
    const grid = this.generateRandomGrid(size);
    const solution = this.generateSolution(grid);
    const clues = this.generateClues(grid);

    return {
      id: Date.now(),
      title: `${title} (${size}×${size})`,
      size: size,
      grid: grid,
      solution: solution,
      across: clues.across,
      down: clues.down
    };
  }
}