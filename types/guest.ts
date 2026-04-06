export interface Guest {
  id: string;
  name: string;
  side: "Bride" | "Groom" | "Joint";
  relationship: "Family" | "Friends" | "Work" | "Army" | "Other";
  ageGroup: "Adult" | "Teen" | "Child";
  expectedGuests: number;
  status: "Invited" | "Confirmed" | "Declined" | "Pending";
  phone: string;
}
