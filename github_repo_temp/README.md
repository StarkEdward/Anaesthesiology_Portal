# Anaesthesia Department Portal

A comprehensive portal for managing the Anaesthesia Department operations. This application includes modules for attendance tracking, leave management, NMC form generation (Form B & Declaration Forms), and departmental inventory management.

## Features

- **Attendance System**: Track attendance for Doctors and Residents independently.
- **NMC Forms Generator**: Digitally fill and export high-quality printable PDFs for NMC Declaration Forms and NMC Form B.
- **Leave Management**: Apply for leaves, track official leave letters, and maintain leave history.
- **PAC System**: Pre-Anaesthesia Checkup forms and patient assessment tools.
- **Inventory & Library**: Manage department resources, equipment, and medical literature.
- **Reporting**: Generate analytical reports based on attendance and department data.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## Technologies Used
- React (TypeScript)
- Tailwind CSS
- Firebase (Firestore)
- jsPDF & html-to-image (For PDF generation)
- Lucide React (Icons)
