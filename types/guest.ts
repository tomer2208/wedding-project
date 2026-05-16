export interface Guest {
  id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  name?: string; // הוספנו תמיכה בשדה name הישן לצורך תאימות
  phone?: string;

  // השדרוג הדינמי: relationship הוא עכשיו מחרוזת חופשית
  relationship: string;

  side: "Bride" | "Groom" | "Joint";

  // הוספנו תמיכה בקבוצות גיל כפי שמופיע בקוד שלך
  ageGroup?: "Adults" | "YoungAdults" | "Kids";

  invited_count: number;
  expectedGuests?: number; // תאימות לשם השדה בחלק מהקוד

  status: "Pending" | "Confirmed" | "Declined" | "Invited";
  created_at?: string;
}

// טיפוס עזר להוספת אורח חדש (ללא ה-ID והתאריך שנוצרים אוטומטית)
export type NewGuest = Omit<Guest, "id" | "created_at">;
