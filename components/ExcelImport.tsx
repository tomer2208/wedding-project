"use client";

import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { Guest } from "@/types/guest";

interface ExcelImportProps {
  onImport: (guests: Guest[]) => void;
}

export const ExcelImport = ({ onImport }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- פונקציית זיהוי חכמה לכותרות משתנות ---
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
        let rawPhone =
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

        // 4. זיהוי צד חתן/כלה/משותף
        const rawSide = String(
          getSmartValue(item, ["צד", "side"]) || "",
        ).trim();
        let side: Guest["side"] = "Joint"; // ברירת מחדל
        if (
          rawSide.includes("חתן") ||
          rawSide.toLowerCase().includes("groom")
        ) {
          side = "Groom";
        } else if (
          rawSide.includes("כלה") ||
          rawSide.toLowerCase().includes("bride")
        ) {
          side = "Bride";
        }

        // 5. זיהוי קשר (משפחה/חברים/עבודה/צבא)
        const rawRel = String(
          getSmartValue(item, [
            "קשר",
            "קרבה",
            "סוג",
            "relationship",
            "relation",
          ]) || "",
        ).trim();
        let relationship: Guest["relationship"] = "Other"; // ברירת מחדל
        if (
          rawRel.includes("משפחה") ||
          rawRel.toLowerCase().includes("family")
        ) {
          relationship = "Family";
        } else if (
          rawRel.includes("חבר") ||
          rawRel.toLowerCase().includes("friend")
        ) {
          relationship = "Friends";
        } else if (
          rawRel.includes("עבודה") ||
          rawRel.toLowerCase().includes("work")
        ) {
          relationship = "Work";
        } else if (
          rawRel.includes("צבא") ||
          rawRel.toLowerCase().includes("army")
        ) {
          relationship = "Army";
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: String(rawName).trim(),
          phone: String(rawPhone).trim(),
          expectedGuests: expectedGuests,
          side: side,
          relationship: relationship,
          ageGroup: "Adult",
          status: "Pending",
        };
      });

      onImport(mappedGuests);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="group flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 hover:bg-stone-100 hover:border-stone-400 transition-all duration-300"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl text-stone-400 group-hover:scale-110 transition-transform">
            📄
          </span>
          <span className="text-sm font-medium text-stone-600">
            לחצו להעלאת אקסל או גררו לכאן
          </span>
          <span className="text-xs text-stone-400">CSV, XLSX עד 5MB</span>
        </div>
      </button>
    </div>
  );
};
