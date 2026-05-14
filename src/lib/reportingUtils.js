export function calculateAttendancePercentage(totalDays, presentDays) {
  if (totalDays === 0) return 0;
  return ((presentDays / totalDays) * 100).toFixed(2);
}

export function calculateAttendanceStats(records) {
  const stats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    sick: 0,
    permission: 0,
    leave: 0,
    total: records.length,
  };

  records.forEach((record) => {
    if (stats.hasOwnProperty(record.status)) {
      stats[record.status]++;
    }
  });

  return stats;
}

export function getWeeklyAttendanceData(records) {
  const weeklyData = {};
  const today = new Date();

  records.forEach((record) => {
    const recordDate = new Date(record.date.seconds * 1000 || record.date);
    const daysAgo = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

    if (daysAgo < 7) {
      const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = { present: 0, absent: 0, late: 0, excused: 0, sick: 0, permission: 0, leave: 0 };
      }
      if (weeklyData[dayName].hasOwnProperty(record.status)) {
        weeklyData[dayName][record.status]++;
      }
    }
  });

  return Object.entries(weeklyData).map(([day, data]) => ({
    day,
    ...data,
  }));
}

export function getMonthlyAttendanceData(records) {
  const monthlyData = {};
  const today = new Date();

  records.forEach((record) => {
    const recordDate = new Date(record.date.seconds * 1000 || record.date);
    const daysAgo = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

    if (daysAgo < 30) {
      const dayOfMonth = recordDate.getDate();
      if (!monthlyData[dayOfMonth]) {
        monthlyData[dayOfMonth] = { present: 0, absent: 0, late: 0, excused: 0, sick: 0, permission: 0, leave: 0 };
      }
      if (monthlyData[dayOfMonth].hasOwnProperty(record.status)) {
        monthlyData[dayOfMonth][record.status]++;
      }
    }
  });

  return Object.entries(monthlyData)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([day, data]) => ({
      day: parseInt(day),
      ...data,
    }));
}

export function getStudentAttendanceTrends(records, studentId) {
  return records
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((record, index) => ({
      ...record,
      index,
      date: new Date(record.date.seconds * 1000 || record.date).toLocaleDateString(),
    }));
}

export function generateAttendanceSummaryReport(students, records) {
  return students.map((student) => {
    const studentRecords = records.filter((r) => r.studentId === student.id);
    const presentCount = studentRecords.filter((r) => r.status === 'present').length;
    const totalDays = studentRecords.length;
    const percentage = calculateAttendancePercentage(totalDays, presentCount);

    return {
      studentId: student.studentId,
      studentName: student.name,
      class: student.class,
      section: student.section,
      totalDays,
      presentDays: presentCount,
      absentDays: studentRecords.filter((r) => r.status === 'absent').length,
      percentage,
      status: percentage >= 75 ? 'Good' : 'At Risk',
    };
  });
}
