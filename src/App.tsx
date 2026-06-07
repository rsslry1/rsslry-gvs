import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  defaultSettings,
  exportRows,
  getFormulaTemplates,
  getSummary,
  loadWorkbook,
  SESSION_KEY,
  verifyGrades,
} from "./utils";
import { Settings, SourceRow, VerificationRow } from "./types";
import logo from "../rsslry-logo.png";

type SortKey = "studentName" | "computedGrade" | "difference" | "status";
type FilterMode = "all" | "correct" | "acceptable" | "incorrect";

const templates = getFormulaTemplates();

function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return defaultSettings();

    try {
      return { ...defaultSettings(), ...JSON.parse(saved) };
    } catch {
      return defaultSettings();
    }
  });
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [verificationRows, setVerificationRows] = useState<VerificationRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("studentName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings]);

  const summary = useMemo(() => getSummary(verificationRows), [verificationRows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const rows = verificationRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.studentName.toLowerCase().includes(normalizedSearch) ||
        String(row["No."]).includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "correct" && row.status === "Correct") ||
        (filter === "acceptable" && row.status === "Acceptable") ||
        (filter === "incorrect" && row.status === "Incorrect");

      return matchesSearch && matchesFilter;
    });

    return [...rows].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortDirection === "asc"
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [verificationRows, search, filter, sortKey, sortDirection]);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setIsProcessing(true);

    try {
      const rows = await loadWorkbook(file);
      setSourceRows(rows);
      setVerificationRows([]);
      setFileName(file.name.replace(/\.[^.]+$/, ""));
    } catch (uploadError) {
      setSourceRows([]);
      setVerificationRows([]);
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read file.");
    } finally {
      setIsProcessing(false);
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    void handleFile(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    void handleFile(file);
  }

  function runVerification() {
    setError("");

    const totalWeight =
      settings.weights.prelim + settings.weights.midterm + settings.weights.finalTerm;
    if (settings.formulaMode === "percentage" && totalWeight !== 100) {
      setError("Percentage weights must total exactly 100%.");
      return;
    }

    if (sourceRows.length === 0) {
      setError("Upload a spreadsheet before running verification.");
      return;
    }

    try {
      setVerificationRows(verifyGrades(sourceRows, settings));
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to verify grades.",
      );
    }
  }

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const totalWeight =
    settings.weights.prelim + settings.weights.midterm + settings.weights.finalTerm;

  return (
    <div className={settings.darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#f4f0e8] text-[#181716] transition-colors dark:bg-[#18181b] dark:text-[#f4efe5]">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(249,214,92,0.28),_transparent_26%),radial-gradient(circle_at_top_left,_rgba(255,255,255,0.66),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.28),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(249,214,92,0.12),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_60%)]">
          <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
            <header className="glass-panel grid gap-5 rounded-[2.25rem] p-6 md:grid-cols-[1.35fr_0.85fr]">
              <div>
               
                <div className="mt-5 flex items-center gap-4">
                  <img
                    src={logo}
                    alt="RSSLRY"
                    className="h-12 w-auto object-contain sm:h-14"
                  />
                  <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8c7234] dark:text-[#e2c56e]">
                    Grade Verification System
                  </p>
                </div>
                <h1 className="mt-5 font-display text-4xl leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                  Verify academic grades.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#625a51] dark:text-[#c9c1b6]">
                  Upload a spreadsheet, configure your grading logic, and audit every final grade
                  in one local, browser-based workspace.
                </p>
              </div>
              <div className="rounded-[2rem] border border-black/8 bg-[linear-gradient(135deg,_rgba(255,244,214,0.95),_rgba(255,255,255,0.55))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[linear-gradient(135deg,_rgba(51,48,44,0.95),_rgba(28,28,31,0.88))]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#73695d] dark:text-[#d0c7ba]">Session profile</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                      {settings.formulaMode === "percentage" ? "Weighted Formula" : "Custom Formula"}
                    </p>
                    <p className="mt-2 text-sm text-[#73695d] dark:text-[#d0c7ba]">
                      Auto-saved in this tab while you review records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({ ...current, darkMode: !current.darkMode }))
                    }
                    className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-[#2a2927] transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-[#f3ede4] dark:hover:bg-white/15"
                  >
                    {settings.darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <HeroMetric label="Total Records" value={summary.total} />
                  <HeroMetric label="Accuracy" value={`${summary.accuracy}%`} />
                  <HeroMetric label="Incorrect" value={summary.incorrect} />
                  <HeroMetric label="Tolerance" value={settings.tolerance.toFixed(2)} />
                </div>
              </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <article className="glass-panel rounded-[2.15rem] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-label">Upload Page</p>
                    <h2 className="section-title">Import academic records</h2>
                  </div>
                  <div className="rounded-full border border-black/10 bg-white/50 px-4 py-2 text-xs text-[#6c645a] dark:border-white/10 dark:bg-white/5 dark:text-[#d6cec1]">
                    XLSX, XLS, CSV
                  </div>
                </div>

                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  className={`mt-5 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[1.9rem] border px-6 py-10 text-center transition ${
                    dragActive
                      ? "border-[#f1ca57] bg-[rgba(255,245,214,0.9)] dark:bg-[rgba(241,202,87,0.08)]"
                      : "border-black/10 bg-white/48 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={onFileInput}
                  />
                  <div className="max-w-md">
                    <p className="text-xl font-semibold tracking-[-0.03em]">
                      Drop your spreadsheet here
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#625a51] dark:text-[#c9c1b6]">
                      Required columns: No., Last Name, First Name, Prelim, Midterm, Final Term,
                      and Final Grade.
                    </p>
                    <span className="mt-6 inline-flex rounded-full bg-[#2d2a29] px-5 py-3 text-sm text-white shadow-sm dark:bg-[#f1ca57] dark:text-[#171614]">
                      Choose File
                    </span>
                    <p className="mt-4 text-sm text-[#7d7468] dark:text-[#afa79a]">
                      {isProcessing
                        ? "Reading file..."
                        : fileName
                          ? `Loaded: ${fileName}`
                          : "No file selected yet"}
                    </p>
                  </div>
                </label>

                {error ? (
                  <div className="mt-4 rounded-[1.6rem] border border-[#efc0bb] bg-[#fff2f0]/85 px-4 py-3 text-sm text-[#8a3b2e] dark:border-[#5f2d28] dark:bg-[#2b1817] dark:text-[#f3beb6]">
                    {error}
                  </div>
                ) : null}

                <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-black/8 bg-white/55 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between border-b border-black/8 bg-white/45 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <h3 className="font-semibold tracking-[-0.02em]">Data preview</h3>
                    <p className="text-sm text-[#776f65] dark:text-[#bbb3a7]">
                      {sourceRows.length} records
                    </p>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-[#f7f2ea]/90 backdrop-blur dark:bg-[#1f1f22]/90">
                        <tr className="text-left">
                          {[
                            "No.",
                            "Last Name",
                            "First Name",
                            "Prelim",
                            "Midterm",
                            "Final Term",
                            "Final Grade",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 font-medium text-[#70685d] dark:text-[#c6bfb2]"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sourceRows.slice(0, 8).map((row) => (
                          <tr
                            key={`${row["No."]}-${row["Last Name"]}`}
                            className="border-t border-black/6 dark:border-white/6"
                          >
                            <td className="px-4 py-3">{row["No."]}</td>
                            <td className="px-4 py-3">{row["Last Name"]}</td>
                            <td className="px-4 py-3">{row["First Name"]}</td>
                            <td className="px-4 py-3">{row.Prelim}</td>
                            <td className="px-4 py-3">{row.Midterm}</td>
                            <td className="px-4 py-3">{row["Final Term"]}</td>
                            <td className="px-4 py-3">{row["Final Grade"]}</td>
                          </tr>
                        ))}
                        {sourceRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-[#7d7468] dark:text-[#afa79a]"
                            >
                              Your spreadsheet preview will appear here after upload.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article className="glass-panel rounded-[2.15rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Formula Configuration</p>
                    <h2 className="section-title">Set the verification rule</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(defaultSettings())}
                    className="rounded-full border border-black/10 bg-white/55 px-4 py-2 text-sm text-[#403a33] transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#e4ddd3] dark:hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({ ...current, formulaMode: "percentage" }))
                    }
                    className={`rounded-[1.6rem] border px-5 py-4 text-left transition ${
                      settings.formulaMode === "percentage"
                        ? "border-[#f1ca57] bg-[rgba(255,244,214,0.92)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[rgba(241,202,87,0.12)]"
                        : "border-black/8 bg-white/38 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <p className="font-semibold tracking-[-0.02em]">Percentage-Based</p>
                    <p className="mt-2 text-sm text-[#665f56] dark:text-[#c7c0b4]">
                      Define weights for prelim, midterm, and final term.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((current) => ({ ...current, formulaMode: "custom" }))}
                    className={`rounded-[1.6rem] border px-5 py-4 text-left transition ${
                      settings.formulaMode === "custom"
                        ? "border-[#f1ca57] bg-[rgba(255,244,214,0.92)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[rgba(241,202,87,0.12)]"
                        : "border-black/8 bg-white/38 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <p className="font-semibold tracking-[-0.02em]">Custom Formula</p>
                    <p className="mt-2 text-sm text-[#665f56] dark:text-[#c7c0b4]">
                      Use variables: Prelim, Midterm, FinalTerm, FinalGrade.
                    </p>
                  </button>
                </div>

                {settings.formulaMode === "percentage" ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      ["Prelim", "prelim"],
                      ["Midterm", "midterm"],
                      ["Final Term", "finalTerm"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className="rounded-[1.6rem] border border-black/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="text-sm text-[#70685d] dark:text-[#c6bfb2]">{label}</span>
                        <input
                          type="number"
                          value={settings.weights[key as keyof Settings["weights"]]}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              weights: {
                                ...current.weights,
                                [key]: Number(event.target.value),
                              },
                            }))
                          }
                          className="mt-2 w-full rounded-[1.1rem] border border-black/8 bg-white/75 px-4 py-3 text-lg outline-none transition focus:border-[#f1ca57] dark:border-white/10 dark:bg-[#212124]"
                        />
                      </label>
                    ))}
                    <div className="sm:col-span-3 rounded-[1.6rem] border border-black/8 bg-[rgba(255,244,214,0.82)] px-4 py-3 text-sm dark:border-white/10 dark:bg-[rgba(241,202,87,0.12)]">
                      Total Weight: <span className="font-semibold">{totalWeight}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Object.entries(templates).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setSettings((current) => ({ ...current, customFormula: value }))
                          }
                          className="rounded-[1.25rem] border border-black/8 bg-white/42 px-4 py-3 text-left text-sm transition hover:border-[#f1ca57] dark:border-white/10 dark:bg-white/5"
                        >
                          <p className="font-semibold capitalize tracking-[-0.02em]">{key}</p>
                          <p className="mt-2 text-[#70685d] dark:text-[#c6bfb2]">{value}</p>
                        </button>
                      ))}
                    </div>
                    <label className="block">
                      <span className="text-sm text-[#70685d] dark:text-[#c6bfb2]">
                        Formula editor
                      </span>
                      <textarea
                        rows={5}
                        value={settings.customFormula}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, customFormula: event.target.value }))
                        }
                        className="mt-2 w-full rounded-[1.6rem] border border-black/8 bg-white/48 px-4 py-3 font-mono text-sm outline-none transition focus:border-[#f1ca57] dark:border-white/10 dark:bg-white/5"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="rounded-[1.6rem] border border-black/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/5">
                    <span className="text-sm text-[#70685d] dark:text-[#c6bfb2]">Rounding</span>
                    <select
                      value={settings.rounding}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          rounding: event.target.value as Settings["rounding"],
                        }))
                      }
                      className="mt-2 w-full rounded-[1.1rem] border border-black/8 bg-white/75 px-4 py-3 outline-none focus:border-[#f1ca57] dark:border-white/10 dark:bg-[#212124]"
                    >
                      <option value="none">No Rounding</option>
                      <option value="1">Round to 1 Decimal Place</option>
                      <option value="2">Round to 2 Decimal Places</option>
                    </select>
                  </label>

                  <label className="rounded-[1.6rem] border border-black/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/5">
                    <span className="text-sm text-[#70685d] dark:text-[#c6bfb2]">Tolerance</span>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.tolerance}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          tolerance: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-[1.1rem] border border-black/8 bg-white/75 px-4 py-3 outline-none transition focus:border-[#f1ca57] dark:border-white/10 dark:bg-[#212124]"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={runVerification}
                  className="mt-6 w-full rounded-[1.3rem] bg-[#2d2a29] px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:brightness-105 dark:bg-[#f1ca57] dark:text-[#171614]"
                >
                  Run Verification
                </button>
              </article>
            </section>

            <section className="glass-panel rounded-[2.15rem] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-label">Results Page</p>
                  <h2 className="section-title">Verification summary and results</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    disabled={verificationRows.length === 0}
                    onClick={() =>
                      exportRows(
                        verificationRows,
                        `${fileName || "verification"}-corrected`,
                        "xlsx",
                      )
                    }
                  >
                    Download XLSX
                  </ActionButton>
                  <ActionButton
                    disabled={verificationRows.length === 0}
                    onClick={() =>
                      exportRows(
                        verificationRows,
                        `${fileName || "verification"}-corrected`,
                        "csv",
                      )
                    }
                  >
                    Download CSV
                  </ActionButton>
                  <ActionButton
                    disabled={verificationRows.length === 0}
                    onClick={() =>
                      exportRows(
                        verificationRows.filter((row) => row.status !== "Correct"),
                        `${fileName || "verification"}-errors`,
                        "csv",
                      )
                    }
                  >
                    Error Report
                  </ActionButton>
                  <ActionButton
                    disabled={verificationRows.length === 0}
                    onClick={() =>
                      exportRows(
                        verificationRows.filter((row) => row.status !== "Correct"),
                        `${fileName || "verification"}-errors`,
                        "xlsx",
                      )
                    }
                  >
                    Error Report XLSX
                  </ActionButton>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Total Records" value={summary.total} accent="dark" />
                <SummaryCard label="Correct" value={summary.correct} accent="soft" />
                <SummaryCard label="Incorrect" value={summary.incorrect} accent="error" />
                <SummaryCard label="Accuracy" value={`${summary.accuracy}%`} accent="gold" />
              </div>

              <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <input
                  type="search"
                  placeholder="Search by student name or number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-[1.25rem] border border-black/8 bg-white/52 px-4 py-3 outline-none focus:border-[#f1ca57] dark:border-white/10 dark:bg-white/5"
                />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as FilterMode)}
                  className="rounded-[1.25rem] border border-black/8 bg-white/52 px-4 py-3 outline-none focus:border-[#f1ca57] dark:border-white/10 dark:bg-white/5"
                >
                  <option value="all">All Statuses</option>
                  <option value="correct">Correct</option>
                  <option value="acceptable">Acceptable</option>
                  <option value="incorrect">Incorrect</option>
                </select>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-black/8 bg-white/50 dark:border-white/10 dark:bg-white/5">
                <div className="max-h-[34rem] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-[#f7f2ea]/92 backdrop-blur dark:bg-[#1f1f22]/92">
                      <tr className="text-left">
                        <th className="px-4 py-3">Student</th>
                        <HeaderButton label="Computed Grade" onClick={() => updateSort("computedGrade")} />
                        <th className="px-4 py-3">Recorded Grade</th>
                        <HeaderButton label="Difference" onClick={() => updateSort("difference")} />
                        <HeaderButton label="Status" onClick={() => updateSort("status")} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={`${row["No."]}-${row.studentName}`}
                          className={`border-t ${
                            row.status === "Incorrect"
                              ? "border-[#f1c7c2] bg-[#fff4f2]/80 dark:border-[#5f2d28] dark:bg-[#2a1918]"
                              : row.status === "Acceptable"
                                ? "border-[#efdca0] bg-[#fff7de]/80 dark:border-[#68561f] dark:bg-[#2a2617]"
                                : "border-[#d6e7db] bg-[#f3faf4]/80 dark:border-[#29473c] dark:bg-[#18231f]"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium tracking-[-0.02em]">{row.studentName}</p>
                            <p className="text-xs text-[#7d7468] dark:text-[#afa79a]">
                              No. {row["No."]}
                            </p>
                          </td>
                          <td className="px-4 py-3">{row.computedGrade}</td>
                          <td className="px-4 py-3">{row["Final Grade"]}</td>
                          <td className="px-4 py-3">{row.difference}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                row.status === "Incorrect"
                                  ? "bg-[#f9ddd8] text-[#8a3b2e] dark:bg-[#482420] dark:text-[#f5beb6]"
                                  : row.status === "Acceptable"
                                    ? "bg-[#f8ebb9] text-[#8c6d14] dark:bg-[#4a3b16] dark:text-[#f2d87c]"
                                    : "bg-[#dfefe4] text-[#28574b] dark:bg-[#1f3a31] dark:text-[#a8d6c4]"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-[#7d7468] dark:text-[#afa79a]"
                          >
                            Run verification to populate the results table.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[1.3rem] border border-black/8 bg-white/48 px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.16em] text-[#756c61] dark:text-[#c7c0b4]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "dark" | "soft" | "error" | "gold";
}) {
  const tones = {
    dark: "bg-[#2d2a29] text-white dark:bg-[#242428]",
    soft: "bg-[rgba(255,255,255,0.52)] text-[#181716] dark:bg-white/6 dark:text-[#f4efe5]",
    error: "bg-[rgba(255,239,237,0.92)] text-[#8a3b2e] dark:bg-[#2a1918] dark:text-[#f3beb6]",
    gold: "bg-[rgba(255,244,214,0.95)] text-[#3a3124] dark:bg-[rgba(241,202,87,0.14)] dark:text-[#f3d98b]",
  };

  return (
    <div className={`rounded-[1.75rem] border border-black/8 p-5 dark:border-white/10 ${tones[accent]}`}>
      <p className="text-sm uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/8 bg-white/58 px-5 py-3 text-sm text-[#38342f] transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/6 dark:text-[#ece6dc] dark:enabled:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function HeaderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="font-medium text-[#5e564d] transition hover:text-[#1e1b18] dark:text-[#d0c8bc] dark:hover:text-[#f3ede4]"
      >
        {label}
      </button>
    </th>
  );
}

export default App;
