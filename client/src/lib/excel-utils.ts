import * as XLSX from "xlsx";
import type { ExcelTemplateRow } from "@shared/schema";

export interface ExcelValidationResult {
  success: boolean;
  data?: ExcelTemplateRow[];
  errors?: string[];
}

export function validateExcelData(file: File): Promise<ExcelValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve({ success: false, errors: ['No worksheets found in file'] });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          resolve({ success: false, errors: ['Worksheet is empty'] });
          return;
        }

        const validatedData: ExcelTemplateRow[] = [];
        const errors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            // Check required columns
            const requiredColumns = ['Nama', 'Pengalaman', 'Pendidikan', 'Wawancara', 'Usia'];
            const missingColumns = requiredColumns.filter(col => !(col in row));
            
            if (missingColumns.length > 0) {
              errors.push(`Row ${index + 2}: Missing columns: ${missingColumns.join(', ')}`);
              return;
            }

            // Validate data types and ranges
            const validatedRow: ExcelTemplateRow = {
              Nama: String(row.Nama).trim(),
              Pengalaman: Number(row.Pengalaman),
              Pendidikan: Number(row.Pendidikan),
              Wawancara: Number(row.Wawancara),
              Usia: Number(row.Usia),
            };

            // Validate ranges
            if (!validatedRow.Nama) {
              errors.push(`Row ${index + 2}: Name is required`);
            }
            if (isNaN(validatedRow.Pengalaman) || validatedRow.Pengalaman < 0) {
              errors.push(`Row ${index + 2}: Experience must be 0 or more years`);
            }
            if (isNaN(validatedRow.Pendidikan) || validatedRow.Pendidikan < 1 || validatedRow.Pendidikan > 5) {
              errors.push(`Row ${index + 2}: Education must be between 1-5`);
            }
            if (isNaN(validatedRow.Wawancara) || validatedRow.Wawancara < 0 || validatedRow.Wawancara > 100) {
              errors.push(`Row ${index + 2}: Interview score must be between 0-100`);
            }
            if (isNaN(validatedRow.Usia) || validatedRow.Usia < 18 || validatedRow.Usia > 65) {
              errors.push(`Row ${index + 2}: Age must be between 18-65`);
            }

            if (errors.length === 0) {
              validatedData.push(validatedRow);
            }
          } catch (error) {
            errors.push(`Row ${index + 2}: Invalid data format`);
          }
        });

        if (errors.length > 0) {
          resolve({ success: false, errors });
        } else {
          resolve({ success: true, data: validatedData });
        }
      } catch (error) {
        resolve({ success: false, errors: ['Failed to parse Excel file'] });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, errors: ['Failed to read file'] });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function generateTemplate(): ArrayBuffer {
  const templateData = [
    {
      Nama: "John Doe",
      Pengalaman: 5,
      Pendidikan: 4,
      Wawancara: 85,
      Usia: 30
    },
    {
      Nama: "Jane Smith",
      Pengalaman: 3,
      Pendidikan: 5,
      Wawancara: 92,
      Usia: 28
    }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 20 }, // Nama
    { width: 12 }, // Pengalaman
    { width: 12 }, // Pendidikan
    { width: 12 }, // Wawancara
    { width: 10 }  // Usia
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}
