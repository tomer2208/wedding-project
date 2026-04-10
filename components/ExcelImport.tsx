"use client";

import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { Guest } from "@/types/guest";

interface ExcelImportProps {
  onImport: (guests: Guest[]) => void;
}

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

export const ExcelImport = ({ onImport }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSmartValue = (row: any, keywords: string[]) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().trim();
      if (keywords.some((kw) => normalizedKey.includes(kw))) {
        return row[key];
      }
    }
    return undefined;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);

      const mappedGuests: Guest[] = rawData.map((item: any) => {
        // 1. שם
        const rawName =
          getSmartValue(item, ["שם", "name", "אורח", "guest"]) || "ללא שם";

        // 2. טלפון
        const rawPhone =
          getSmartValue(item, ["טלפון", "נייד", "phone", "mobile", "פלאפון"]) ||
          "";

        // 3. כמות
        const rawExpected = getSmartValue(item, [
          "כמות",
          "מספר",
          "amount",
          "qty",
          "מוזמנים",
          "כמה",
        ]);
        const expectedGuests = Number(rawExpected) || 1;

        // 4. זיהוי צד
        const rawSide = String(
          getSmartValue(item, ["צד", "side"]) || "",
        ).trim();
        let side: Guest["side"] = "Joint";
        if (rawSide === "Groom" || rawSide.includes("חתן")) side = "Groom";
        else if (rawSide === "Bride" || rawSide.includes("כלה")) side = "Bride";

        // 5. זיהוי קשר משפחתי
        const rawRel = String(
          getSmartValue(item, [
            "קשר",
            "קרבה",
            "סוג",
            "relationship",
            "relation",
          ]) || "",
        ).trim();
        let relationship: Guest["relationship"] = "Other";
        const validRels = [
          "ImmediateFamily",
          "ExtendedFamily",
          "Friends",
          "Army",
          "Work",
          "Study",
          "ParentsGuests",
          "Other",
        ];

        if (validRels.includes(rawRel)) {
          relationship = rawRel as Guest["relationship"];
        } else {
          if (rawRel.includes("קרוב")) relationship = "ImmediateFamily";
          else if (rawRel.includes("מורחב")) relationship = "ExtendedFamily";
          else if (rawRel.includes("חבר")) relationship = "Friends";
          else if (rawRel.includes("עבודה")) relationship = "Work";
          else if (rawRel.includes("צבא")) relationship = "Army";
          else if (rawRel.includes("לימודים")) relationship = "Study";
        }

        // 6. זיהוי קבוצת גיל
        const rawAge = String(
          getSmartValue(item, ["גיל", "age", "קבוצת"]) || "Adults",
        ).trim();
        let ageGroup: Guest["ageGroup"] = "Adults";

        if (rawAge === "YoungAdults" || rawAge.includes("צעיר")) {
          ageGroup = "YoungAdults";
        } else if (rawAge === "Kids" || rawAge.includes("ילד")) {
          ageGroup = "Kids";
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: String(rawName).trim(),
          phone: String(rawPhone).trim(),
          expectedGuests: expectedGuests,
          side: side,
          relationship: relationship,
          ageGroup: ageGroup,
          status: "Pending", // <--- חזר ל-Pending לפי בקשתך!
        };
      });

      onImport(mappedGuests);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl border border-wedding-sand text-center shadow-sm">
        <h3 className="text-lg font-bold text-wedding-dark mb-2">
          רוצים להעלות רשימה מסודרת?
        </h3>
        <p className="text-sm text-stone-500 mb-4">
          הורידו את תבנית האקסל שלנו. היא מכילה רשימות בחירה מדויקות שיבטיחו
          שאלגוריתם ההושבה יעבוד בצורה מושלמת.
        </p>
        <a
          href="/guests_template.xlsx"
          download="תבנית_אורחים_חתונה.xlsx"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 hover:-translate-y-0.5 transition-all shadow-sm"
        >
          <DownloadIcon />
          הורדת קובץ אקסל
        </a>
      </div>

      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 hover:bg-wedding-sand/20 hover:border-wedding-brown transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl text-stone-400 group-hover:scale-110 transition-transform">
              📤
            </span>
            <span className="text-base font-bold text-stone-600 group-hover:text-wedding-dark">
              לחצו להעלאת האקסל המלא או גררו לכאן
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
