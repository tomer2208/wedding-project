import { Guest } from "@/types/guest";

export interface Table {
  id: string;
  name: string;
  guests: Guest[];
  currentSeats: number;
  capacity: number;
}

// ==========================================
// 1. פונקציית הציון (The Fitness Function)
// ==========================================
function calculateTableScore(table: Table): number {
  let score = 0;
  const currentCount = table.currentSeats;

  // חוק 0: שולחן ריק זה מצוין (חסכנו)
  if (currentCount === 0) return 0;

  // חוק 1: קנס קטלני על חריגה ממקסימום מקומות
  if (currentCount > table.capacity) {
    return -20000 * (currentCount - table.capacity) - 10000;
  }

  // חוק 2: לוגיקת שולחן אבירים (20 מקומות) - ה-VIP של הצעירים
  if (table.capacity === 20) {
    // א. העפה אגרסיבית של מי שאינו צעיר
    const nonYoungGuests = table.guests.filter(
      (g) => g.ageGroup !== "YoungAdults",
    );
    if (nonYoungGuests.length > 0) {
      score -= 100000;
    }

    // ב. בונוס משיכה לחבר'ה מהצבא, לימודים ועבודה (דרישה 1)
    table.guests.forEach((g) => {
      if (["Army", "Work", "Friends", "Study"].includes(g.relationship)) {
        score += 300; // מקבלים תעדוף עליון לשבת באבירים!
      }
    });
  }

  // חוק 3: ענישה על בזבוז שולחנות (Bin Packing)
  score -= 1000; // קנס על עצם פתיחת השולחן
  const wastedSeats = table.capacity - currentCount;
  score -= wastedSeats * 50; // קנס על כל כיסא ריק בשולחן פתוח

  // חוק 4: חיבורים חברתיים (דרישה 2)
  for (let i = 0; i < table.guests.length; i++) {
    for (let j = i + 1; j < table.guests.length; j++) {
      const g1 = table.guests[i];
      const g2 = table.guests[j];

      const sameRel =
        g1.relationship === g2.relationship && g1.relationship !== "Other";
      const sameSide = g1.side === g2.side && g1.side !== "Joint";
      const sameAge = g1.ageGroup === g2.ageGroup;

      // סופר-בונוס: משפחה מאותה דרגה ומאותו צד (למשל דודים של החתן)
      if (sameRel && sameSide) {
        score += 600;
      } else if (sameRel) {
        score += 150; // רק אותו קשר (למשל צבא וצבא)
      } else if (sameSide) {
        score += 50; // רק אותו צד
      }

      if (sameAge) {
        score += 40; // בונוס קטן על התאמת גיל בשולחנות רגילים
      }
    }
  }

  return score;
}

function calculateTotalScore(tables: Table[]): number {
  return tables.reduce((total, table) => total + calculateTableScore(table), 0);
}

