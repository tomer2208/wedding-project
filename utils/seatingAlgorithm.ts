// utils/seatingAlgorithm.ts
import { Guest } from "@/types/guest"; // מוודא שה-Guest מיובא נכון

// 1. הוספנו את המילה export כדי שהעמוד יוכל להשתמש ב-Table
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

  if (currentCount === 0) return 0;

  if (currentCount > table.capacity) {
    return -20000 * (currentCount - table.capacity) - 10000;
  }

  if (table.capacity === 20) {
    const nonYoungGuests = table.guests.filter(
      (g) => g.ageGroup !== "YoungAdults",
    );
    if (nonYoungGuests.length > 0) {
      score -= 100000;
    }
    table.guests.forEach((g) => {
      if (["Army", "Work", "Friends", "Study"].includes(g.relationship)) {
        score += 300;
      }
    });
  }

  // === חוק 3 המעודכן: איזון תפוסת שולחנות ===
  score -= 500;

  if (currentCount < 6) {
    score -= (6 - currentCount) * 150;
  } else if (currentCount < table.capacity) {
    const wastedSeats = table.capacity - currentCount;
    score -= wastedSeats * 10;
  }

  for (let i = 0; i < table.guests.length; i++) {
    for (let j = i + 1; j < table.guests.length; j++) {
      const g1 = table.guests[i];
      const g2 = table.guests[j];

      const sameRel =
        g1.relationship === g2.relationship && g1.relationship !== "Other";
      const sameSide = g1.side === g2.side && g1.side !== "Joint";
      const sameAge = g1.ageGroup === g2.ageGroup;

      if (sameRel && sameSide) {
        score += 600;
      } else if (sameRel) {
        score += 150;
      } else if (sameSide) {
        score += 50;
      }

      if (sameAge) {
        score += 40;
      }
    }
  }

  return score;
}

function calculateTotalScore(tables: Table[]): number {
  return tables.reduce((total, table) => total + calculateTableScore(table), 0);
}

// ==========================================
// 2. פונקציית האופטימיזציה המרכזית
// ==========================================
export function optimizeSeating(
  allGuests: Guest[],
  tableConfig: { count10: number; count12: number; count20: number },
  iterations: number = 100000,
): Table[] {
  const relevantGuests = allGuests.filter((g) => g.status !== "Declined");

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

  // פיזור ראשוני חכם
  for (const guestGroup of relevantGuests) {
    let placed = false;

    // 1. קודם כל מנסים לדחוף צעירים לשולחן האבירים (אם יש מקום)
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

    // 2. אם לא שובצו, מחפשים שולחן רגיל פנוי (מגנים על האבירים מפני מבוגרים)
    if (!placed) {
      for (let i = 0; i < tables.length; i++) {
        const targetTable = tables[i];

        // הגנה: לעולם אל תדחוף מבוגרים לשולחן של 20 בפיזור הראשוני
        if (
          targetTable.capacity === 20 &&
          guestGroup.ageGroup !== "YoungAdults"
        ) {
          continue;
        }

        if (
          targetTable.currentSeats + guestGroup.expectedGuests <=
          targetTable.capacity
        ) {
          targetTable.guests.push(guestGroup);
          targetTable.currentSeats += guestGroup.expectedGuests;
          placed = true;
          break;
        }
      }
    }

    // 3. התיקון הגדול: פתיחת שולחן רזרבה דינמי
    if (!placed) {
      const reserveTable: Table = {
        id: `reserve-${Date.now()}-${Math.random()}`,
        name: `שולחן רזרבה (10)`,
        guests: [guestGroup],
        currentSeats: guestGroup.expectedGuests,
        capacity: 10,
      };
      tables.push(reserveTable);
      console.log(`⚠️ נפתח שולחן רזרבה עבור: ${guestGroup.name}`);
    }
  }

  let currentScore = calculateTotalScore(tables);

  for (let i = 0; i < iterations; i++) {
    // השתמשנו ב-tables.length דינמי כדי שיתחשב גם בשולחנות הרזרבה!
    if (tables.length <= 1) break;

    const t1Index = Math.floor(Math.random() * tables.length);
    const t2Index = Math.floor(Math.random() * tables.length);

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

    // === התיקון שלנו: 50% סיכוי להעברה, 50% סיכוי להחלפה הדדית ===
    const tryMove = Math.random() < 0.5;

    if (tryMove) {
      // מנסים להעביר קבוצה משולחן אחד לשני בלי לקחת כלום בחזרה
      if (Math.random() < 0.5 && g1Index !== -1) {
        const guest1 = table1.guests.splice(g1Index, 1)[0];
        table2.guests.push(guest1);
        table1.currentSeats = table1.currentSeats - guest1.expectedGuests;
        table2.currentSeats = table2.currentSeats + guest1.expectedGuests;
      } else if (g2Index !== -1) {
        const guest2 = table2.guests.splice(g2Index, 1)[0];
        table1.guests.push(guest2);
        table2.currentSeats = table2.currentSeats - guest2.expectedGuests;
        table1.currentSeats = table1.currentSeats + guest2.expectedGuests;
      }
    } else {
      // מנסים לעשות טרייד (החלפה הדדית קלאסית)
      if (g1Index !== -1 && g2Index !== -1) {
        const guest1 = table1.guests[g1Index];
        const guest2 = table2.guests[g2Index];

        table1.guests[g1Index] = guest2;
        table2.guests[g2Index] = guest1;
        table1.currentSeats =
          table1.currentSeats - guest1.expectedGuests + guest2.expectedGuests;
        table2.currentSeats =
          table2.currentSeats - guest2.expectedGuests + guest1.expectedGuests;
      }
    }

    const newScore = calculateTotalScore(tables);

    // אם הניקוד החדש טוב יותר - משאירים. אחרת, מבטלים (Rollback)
    if (newScore > currentScore) {
      currentScore = newScore;
    } else {
      table1.guests = originalTable1Guests;
      table2.guests = originalTable2Guests;
      table1.currentSeats = originalT1Seats;
      table2.currentSeats = originalT2Seats;
    }
  }

  return tables.filter((t) => t.currentSeats > 0);
}
