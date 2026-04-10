export interface Guest {
  id: string;
  name: string;
  phone: string;
  expectedGuests: number; // זה ה"בלוק" שלנו! אם זה 4, האלגוריתם מזיז את כל ה-4 יחד

  // ה-Sweet Spot של צדדים
  side: "Bride" | "Groom" | "Joint";

  // ה-Sweet Spot של קשרים
  relationship:
    | "ImmediateFamily"
    | "ExtendedFamily"
    | "Friends"
    | "Army"
    | "Work"
    | "Study"
    | "ParentsGuests"
    | "Other";

  // ה-Sweet Spot של גילאים
  ageGroup: "Adults" | "YoungAdults" | "Kids";

  status: "Invited" | "Confirmed" | "Declined" | "Pending";
}
