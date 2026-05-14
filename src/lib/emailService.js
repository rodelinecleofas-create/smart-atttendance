export async function sendEmailNotification(emailData) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendAbsentNotification(studentName, studentEmail, parentEmail, date) {
  return sendEmailNotification({
    type: 'absent',
    studentName,
    studentEmail,
    parentEmail,
    date,
    subject: `Attendance Alert: ${studentName} was absent on ${date}`,
  });
}

export async function sendVerificationReminder(email, name) {
  return sendEmailNotification({
    type: 'verification_reminder',
    email,
    name,
    subject: 'Verify Your Smart Attend Account',
  });
}

export async function sendDailyAttendanceSummary(email, summaryData) {
  return sendEmailNotification({
    type: 'daily_summary',
    email,
    summaryData,
    subject: `Daily Attendance Summary - ${new Date().toLocaleDateString()}`,
  });
}

export async function sendPasswordResetEmail(email, resetLink) {
  return sendEmailNotification({
    type: 'password_reset',
    email,
    resetLink,
    subject: 'Reset Your Smart Attend Password',
  });
}
