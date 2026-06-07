import * as XLSX from "xlsx";
import { RoundingMode, Settings, SourceRow, VerificationRow, VerificationStatus } from "./types";

export const REQUIRED_COLUMNS = [
  "No.",
  "Last Name",
  "First Name",
  "Prelim",
  "Midterm",
  "Final Term",
  "Final Grade",
] as const;

export const SESSION_KEY = "grade-verifier-settings";

const TEMPLATE_FORMULAS = {
  default: "(Prelim * 0.25) + (Midterm * 0.25) + (FinalTerm * 0.50)",
  equalThirds: "(Prelim + Midterm + FinalTerm) / 3",
  finalHeavy: "(Prelim * 0.20) + (Midterm * 0.30) + (FinalTerm * 0.50)",
};

export function getFormulaTemplates() {
  return TEMPLATE_FORMULAS;
}

export function loadWorkbook(file: File): Promise<SourceRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          reject(new Error("Unable to read file."));
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
          defval: "",
          raw: false,
        });

        const normalizedRows = validateAndNormalizeRows(rows);
        resolve(normalizedRows);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Unable to parse spreadsheet."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to load file."));
    reader.readAsArrayBuffer(file);
  });
}

export function validateAndNormalizeRows(rows: Record<string, unknown>[]): SourceRow[] {
  if (rows.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const firstRow = rows[0];
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in firstRow));
  if (missing.length > 0) {
    throw new Error(
      "Invalid file format. The uploaded spreadsheet must contain the following columns: No., Last Name, First Name, Prelim, Midterm, Final Term, and Final Grade.",
    );
  }

  return rows.map((row, index) => {
    const normalized: SourceRow = {
      "No.": parseNumber(row["No."], index, "No."),
      "Last Name": parseText(row["Last Name"], index, "Last Name"),
      "First Name": parseText(row["First Name"], index, "First Name"),
      Prelim: parseNumber(row["Prelim"], index, "Prelim"),
      Midterm: parseNumber(row["Midterm"], index, "Midterm"),
      "Final Term": parseNumber(row["Final Term"], index, "Final Term"),
      "Final Grade": parseNumber(row["Final Grade"], index, "Final Grade"),
    };

    return normalized;
  });
}

function parseNumber(value: unknown, index: number, column: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Row ${index + 2}: "${column}" must be a number.`);
  }
  return parsed;
}

function parseText(value: unknown, index: number, column: string): string {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`Row ${index + 2}: "${column}" must not be empty.`);
  }
  return text;
}

export function verifyGrades(rows: SourceRow[], settings: Settings): VerificationRow[] {
  return rows.map((row) => {
    const rawGrade =
      settings.formulaMode === "percentage"
        ? row.Prelim * (settings.weights.prelim / 100) +
          row.Midterm * (settings.weights.midterm / 100) +
          row["Final Term"] * (settings.weights.finalTerm / 100)
        : evaluateCustomFormula(settings.customFormula, row);

    const computedGrade = applyRounding(rawGrade, settings.rounding);
    const difference = Number((computedGrade - row["Final Grade"]).toFixed(4));
    const status = getStatus(difference, settings.tolerance);

    return {
      ...row,
      studentName: `${row["Last Name"]}, ${row["First Name"]}`,
      computedGrade,
      difference,
      status,
    };
  });
}

function evaluateCustomFormula(formula: string, row: SourceRow): number {
  const safeFormula = formula.trim();
  if (!safeFormula) {
    throw new Error("Custom formula cannot be empty.");
  }

  const normalizedFormula = safeFormula.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, value: string) =>
    String(Number(value) / 100),
  );

  if (!/^[0-9+\-*/().\sA-Za-z_]+$/.test(normalizedFormula)) {
    throw new Error("Custom formula contains unsupported characters.");
  }

  const context: Record<string, number> = {
    Prelim: row.Prelim,
    Midterm: row.Midterm,
    FinalTerm: row["Final Term"],
    Final_Term: row["Final Term"],
    Final: row["Final Term"],
    FinalGrade: row["Final Grade"],
  };

  const expression = normalizedFormula.replace(/\b[A-Za-z_]+\b/g, (token) => {
    if (!(token in context)) {
      throw new Error(`Unknown field in custom formula: ${token}`);
    }
    return String(context[token]);
  });

  const result = Function(`"use strict"; return (${expression});`)();
  if (typeof result !== "number" || Number.isNaN(result) || !Number.isFinite(result)) {
    throw new Error("Custom formula did not produce a valid number.");
  }

  return result;
}

function applyRounding(value: number, mode: RoundingMode): number {
  if (mode === "none") {
    return Number(value.toFixed(4));
  }

  const decimals = Number(mode);
  return Number(value.toFixed(decimals));
}

function getStatus(difference: number, tolerance: number): VerificationStatus {
  const absoluteDifference = Math.abs(difference);
  if (absoluteDifference === 0) {
    return "Correct";
  }
  if (absoluteDifference <= tolerance) {
    return "Acceptable";
  }
  return "Incorrect";
}

export function getSummary(rows: VerificationRow[]) {
  const total = rows.length;
  const correct = rows.filter((row) => row.status === "Correct").length;
  const acceptable = rows.filter((row) => row.status === "Acceptable").length;
  const incorrect = rows.filter((row) => row.status === "Incorrect").length;
  const accuracy = total === 0 ? 0 : Math.round(((correct + acceptable) / total) * 100);

  return { total, correct, acceptable, incorrect, accuracy };
}

export function exportRows(rows: VerificationRow[], fileName: string, bookType: "xlsx" | "csv") {
  const exportData = rows.map((row) => ({
    "No.": row["No."],
    "Last Name": row["Last Name"],
    "First Name": row["First Name"],
    Prelim: row.Prelim,
    Midterm: row.Midterm,
    "Final Term": row["Final Term"],
    "Uploaded Final Grade": row["Final Grade"],
    "Computed Final Grade": row.computedGrade,
    Difference: row.difference,
    Status: row.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Verification");
  XLSX.writeFile(workbook, `${fileName}.${bookType}`, { bookType });
}

export function defaultSettings(): Settings {
  return {
    formulaMode: "percentage",
    weights: {
      prelim: 25,
      midterm: 25,
      finalTerm: 50,
    },
    customFormula: TEMPLATE_FORMULAS.default,
    rounding: "1",
    tolerance: 0,
    darkMode: false,
  };
}
