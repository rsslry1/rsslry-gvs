# Grade Verification Web Application - Project Specification

Create a modern, responsive web application called **Grade Verification System** that allows instructors, faculty members, and academic staff to verify grade computations from uploaded Excel or CSV files.

## Project Objective

The application should enable users to upload a spreadsheet containing student grades, define their own grading formula or percentage weights, automatically verify all grade calculations, identify discrepancies, and download the verification results.

The system must not require user accounts, authentication, or a database. All processing should occur locally in the browser.

---

## Core Features

### 1. File Upload

Support the following file formats:

* XLSX
* XLS
* CSV

Requirements:

* Drag-and-drop upload area
* File picker button
* Display uploaded filename
* Preview imported data in a table

---

### 2. Automatic Column Detection

After uploading a file:

* Detect available columns
* Allow users to manually map columns

Example:

| Required Field | Selected Column |
| -------------- | --------------- |
| Prelim         | Prelim          |
| Midterm        | Midterm         |
| Final          | Final           |
| Final Grade    | Final R         |

---

### 3. Flexible Formula Configuration

Provide two modes:

#### Percentage-Based Mode

Example:

* Prelim = 25%
* Midterm = 25%
* Final = 50%

Validation:

* Total must equal 100%

#### Custom Formula Mode

Users can define formulas such as:

(Prelim * 0.25) + (Midterm * 0.25) + (Final * 0.50)

or

(Quiz * 0.20) + (Project * 0.30) + (Exam * 0.50)

---

### 4. Rounding Configuration

Allow users to choose:

* No Rounding
* Round to 1 Decimal Place
* Round to 2 Decimal Places

---

### 5. Grade Verification Engine

For every record:

1. Calculate the expected grade.
2. Compare it with the grade in the spreadsheet.
3. Compute the difference.
4. Determine if the grade is correct.

Example Output:

| Student  | Recorded Grade | Computed Grade | Difference | Status    |
| -------- | -------------- | -------------- | ---------- | --------- |
| John Doe | 2.2            | 2.3            | 0.1        | Incorrect |
| Jane Doe | 1.9            | 1.9            | 0.0        | Correct   |

---

### 6. Tolerance Setting

Allow users to define acceptable variance.

Examples:

Tolerance = 0.00

* 2.2 vs 2.3 = Incorrect

Tolerance = 0.10

* 2.2 vs 2.3 = Acceptable

---

### 7. Verification Summary Dashboard

Display:

* Total Records
* Correct Calculations
* Incorrect Calculations
* Verification Accuracy (%)

Example:

Total Records: 100

Correct: 92

Incorrect: 8

Accuracy: 92%

---

### 8. Results Table

Display:

* Student Name
* Original Grade
* Computed Grade
* Difference
* Verification Status

Features:

* Search
* Sort
* Filter by Correct/Incorrect

---

### 9. Download Results

Allow exporting:

#### Corrected Excel File

Additional columns:

* Computed Grade
* Difference
* Verification Status

#### Error Report

Contains only records with discrepancies.

Supported formats:

* XLSX
* CSV

---

### 10. User Interface Requirements

Design Style:

* Modern
* Clean
* Academic/Professional

Pages:

#### Upload Page

* File Upload
* Column Mapping

#### Formula Configuration Page

* Percentage Settings
* Formula Builder
* Rounding Options

#### Results Page

* Summary Cards
* Verification Table
* Export Buttons

---

## Technical Requirements

### Frontend

* React
* TypeScript
* Tailwind CSS
* SheetJS (xlsx)

### Processing

All calculations must be performed client-side.

No backend required.

No database required.

No authentication required.

---

## Verification Logic

Example Formula:

Final Grade = (Prelim × 25%) + (Midterm × 25%) + (Final × 50%)

Example:

Prelim = 1.5

Midterm = 2.0

Final = 2.7

Computed Grade:

(1.5 × 0.25) + (2.0 × 0.25) + (2.7 × 0.50)

= 2.225

Rounded to 1 decimal place

= 2.2

Compare with recorded grade and determine status.

---

## Additional Features

* Dark Mode
* Mobile Responsive Design
* Formula Templates
* Auto-save settings during session
* Download corrected spreadsheet
* Highlight incorrect grades in red
* Highlight correct grades in green

---

## Expected Outcome

The application should provide a fast and accurate way for educators to verify grade computations from spreadsheets without requiring a server, database, or user accounts.


## Required Spreadsheet Format

The uploaded file must contain the following columns in order:

| Column      | Description                  |
| ----------- | ---------------------------- |
| No.         | Student Number or Row Number |
| Last Name   | Student's Last Name          |
| First Name  | Student's First Name         |
| Prelim      | Prelim Grade                 |
| Midterm     | Midterm Grade                |
| Final Term  | Final Term Grade             |
| Final Grade | Recorded Final Grade         |

### Example

| No. | Last Name | First Name  | Prelim | Midterm | Final Term | Final Grade |
| --- | --------- | ----------- | ------ | ------- | ---------- | ----------- |
| 1   | Anasco    | Shielou May | 1.5    | 2.2     | 2.7        | 2.2         |
| 2   | Apare     | Daryl       | 4.3    | 3.7     | 3.2        | 3.6         |
| 3   | Bantaya   | John Lester | 2.9    | 3.0     | 2.9        | 2.9         |

### Validation Rules

Before processing, the system must verify that all required columns exist:

* No.
* Last Name
* First Name
* Prelim
* Midterm
* Final Term
* Final Grade

If any column is missing, display an error message:

"Invalid file format. The uploaded spreadsheet must contain the following columns: No., Last Name, First Name, Prelim, Midterm, Final Term, and Final Grade."

### Accepted Data Types

| Column      | Data Type |
| ----------- | --------- |
| No.         | Number    |
| Last Name   | Text      |
| First Name  | Text      |
| Prelim      | Number    |
| Midterm     | Number    |
| Final Term  | Number    |
| Final Grade | Number    |

### Verification Process

For each row:

1. Read the Prelim grade.
2. Read the Midterm grade.
3. Read the Final Term grade.
4. Compute the expected Final Grade using the user-defined formula.
5. Compare the computed grade with the uploaded Final Grade.
6. Calculate the difference.
7. Mark the row as:

   * Correct
   * Incorrect

### Output Columns

The downloaded verification file must include:

| No. | Last Name | First Name | Prelim | Midterm | Final Term | Uploaded Final Grade | Computed Final Grade | Difference | Status |
| --- | --------- | ---------- | ------ | ------- | ---------- | -------------------- | -------------------- | ---------- | ------ |

### Color Coding

* Green = Correct
* Red = Incorrect

### Summary Report

Display:

* Total Records
* Correct Records
* Incorrect Records
* Verification Accuracy (%)

### Important

The application must only process files that follow the required column structure. Automatic column mapping is not needed because all uploaded files are expected to use the standard academic format.
