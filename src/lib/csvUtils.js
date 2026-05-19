import Papa from 'papaparse';

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
}

export function validateStudentCSV(data) {
  const requiredFields = ['studentId', 'name'];
  const errors = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because of header and 1-based indexing
    
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${rowNum}: Missing required field "${field}"`);
      }
    });

    if (row.email && !isValidEmail(row.email)) {
      errors.push(`Row ${rowNum}: Invalid email format "${row.email}"`);
    }

    if (row.phone && !isValidPhone(row.phone)) {
      errors.push(`Row ${rowNum}: Invalid phone format "${row.phone}"`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
  return /^\d{7,}$/.test(phone.replace(/\D/g, ''));
}

export function convertStudentDataForImport(csvData) {
  return csvData.map((row) => ({
    studentId: row.studentId.trim(),
    name: row.name.trim(),
    email: row.email?.trim() || '',
    phone: row.phone?.trim() || '',
    class: row.class?.trim() || '',
    section: row.section?.trim() || '',
    gender: row.gender?.trim() || '',
    parentName: row.parentName?.trim() || '',
    parentPhone: row.parentPhone?.trim() || '',
    parentEmail: row.parentEmail?.trim() || '',
  }));
}

export function generateCSVFromStudents(students) {
  const headers = [
    'studentId',
    'name',
    'email',
    'phone',
    'class',
    'section',
    'gender',
    'parentName',
    'parentPhone',
    'parentEmail',
  ];

  const data = students.map((student) => [
    student.studentId || '',
    student.name || '',
    student.email || '',
    student.phone || '',
    student.class || '',
    student.section || '',
    student.gender || '',
    student.parentName || '',
    student.parentPhone || '',
    student.parentEmail || '',
  ]);

  return Papa.unparse({ fields: headers, data });
}

export function generateAttendanceCSV(records) {
  const headers = ['studentId', 'studentName', 'date', 'session', 'status'];
  
  const data = records.map((record) => [
    record.studentId || '',
    record.studentName || '',
    record.date || '',
    record.classPeriod || '',
    record.status || '',
  ]);

  return Papa.unparse({ fields: headers, data });
}

export function downloadCSV(csvContent, filename) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
