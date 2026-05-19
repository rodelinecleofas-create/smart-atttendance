import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || 'noreply@smartattend.com';

function formatPlainText({ type, email, name, studentName, studentEmail, parentEmail, date, summaryData, resetLink, subject }) {
  switch (type) {
    case 'absent':
      return `Student: ${studentName}\nDate: ${date}\nMessage: This student was marked absent.\n`;
    case 'verification_reminder':
      return `Hello ${name || 'User'},\n\nPlease verify your account to continue using Smart Attend.\n`;
    case 'daily_summary':
      return `Daily attendance summary:\n${JSON.stringify(summaryData, null, 2)}\n`;
    case 'password_reset':
      return `To reset your password, click the following link:\n${resetLink}\n\nIf you did not request this, ignore this email.`;
    default:
      return `Notification:\nType: ${type}\nSubject: ${subject || 'Smart Attend Notification'}\n`;
  }
}

function formatHtml({ type, email, name, studentName, studentEmail, parentEmail, date, summaryData, resetLink, subject }) {
  switch (type) {
    case 'absent':
      return `<p><strong>Student:</strong> ${studentName}</p><p><strong>Date:</strong> ${date}</p><p>This student was marked absent.</p>`;
    case 'verification_reminder':
      return `<p>Hello ${name || 'User'},</p><p>Please verify your account to continue using Smart Attend.</p>`;
    case 'daily_summary':
      return `<h2>Daily Attendance Summary</h2><pre>${JSON.stringify(summaryData, null, 2)}</pre>`;
    case 'password_reset':
      return `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`;
    default:
      return `<p>Notification type: ${type}</p><p>Subject: ${subject || 'Smart Attend Notification'}</p>`;
  }
}

async function sendEmail(data) {
  const toAddresses = [];
  if (data.email) toAddresses.push(data.email);
  if (data.parentEmail) toAddresses.push(data.parentEmail);
  if (data.studentEmail) toAddresses.push(data.studentEmail);

  if (!toAddresses.length) {
    throw new Error('No recipient address was provided.');
  }

  const subject = data.subject || 'Smart Attend Notification';
  const text = formatPlainText(data);
  const html = formatHtml(data);

  if (smtpHost && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toAddresses.join(','),
      subject,
      text,
      html,
    });

    return { delivered: true, info };
  }

  console.log('SMTP not configured; email request logged instead of sent.', {
    to: toAddresses,
    subject,
    text,
    html,
  });

  return { delivered: false, info: 'SMTP configuration is missing; message logged only.' };
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { type, email, parentEmail, studentName, date, subject } = data;

    const result = await sendEmail(data);

    return NextResponse.json({
      success: true,
      message: result.delivered
        ? 'Email sent successfully.'
        : 'Email request logged. SMTP is not configured.',
      data: {
        type,
        email,
        parentEmail,
        studentName,
        date,
        subject,
        timestamp: new Date().toISOString(),
        deliveryInfo: result.info,
      },
    });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process email notification.', success: false },
      { status: 500 }
    );
  }
}
