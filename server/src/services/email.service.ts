import nodemailer from 'nodemailer';

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Keep a singleton for quick sends but recreate if needed
const transporter = createTransporter();

const HEADER = `
  <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px;border-radius:8px 8px 0 0;">
    <h2 style="color:white;margin:0;">PCG Personnel Management System</h2>
  </div>`;

const FOOTER = `
  <p style="color:#6b7280;font-size:0.875rem;margin-top:32px;">
    This is an automated notification from the PCG Personnel Management System.
  </p>`;

export const sendNeuroScheduleEmail = async (
  recipientEmail: string,
  recipientName: string,
  scheduleDate: string,
  scheduleTime?: string
): Promise<void> => {
  const formatted = new Date(scheduleDate).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeDisplay = scheduleTime ?? '0800H';

  await transporter.sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: 'Neuro Exam Schedule Notification',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Your <strong>Neuro Exam</strong> has been scheduled.</p>
          <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#1d4ed8;">📅 ${formatted}</p>
            <p style="margin:8px 0 0;font-size:16px;color:#1d4ed8;">🕗 ${timeDisplay}</p>
          </div>
          <p>Please make sure to report on time. Contact your unit's medical officer for further details.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};

export const sendProfileApprovedEmail = async (
  recipientEmail: string,
  recipientName: string,
  reviewedBy: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: '✅ Profile Submission Approved',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Your profile submission has been <strong style="color:#16a34a;">approved</strong>.</p>
          <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#166534;">✅ Profile Approved</p>
            <p style="margin:8px 0 0;color:#166534;">Reviewed by: ${reviewedBy}</p>
          </div>
          <p>Your personnel record has been created in the system. You can now log in to view your profile and medical status.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};

export const sendMedicalCheckupAdminEmail = async (
  requesterName: string,
  requesterEmail: string
): Promise<void> => {
  await createTransporter().sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: 'longlite8867@gmail.com',
    subject: '🏥 Medical Check-Up Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>A personnel has requested a <strong>Medical Check-Up</strong>.</p>
          <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#1d4ed8;">🏥 Medical Check-Up Request</p>
            <p style="margin:8px 0 0;color:#1d4ed8;"><strong>Name:</strong> ${requesterName}</p>
            <p style="margin:4px 0 0;color:#1d4ed8;"><strong>Email:</strong> ${requesterEmail}</p>
          </div>
          <p>Please coordinate with the personnel at your earliest convenience.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};

export const sendReEnlistmentEligibleEmail = async (
  recipientEmail: string,
  recipientName: string,
  eteDate: string
): Promise<void> => {
  const formatted = new Date(eteDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  await createTransporter().sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: '📋 Re-Enlistment Eligibility Notice',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You are now <strong>eligible for Re-Enlistment</strong>. Your ETE date is approaching within 1 year.</p>
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#92400e;">📅 ETE Date: ${formatted}</p>
            <p style="margin:8px 0 0;color:#78350f;">Please begin your Re-Enlistment process at the earliest opportunity.</p>
          </div>
          <p>Log in to the PCG Personnel Management System to start your Re-Enlistment process or contact your medical officer for assistance.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};

export const sendReEnlistmentUrgentEmail = async (
  recipientEmail: string,
  recipientName: string,
  eteDate: string
): Promise<void> => {
  const formatted = new Date(eteDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  await createTransporter().sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: '🚨 URGENT: ETE Nearing — Medical Processing Required',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Your ETE date is now <strong style="color:#dc2626;">within 6 months</strong>. Your medical processing for Re-Enlistment must be underway immediately.</p>
          <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#991b1b;">🚨 ETE Date: ${formatted}</p>
            <p style="margin:8px 0 0;color:#7f1d1d;">Failure to complete medical processing before your ETE date may affect your re-enlistment.</p>
          </div>
          <p>Please contact your medical officer immediately or log in to the system to check your Re-Enlistment process status.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};

export const sendProfileRejectedEmail = async (
  recipientEmail: string,
  recipientName: string,
  reviewedBy: string,
  reason?: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"PCG Personnel System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: '❌ Profile Submission Rejected',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${HEADER}
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Your profile submission has been <strong style="color:#dc2626;">rejected</strong>.</p>
          <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:4px;margin:20px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#991b1b;">❌ Profile Rejected</p>
            <p style="margin:8px 0 0;color:#991b1b;">Reviewed by: ${reviewedBy}</p>
            ${reason ? `<p style="margin:8px 0 0;color:#7f1d1d;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>Please log in to the system, review the reason above, and re-submit your profile with the necessary corrections.</p>
          ${FOOTER}
        </div>
      </div>
    `,
  });
};
