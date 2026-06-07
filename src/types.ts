export type SourceRow = {
  "No.": number;
  "Last Name": string;
  "First Name": string;
  Prelim: number;
  Midterm: number;
  "Final Term": number;
  "Final Grade": number;
};

export type VerificationStatus = "Correct" | "Incorrect" | "Acceptable";

export type VerificationRow = SourceRow & {
  studentName: string;
  computedGrade: number;
  difference: number;
  status: VerificationStatus;
};

export type FormulaMode = "percentage" | "custom";

export type RoundingMode = "none" | "1" | "2";

export type Settings = {
  formulaMode: FormulaMode;
  weights: {
    prelim: number;
    midterm: number;
    finalTerm: number;
  };
  customFormula: string;
  rounding: RoundingMode;
  tolerance: number;
  darkMode: boolean;
};
