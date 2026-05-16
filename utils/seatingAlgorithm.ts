import { Guest } from "@/types/guest";

export interface Table {
  id: string;
  name: string;
  guests: Guest[];
  currentSeats: number;
  capacity: number;
}

// שדרוג קריטי: מכריח את כל הערכים להיות מספרים אמיתיים (Number) ולא טקסט!
const getCount = (g: Guest) =>
  Number(g.expectedGuests) || Number(g.invited_count) || 1;

// ==========================================
// 1. פונקציית הציון הדינמית
// ==========================================
function calculateTableScore(table: Table): number {
  let score = 0;
  const currentCount = Number(table.currentSeats);
  const cap = Number(table.capacity);

  if (currentCount === 0) return 0;

  if (currentCount > cap) {
    return -20000 * (currentCount - cap) - 10000;
  }

  if (cap === 20) {
    const hasOlder = table.guests.some((g) => g.ageGroup !== "YoungAdults");
    if (hasOlder) {
      score -= 100000;
    } else {
      score += 2000;
    }
  }

  score -= 500;
  if (currentCount < 6) {
    score -= (6 - currentCount) * 150;
  } else if (currentCount < cap) {
    score -= (cap - currentCount) * 10;
  }

  for (let i = 0; i < table.guests.length; i++) {
    for (let j = i + 1; j < table.guests.length; j++) {
      const g1 = table.guests[i];
      const g2 = table.guests[j];

      const sameRel =
        g1.relationship === g2.relationship &&
        Boolean(g1.relationship) &&
        g1.relationship !== "אחר" &&
        g1.relationship !== "Other";
      const sameSide = g1.side === g2.side && g1.side !== "Joint";
      const sameAge = g1.ageGroup === g2.ageGroup;

      if (sameRel && sameSide) score += 800;
      else if (sameRel) score += 300;
      else if (sameSide) score += 50;

      if (sameAge) score += 40;
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
  iterations: number = 20000, // הורדנו קצת את כמות האיטרציות כדי שהדפדפן לא יקפא
): Table[] {
  // הגנה מפני מערך ריק או לא מוגדר
  if (!allGuests || allGuests.length === 0) return [];

  const relevantGuests = JSON.parse(
    JSON.stringify(allGuests.filter((g) => g.status !== "Declined")),
  ) as Guest[];

  relevantGuests.sort((a, b) => getCount(b) - getCount(a));

  let tables: Table[] = [];
  let tableIndex = 1;

  for (let i = 0; i < Number(tableConfig.count10 || 0); i++)
    tables.push({
      id: `t10-${i}`,
      name: `שולחן ${tableIndex++} (10)`,
      guests: [],
      currentSeats: 0,
      capacity: 10,
    });

  for (let i = 0; i < Number(tableConfig.count12 || 0); i++)
    tables.push({
      id: `t12-${i}`,
      name: `שולחן ${tableIndex++} (12)`,
      guests: [],
      currentSeats: 0,
      capacity: 12,
    });

  let knightIndex = 1;
  for (let i = 0; i < Number(tableConfig.count20 || 0); i++)
    tables.push({
      id: `t20-${i}`,
      name: `אבירים ${knightIndex++}`,
      guests: [],
      currentSeats: 0,
      capacity: 20,
    });

  // הגנה: אם המשתמש לא הגדיר שולחנות בכלל
  if (tables.length === 0) return [];

  for (const guestGroup of relevantGuests) {
    let placed = false;
    const gCount = getCount(guestGroup);

    if (guestGroup.ageGroup === "YoungAdults") {
      const knightTable = tables.find(
        (t) => t.capacity === 20 && t.currentSeats + gCount <= t.capacity,
      );
      if (knightTable) {
        knightTable.guests.push(guestGroup);
        knightTable.currentSeats += gCount;
        placed = true;
      }
    }

    if (!placed) {
      const targetTable = tables.find(
        (t) =>
          (t.capacity !== 20 || guestGroup.ageGroup === "YoungAdults") &&
          t.currentSeats + gCount <= t.capacity,
      );
      if (targetTable) {
        targetTable.guests.push(guestGroup);
        targetTable.currentSeats += gCount;
        placed = true;
      }
    }

    if (!placed) {
      tables.push({
        id: `reserve-${Date.now()}-${Math.random()}`,
        name: `שולחן רזרבה (10)`,
        guests: [guestGroup],
        currentSeats: gCount,
        capacity: 10,
      });
    }
  }

  let currentScore = calculateTotalScore(tables);

  for (let i = 0; i < iterations; i++) {
    if (tables.length <= 1) break;

    const t1 = tables[Math.floor(Math.random() * tables.length)];
    const t2 = tables[Math.floor(Math.random() * tables.length)];
    if (t1.id === t2.id) continue;

    const g1Idx =
      t1.guests.length > 0 ? Math.floor(Math.random() * t1.guests.length) : -1;
    const g2Idx =
      t2.guests.length > 0 ? Math.floor(Math.random() * t2.guests.length) : -1;

    // הגנה מפני קריסה אם שני השולחנות ריקים או לא נבחר אורח להזזה
    if (g1Idx === -1 && g2Idx === -1) continue;

    const backupT1 = { guests: [...t1.guests], seats: t1.currentSeats };
    const backupT2 = { guests: [...t2.guests], seats: t2.currentSeats };

    const tryMove = Math.random() < 0.5;

    if (tryMove && g1Idx !== -1) {
      const [g1] = t1.guests.splice(g1Idx, 1);
      t2.guests.push(g1);
      t1.currentSeats -= getCount(g1);
      t2.currentSeats += getCount(g1);
    } else if (!tryMove && g1Idx !== -1 && g2Idx !== -1) {
      const g1 = t1.guests[g1Idx];
      const g2 = t2.guests[g2Idx];
      t1.guests[g1Idx] = g2;
      t2.guests[g2Idx] = g1;
      t1.currentSeats = t1.currentSeats - getCount(g1) + getCount(g2);
      t2.currentSeats = t2.currentSeats - getCount(g2) + getCount(g1);
    } else {
      continue;
    }

    const newScore = calculateTotalScore(tables);
    if (newScore > currentScore) {
      currentScore = newScore;
    } else {
      t1.guests = backupT1.guests;
      t1.currentSeats = backupT1.seats;
      t2.guests = backupT2.guests;
      t2.currentSeats = backupT2.seats;
    }
  }

  return tables.filter((t) => t.currentSeats > 0);
}