// ==========================================
// 2. פונקציית האופטימיזציה
// ==========================================
export function optimizeSeating(
  allGuests: Guest[],
  tableConfig: { count10: number; count12: number; count20: number },
  iterations: number = 100000, // העלינו את כמות הניסיונות
): Table[] {
  const relevantGuests = allGuests.filter((g) => g.status !== "Declined");

  // === שינוי קריטי: First-Fit Decreasing ===
  // ממיינים קודם את המשפחות הגדולות ביותר! ככה הבלוקים הגדולים תופסים מקום
  // ואת הזוגות והבודדים האלגוריתם ידחוף לחורים שנשארו. (מונע שולחנות חצי ריקים)
  relevantGuests.sort((a, b) => b.expectedGuests - a.expectedGuests);

  let tables: Table[] = [];
  let tableIndex = 1;

  for (let i = 0; i < tableConfig.count10; i++)
    tables.push({
      id: `t10-${i}`,
      name: `שולחן ${tableIndex++} (10)`,
      guests: [],
      currentSeats: 0,
      capacity: 10,
    });

  for (let i = 0; i < tableConfig.count12; i++)
    tables.push({
      id: `t12-${i}`,
      name: `שולחן ${tableIndex++} (12)`,
      guests: [],
      currentSeats: 0,
      capacity: 12,
    });

  let knightIndex = 1;
  for (let i = 0; i < tableConfig.count20; i++)
    tables.push({
      id: `t20-${i}`,
      name: `אבירים ${knightIndex++}`,
      guests: [],
      currentSeats: 0,
      capacity: 20,
    });

  const tableCount = tables.length;

  // פיזור ראשוני חכם (ולא אקראי)
  for (const guestGroup of relevantGuests) {
    let placed = false;

    // קודם כל מנסים לדחוף קבוצות של צעירים מהצבא/חברים לשולחן האבירים (אם יש מקום)
    if (
      guestGroup.ageGroup === "YoungAdults" &&
      ["Army", "Work", "Friends", "Study"].includes(guestGroup.relationship)
    ) {
      const knightTable = tables.find(
        (t) =>
          t.capacity === 20 &&
          t.currentSeats + guestGroup.expectedGuests <= t.capacity,
      );
      if (knightTable) {
        knightTable.guests.push(guestGroup);
        knightTable.currentSeats += guestGroup.expectedGuests;
        placed = true;
      }
    }

    // אם לא שובצו לאבירים, מחפשים את השולחן הראשון שיש בו מקום לכל הבלוק
    if (!placed) {
      for (let i = 0; i < tableCount; i++) {
        if (
          tables[i].currentSeats + guestGroup.expectedGuests <=
          tables[i].capacity
        ) {
          tables[i].guests.push(guestGroup);
          tables[i].currentSeats += guestGroup.expectedGuests;
          placed = true;
          break;
        }
      }
    }

    // אם באמת אין שום שולחן עם מספיק מקום, דוחפים לשולחן הכי פנוי וסופגים קנס כדי שהאלגוריתם יתקן
    if (!placed && tableCount > 0) {
      const emptiestTable = [...tables].sort(
        (a, b) => a.currentSeats - b.currentSeats,
      )[0];
      emptiestTable.guests.push(guestGroup);
      emptiestTable.currentSeats += guestGroup.expectedGuests;
    }
  }

  let currentScore = calculateTotalScore(tables);

  // לולאת הלמידה: עכשיו משפרת סידור שהוא כבר טוב יחסית
  for (let i = 0; i < iterations; i++) {
    if (tableCount <= 1) break;

    const t1Index = Math.floor(Math.random() * tableCount);
    const t2Index = Math.floor(Math.random() * tableCount);

    if (t1Index === t2Index) continue;

    const table1 = tables[t1Index];
    const table2 = tables[t2Index];

    if (table1.guests.length === 0 && table2.guests.length === 0) continue;

    const g1Index =
      table1.guests.length > 0
        ? Math.floor(Math.random() * table1.guests.length)
        : -1;
    const g2Index =
      table2.guests.length > 0
        ? Math.floor(Math.random() * table2.guests.length)
        : -1;

    const originalTable1Guests = [...table1.guests];
    const originalTable2Guests = [...table2.guests];
    const originalT1Seats = table1.currentSeats;
    const originalT2Seats = table2.currentSeats;

    if (g1Index !== -1 && g2Index !== -1) {
      const guest1 = table1.guests[g1Index];
      const guest2 = table2.guests[g2Index];

      table1.guests[g1Index] = guest2;
      table2.guests[g2Index] = guest1;
      table1.currentSeats =
        table1.currentSeats - guest1.expectedGuests + guest2.expectedGuests;
      table2.currentSeats =
        table2.currentSeats - guest2.expectedGuests + guest1.expectedGuests;
    } else if (g1Index !== -1) {
      const guest1 = table1.guests.splice(g1Index, 1)[0];
      table2.guests.push(guest1);
      table1.currentSeats -= guest1.expectedGuests;
      table2.currentSeats += guest1.expectedGuests;
    } else if (g2Index !== -1) {
      const guest2 = table2.guests.splice(g2Index, 1)[0];
      table1.guests.push(guest2);
      table2.currentSeats -= guest2.expectedGuests;
      table1.currentSeats += guest2.expectedGuests;
    }

    const newScore = calculateTotalScore(tables);

    if (newScore > currentScore) {
      currentScore = newScore; // הצלחה!
    } else {
      // גרוע יותר - מבטלים
      table1.guests = originalTable1Guests;
      table2.guests = originalTable2Guests;
      table1.currentSeats = originalT1Seats;
      table2.currentSeats = originalT2Seats;
    }
  }

  // הדפסה ל-Console כדי שתוכל לראות את הציון
  console.log("🏆 ציון אופטימיזציה סופי:", currentScore);

  return tables.filter((t) => t.currentSeats > 0);
}
