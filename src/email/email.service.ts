import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from '@prisma/client';

import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  // Base HTML template to keep emails consistent and beautiful
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
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      Innovempia
                    </h1>
                    <p style="margin: 5px 0 0 0; color: #e0e7ff; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                      Mentorship Platform
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">
                      &copy; ${new Date().getFullYear()} Innovempia. All rights reserved.
                    </p>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                      You're receiving this because you signed up on our platform.
                    </p>
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
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 48px;">🚀</span>
      </div>
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 600;">
        Welcome to Innovempia, ${firstName}!
      </h2>
      <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        You have successfully enrolled in <strong style="color: #4F46E5;">${courseTitle}</strong>. 
        We are thrilled to have you on board. Your journey to mastering new skills starts right now.
      </p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
        <tr>
          <td align="center">
            <a href="http://localhost:3000" target="_blank" style="background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
              Go to My Dashboard
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #f3f4f6; border-left: 4px solid #4F46E5; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-top: 30px;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
          <strong>💡 Pro Tip:</strong> Make sure to check your dashboard daily to keep your learning streak alive!
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Innovempia" <${this.config.get('FROM_EMAIL')}>`,
      to: email,
      subject: `Welcome to Innovempia! 🎉 You're enrolled in ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }
    async sendOtp(email: string, otp: string) {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 48px;">🔐</span>
      </div>
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 600;">
        Password Reset Request
      </h2>
      <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        You requested to reset your password. Use the OTP below to proceed. It expires in 10 minutes.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
        <tr>
          <td align="center">
            <span style="background-color: #f3f4f6; color: #111827; font-size: 36px; font-weight: 700; letter-spacing: 10px; padding: 15px 40px; border-radius: 12px; border: 1px dashed #d1d5db;">
              ${otp}
            </span>
          </td>
        </tr>
      </table>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-top: 30px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
          <strong>⚠️ Security:</strong> If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Innovempia Security" <${this.config.get('FROM_EMAIL')}>`,
      to: email,
      subject: `Your Password Reset OTP: ${otp}`,
      html: this.buildTemplate(content),
    });
  }
  
  async sendAdminNewEnrollment(studentName: string, courseTitle: string, hasCurriculum: boolean) {
    const warningBlock = !hasCurriculum 
      ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-top: 25px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
            ⚠️ WARNING: No Curriculum Uploaded
          </p>
          <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 13px;">
            This course does not have day-by-day content set up yet. Please add the curriculum so the student can start learning.
          </p>
        </div>
      ` 
      : '';

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 48px;">📢</span>
      </div>
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 600;">
        New Student Enrollment
      </h2>
      <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        A new student has just registered and enrolled in a mentorship program.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <tr>
          <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; width: 40%;">
            <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Student</p>
          </td>
          <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 500;">${studentName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 15px 20px; width: 40%;">
            <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Course</p>
          </td>
          <td style="padding: 15px 20px;">
            <p style="margin: 0; color: #4F46E5; font-size: 15px; font-weight: 500;">${courseTitle}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="http://localhost:3000/api/docs" target="_blank" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; font-size: 14px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </td>
        </tr>
      </table>

      ${warningBlock}
    `;

    await this.transporter.sendMail({
      from: `"Innovempia System" <${this.config.get('FROM_EMAIL')}>`,
      to: this.config.get('ADMIN_EMAIL_NOTIFY'),
      subject: `New Enrollment: ${studentName} joined ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }
  async sendCoursePurchaseEmail(email: string, firstName: string, courseTitle: string, whatsappLink: string | null) {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 48px;">🎓</span>
      </div>
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 600;">
        Payment Successful!
      </h2>
      <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi ${firstName}, your payment for <strong>${courseTitle}</strong> was successful. Welcome to the class!
      </p>
      ${
        whatsappLink ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="${whatsappLink}" target="_blank" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block;">
                Join WhatsApp Group
              </a>
            </td>
          </tr>
        </table>` : ''
      }
    `;
    await this.transporter.sendMail({
      from: `"Innovempia" <${this.config.get('FROM_EMAIL')}>`,
      to: email,
      subject: `Access Granted: ${courseTitle}`,
      html: this.buildTemplate(content),
    });
  }
  
    async sendBulkEmail(subject: string, htmlMessage: string) {
    const prisma = new PrismaClient();
    
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { email: true },
    });

    if (students.length === 0) {
      return { message: 'No active students to email.' };
    }

    const emailList = students.map(s => s.email);

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 48px;">📢</span>
      </div>
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 600;">
        ${subject}
      </h2>
      <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${htmlMessage}
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Innovempia" <${this.config.get('FROM_EMAIL')}>`,
      to: this.config.get('FROM_EMAIL'), // Send to self (BCC students for privacy)
      bcc: emailList.join(', '),
      subject: `[Innovempia] ${subject}`,
      html: this.buildTemplate(content),
    });

    return { message: `Email sent to ${students.length} students.` };
  }

  
}