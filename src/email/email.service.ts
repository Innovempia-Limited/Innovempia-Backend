import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  bcc?: string[];
}

@Injectable()
export class EmailService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async sendResend(payload: ResendEmailPayload): Promise<void> {
    const apiKey = this.config.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Resend API error ${res.status}: ${errorText}`);
    }
  }

  private buildTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Innovempia</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">Innovempia</h1>
                    <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; text-transform: uppercase; letter-spacing: 3px;">Mentorship Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">&copy; ${new Date().getFullYear()} Innovempia. All rights reserved.</p>
                    <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 12px;">You received this because you signed up on our platform.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendStudentOnboarding(email: string, firstName: string, courseTitle: string) {
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); width: 64px; height: 64px; line-height: 64px; border-radius: 16px; font-size: 28px; color: #ffffff;">🚀</div>
      </div>
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 26px; font-weight: 700;">Welcome to Innovempia, ${firstName}!</h2>
      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
        You have successfully enrolled in <strong style="color: #4F46E5; font-weight: 600;">${courseTitle}</strong>. Your learning journey starts now — we are excited to have you here.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <a href="https://www.innovempia.com/mentor/dashboard/login" target="_blank" style="background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);">Go to My Dashboard</a>
          </td>
        </tr>
      </table>
      <div style="background-color: #eef2ff; border-left: 4px solid #4F46E5; padding: 16px 20px; border-radius: 0 10px 10px 0; margin-top: 24px;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
          <strong>💡 Pro Tip:</strong> Check your dashboard daily to keep your learning streak alive and stay ahead.
        </p>
      </div>
    `;

    await this.sendResend({
      from: this.config.get('FROM_EMAIL', 'Innovempia <mail@innovempia.com>'),
      to: [email],
      subject: `Welcome to Innovempia! You're enrolled in ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }

  async sendOtp(email: string, otp: string) {
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); width: 64px; height: 64px; line-height: 64px; border-radius: 16px; font-size: 28px; color: #ffffff;">🔐</div>
      </div>
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 26px; font-weight: 700;">Password Reset Request</h2>
      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <span style="background-color: #f3f4f6; color: #111827; font-size: 38px; font-weight: 700; letter-spacing: 12px; padding: 16px 44px; border-radius: 14px; border: 2px dashed #d1d5db; font-family: 'Courier New', monospace;">${otp}</span>
          </td>
        </tr>
      </table>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 10px 10px 0; margin-top: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;"><strong>⚠️ Security:</strong> If you did not request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `;

    await this.sendResend({
      from: this.config.get('FROM_EMAIL', 'Innovempia Security <mail@innovempia.com>'),
      to: [email],
      subject: `Your Password Reset OTP: ${otp}`,
      html: this.buildTemplate(content),
    });
  }

  async sendAdminNewEnrollment(studentName: string, courseTitle: string, hasCurriculum: boolean) {
    const warningBlock = !hasCurriculum
      ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 0 10px 10px 0; margin-top: 24px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 700;">⚠️ WARNING: No Curriculum Uploaded</p>
          <p style="margin: 6px 0 0 0; color: #b91c1c; font-size: 13px; line-height: 1.5;">This course does not have day-by-day content yet. Please add the curriculum so the student can start learning.</p>
        </div>
      `
      : '';

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #111827 0%, #374151 100%); width: 64px; height: 64px; line-height: 64px; border-radius: 16px; font-size: 28px; color: #ffffff;">📢</div>
      </div>
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 26px; font-weight: 700;">New Student Enrollment</h2>
      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">A new student has registered and enrolled in a mentorship program.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; width: 35%; background-color: #ffffff;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Student</p>
          </td>
          <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
            <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">${studentName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px; background-color: #ffffff;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Course</p>
          </td>
          <td style="padding: 16px 20px; background-color: #ffffff;">
            <p style="margin: 0; color: #4F46E5; font-size: 15px; font-weight: 600;">${courseTitle}</p>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="https://www.innovempia.com/dashboard" target="_blank" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: 600; font-size: 14px; display: inline-block;">View in Admin Dashboard</a>
          </td>
        </tr>
      </table>
      ${warningBlock}
    `;

    await this.sendResend({
      from: this.config.get('FROM_EMAIL', 'Innovempia System <mail@innovempia.com>'),
      to: [this.config.get('ADMIN_EMAIL_NOTIFY', 'mail@innovempia.com')],
      subject: `New Enrollment: ${studentName} joined ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }

  async sendCoursePurchaseEmail(email: string, firstName: string, courseTitle: string, whatsappLink: string | null) {
    const whatsappBlock = whatsappLink
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${whatsappLink}" target="_blank" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.35);">Join WhatsApp Group</a>
            </td>
          </tr>
        </table>
      `
      : '';

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); width: 64px; height: 64px; line-height: 64px; border-radius: 16px; font-size: 28px; color: #ffffff;">🎓</div>
      </div>
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 26px; font-weight: 700;">Payment Successful!</h2>
      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Hi ${firstName}, your payment for <strong style="color: #111827;">${courseTitle}</strong> was successful. Welcome to the class!</p>
      ${whatsappBlock}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="https://www.innovempia.com/dashboard" target="_blank" style="background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);">Go to Your Dashboard</a>
          </td>
        </tr>
      </table>
    `;

    await this.sendResend({
      from: this.config.get('FROM_EMAIL', 'Innovempia <mail@innovempia.com>'),
      to: [email],
      subject: `Access Granted: ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }

  async sendBulkEmail(subject: string, htmlMessage: string) {
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { email: true },
    });

    if (students.length === 0) {
      return { message: 'No active students to email.' };
    }

    const emailList = students.map(s => s.email);
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); width: 64px; height: 64px; line-height: 64px; border-radius: 16px; font-size: 28px; color: #ffffff;">📢</div>
      </div>
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 700;">${subject}</h2>
      <div style="color: #374151; font-size: 16px; line-height: 1.7;">
        ${htmlMessage}
      </div>
    `;

    await this.sendResend({
      from: this.config.get('FROM_EMAIL', 'Innovempia <mail@innovempia.com>'),
      to: [this.config.get('FROM_EMAIL', 'mail@innovempia.com')],
      bcc: emailList,
      subject: `[Innovempia] ${subject}`,
      html: this.buildTemplate(content),
    });

    return { message: `Email sent to ${students.length} students.` };
  }
}
