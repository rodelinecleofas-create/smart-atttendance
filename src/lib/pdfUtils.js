import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPDF(elementId, filename) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

export function generateReportPDF(reportData, reportType) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.text(`Smart Attend - ${reportType} Report`, pageWidth / 2, yPosition, { align: 'center' });

  // Date
  yPosition += 15;
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);

  // Content based on report type
  yPosition += 15;

  if (reportType === 'Attendance Summary') {
    yPosition = addAttendanceSummaryContent(doc, reportData, yPosition, pageWidth);
  } else if (reportType === 'Student Report') {
    yPosition = addStudentReportContent(doc, reportData, yPosition, pageWidth);
  } else if (reportType === 'Class Report') {
    yPosition = addClassReportContent(doc, reportData, yPosition, pageWidth);
  }

  return doc;
}

function addAttendanceSummaryContent(doc, data, startY, pageWidth) {
  let yPos = startY;
  doc.setFontSize(12);
  doc.text('Summary Statistics', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  const stats = data.stats || {};
  const summaryLines = [
    `Total Students: ${data.totalStudents || 0}`,
    `Total Present: ${stats.present || 0}`,
    `Total Absent: ${stats.absent || 0}`,
    `Average Attendance: ${data.averageAttendance || 0}%`,
  ];

  summaryLines.forEach((line) => {
    doc.text(line, 20, yPos);
    yPos += 7;
  });

  return yPos;
}

function addStudentReportContent(doc, data, startY, pageWidth) {
  let yPos = startY;
  doc.setFontSize(12);
  doc.text(`Student: ${data.studentName}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  const details = [
    `Student ID: ${data.studentId}`,
    `Class: ${data.class}`,
    `Section: ${data.section}`,
    `Total Days: ${data.totalDays}`,
    `Present Days: ${data.presentDays}`,
    `Absent Days: ${data.absentDays}`,
    `Attendance %: ${data.attendancePercentage}%`,
  ];

  details.forEach((detail) => {
    doc.text(detail, 20, yPos);
    yPos += 7;
  });

  return yPos;
}

function addClassReportContent(doc, data, startY, pageWidth) {
  let yPos = startY;
  doc.setFontSize(12);
  doc.text(`Class Report: ${data.className}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Total Students: ${data.totalStudents}`, 20, yPos);
  yPos += 7;
  doc.text(`Average Attendance: ${data.averageAttendance}%`, 20, yPos);
  yPos += 10;

  // Table
  doc.setFontSize(9);
  doc.text('Student Name', 20, yPos);
  doc.text('Attendance %', 120, yPos);
  doc.text('Status', 160, yPos);
  yPos += 7;

  (data.students || []).slice(0, 10).forEach((student) => {
    doc.text(student.name, 20, yPos);
    doc.text(`${student.percentage}%`, 120, yPos);
    doc.text(student.status, 160, yPos);
    yPos += 7;
  });

  return yPos;
}
