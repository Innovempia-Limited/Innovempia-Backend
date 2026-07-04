🚀 Innovempia API
Innovempia is a comprehensive mentorship platform and Content Management System (CMS) built with NestJS. It handles day-by-day student learning, automated grading progression, Paystack payment integration, and a full company website backend (Portfolio, Blog, Events, Careers, etc.).

🌟 Key Features
🎓 Mentorship System
Public Course Catalog: Students browse available tracks (e.g., Frontend) or specific languages (e.g., Python).
Auto-Enrollment: Registering from a course page automatically creates a student account and enrolls them.
Day-by-Day Curriculum: Admin uploads materials (text/files), project descriptions, and submission methods per day.
Adaptive Sub-Categories: Track courses flow sequentially (e.g., HTML -> CSS -> JS). Passing the last day of HTML automatically unlocks Day 1 of CSS.
Unified Submissions: Students submit via GitHub link, pasted code, or file upload based on admin settings.
Detailed Grading: Admin uploads a detailed feedback document (PDF/Doc) alongside Quiz, Project, and Overall scores.
Auto-Progression: Marking a submission as "SUCCESS" unlocks the next day. "Needs Correction" keeps the day locked for resubmission.
💳 Payments & Subscriptions (Paystack)
Manual Verification: Uses Paystack standard initialization + manual GET verification.
Mentorship Subscriptions: 25k/month recurring logic triggered when admin updates a student to Intermediate/Advanced.
Standalone Courses: One-off payments for fixed-price courses. Success triggers an email with the WhatsApp group link.
Auto-Cancellation: Moving a student to "Completed" automatically cancels their active subscription status.
🌍 Company CMS & Public Routes
Team Members: Add team with photos, positions, and social links.
Portfolio Projects: Multi-image project showcases with live links, source code, and duration.
Blog: HTML-supported blog posts with SEO-friendly slugs.
Events: Upcoming events with dates, locations, and registration links.
Careers: Post job roles, accept resume uploads, and view applications.
Custom Project Requests: Lead capture for users wanting custom builds (supports multiple image uploads).
Newsletter: Subscribe endpoint and admin bulk sender (supports document attachments).
🤝 Communication & Support
Q&A System: Students ask questions per course, admin replies.
Meeting Requests: Students schedule meetings with admin (Propose date/time, admin approves/rejects).
Notifications: Real-time in-app alerts for submissions, grading, level updates, and messages.
Email Templates: Beautiful, responsive HTML emails for onboarding, grading, OTP, and purchases.
🛠️ Tech Stack
Framework: NestJS
Language: TypeScript
Database: PostgreSQL
ORM: Prisma
Storage: Supabase Storage
Payments: Paystack
Emails: Nodemailer
API Docs: Swagger / OpenAPI
📋 Prerequisites
Node.js (v18 or higher recommended)
PostgreSQL database (Local or Cloud like Neon)
A Supabase account (for file storage)
A Paystack account (for payments)
An SMTP service (e.g., Gmail App Password)
⚙️ Environment Variables
Create a .env file in the root directory based on .env.example:

# DatabaseDATABASE_URL="postgresql://user:password@host:5432/innovempia?schema=public"# JWTJWT_SECRET="your-super-secret-jwt-key"JWT_EXPIRES_IN="7d"# Default Admin (Seeded on first startup)ADMIN_EMAIL="admin@innovempia.com"ADMIN_PASSWORD="Admin@2024!"# SMTP EmailSMTP_HOST="smtp.gmail.com"SMTP_PORT=587SMTP_USER="your-email@gmail.com"SMTP_PASS="your-16-digit-app-password"FROM_EMAIL="noreply@innovempia.com"ADMIN_EMAIL_NOTIFY="admin@innovempia.com"# Supabase StorageSUPABASE_URL="https://your-project.supabase.co"SUPABASE_ANON_KEY="your-supabase-anon-key"SUPABASE_BUCKET_NAME="innovempia"# PaystackPAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxx"
🚀 Getting Started
bash

# 1. Clone the repository
git clone <your-repo-url>
cd Innovempia-Backend

# 2. Install dependencies
npm install

# 3. Setup Prisma and push schema to database
npx prisma generate
npx prisma db push

# 4. Start the development server
npm run start:dev
The server will run on http://localhost:3000.
The Swagger API documentation will be available at http://localhost:3000/docs.

⚠️ Important Setup Notes
Supabase Bucket: Go to your Supabase dashboard -> Storage -> Create a new bucket named exactly innovempia and set it to Public.
Paystack Keys: Ensure you are using your Test keys from the Paystack dashboard for development.
Gmail SMTP: If using Gmail, you must generate an "App Password" from your Google Account settings. Standard passwords will not work.
Admin Seed: On the very first server startup, the system checks the .env for ADMIN_EMAIL and ADMIN_PASSWORD. If that user doesn't exist, it creates them as an ADMIN.
📁 Project Structure
text

src/
├── admin/               # Admin-specific dashboard logic (stats, levels, certs, bulk email)
├── auth/                # Login, JWT strategy, guards, roles, OTP, forgot password
├── cms/                 # Public website CMS (Team, Portfolio, Blog, Events, Jobs, News)
├── courses/             # Mentorship course creation, sub-categories, public catalog
├── curriculum/          # Day-by-day content upload for courses/subs
├── email/               # Nodemailer setup and beautiful HTML templates
├── meetings/            # Student meeting requests & admin approval
├── notifications/       # In-app alert system
├── payments/            # Paystack initialization, verification, subscriptions
├── prisma/              # Prisma client connection
├── qa/                  # Q&A messaging system
├── students/            # Student dashboard, profile, submission history
├── submissions/         # Day submissions, auto-progression logic, grading
├── supabase/            # Supabase file upload service
├── app.module.ts        # Root module
└── main.ts              # Bootstrap, Swagger setup, CORS, Validation pipes
📚 API Modules Overview
Access full interactive documentation at /docs.

Tag
Description
Access
Auth	Login, Change Password, Forgot/Reset Password (OTP)	Public / Authenticated
Courses	Create tracks/languages, add subs, public catalog, student registration	Public / Admin
Curriculum	Upload day material/files, set submission methods	Admin / Student (Read)
Submissions	Submit day work, get pending list, grade (upload feedback doc)	Student / Admin
Students	View dashboard, profile, past courses, download certificates	Student
Admin	View students, suspend/unsuspend, update levels, upload certs, bulk email	Admin
Meetings	Request meeting, view requests, approve/reject	Student / Admin
Q&A	Ask questions, reply to questions	Student / Admin
Payments	Init course/subscription pay, verify reference, cancel sub	Authenticated
CMS & Public	Team, Portfolio, Blog, Events, Jobs, Newsletters, Contact Form	Public / Admin

📜 License
Proprietary - Innovempia
