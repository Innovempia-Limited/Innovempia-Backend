import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

import { ContactDto } from './dto/contact.dto';

@Injectable()
export class CmsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private emailService: EmailService,
  ) {}

  // NEWSLETTER
  async subscribeNewsletter(email: string) {
    return this.prisma.newsletterSubscriber.create({ data: { email } });
  }
  async getSubscribers() {
    return this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async sendNewsletter(subject: string, message: string, file: any) {
    let fileUrl: string | undefined;
    if (file?.document?.[0]) fileUrl = await this.supabase.uploadFile(file.document[0], 'newsletters');
    
    const subs = await this.prisma.newsletterSubscriber.findMany({ select: { email: true } });
    if (subs.length === 0) return { message: 'No subscribers' };

    const htmlContent = fileUrl 
      ? `${message}<br><br><a href="${fileUrl}" target="_blank">Download Attachment</a>` 
      : message;

    await this.emailService.sendBulkEmail(subject, htmlContent);
    return { sentTo: subs.length };
  }

  // TEAM
   async addTeamMember(data: any, file: any) {
    let imageUrl: string | undefined;
    if (file?.image?.[0]) imageUrl = await this.supabase.uploadFile(file.image[0], 'team');
    
    return this.prisma.teamMember.create({ 
      data: { 
        name: data.name, 
        position: data.position, 
        email: data.email, 
        twitterUrl: data.twitterUrl, 
        linkedinUrl: data.linkedinUrl, 
        githubUrl: data.githubUrl, 
        order: parseInt(data.order, 10) || 0, // Parse string to int
        imageUrl 
      } 
    });
  }
  
  async getTeam() {
    return this.prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  }
  async deleteTeamMember(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }

  // PORTFOLIO
  async addProject(data: any, files: any) {
    let bgUrl: string | undefined;
    if (files?.background?.[0]) bgUrl = await this.supabase.uploadFile(files.background[0], 'portfolio');
    
    const project = await this.prisma.portfolioProject.create({
      data: { title: data.title, description: data.description, demoUrl: data.demoUrl, sourceCodeUrl: data.sourceCodeUrl, liveUrl: data.liveUrl, duration: data.duration, backgroundImageUrl: bgUrl }
    });

    if (files?.images) {
      for (const img of files.images) {
        const url = await this.supabase.uploadFile(img, 'portfolio');
        await this.prisma.portfolioProjectImage.create({ data: { url, projectId: project.id } });
      }
    }
    return project;
  }
  async getProjects() {
    return this.prisma.portfolioProject.findMany({ where: { isActive: true }, include: { images: true }, orderBy: { createdAt: 'desc' } });
  }

  // BLOG
  async addBlog(data: any, file: any) {
    let coverUrl: string | undefined;
    if (file?.cover?.[0]) coverUrl = await this.supabase.uploadFile(file.cover[0], 'blog');
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.blogPost.create({ data: { ...data, slug, coverImageUrl: coverUrl } });
  }
  async getBlogs() {
    return this.prisma.blogPost.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }
  async getBlogBySlug(slug: string) {
    return this.prisma.blogPost.findFirst({ where: { slug, isActive: true } });
  }

  // EVENTS
  async addEvent(data: any, file: any) {
    let coverUrl: string | undefined;
    if (file?.cover?.[0]) coverUrl = await this.supabase.uploadFile(file.cover[0], 'events');
    return this.prisma.event.create({ data: { ...data, coverImageUrl: coverUrl } });
  }
  async getEvents() {
    return this.prisma.event.findMany({ where: { isActive: true }, orderBy: { date: 'asc' } });
  }

  // JOBS
  async addJob(data: any) {
    return this.prisma.jobRole.create({ data });
  }
  async getJobs() {
    return this.prisma.jobRole.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }
  async applyToJob(jobId: string, data: any, file: any) {
    let resumeUrl: string | undefined;
    if (file?.resume?.[0]) resumeUrl = await this.supabase.uploadFile(file.resume[0], 'resumes');
    return this.prisma.jobApplication.create({ data: { jobId, fullName: data.fullName, email: data.email, phone: data.phone, resumeUrl, userId: data.userId || null } });
  }
  async getJobApplications(jobId: string) {
    return this.prisma.jobApplication.findMany({ where: { jobId }, orderBy: { createdAt: 'desc' } });
  }

  // CUSTOM PROJECTS
  async requestCustomProject(data: any, files: any) {
    const req = await this.prisma.customProjectRequest.create({ data: { name: data.name, email: data.email, phone: data.phone, description: data.description, budget: data.budget } });
    
    if (files?.images) {
      for (const img of files.images) {
        const url = await this.supabase.uploadFile(img, 'custom-projects');
        await this.prisma.customProjectImage.create({ data: { url, requestId: req.id } });
      }
    }
    return req;
  }
  async getCustomRequests() {
    return this.prisma.customProjectRequest.findMany({ include: { images: true }, orderBy: { createdAt: 'desc' } });
  }

  // STANDALONE COURSES
  async addStandaloneCourse(data: any, file: any) {
    let coverUrl: string | undefined;
    if (file?.cover?.[0]) coverUrl = await this.supabase.uploadFile(file.cover[0], 'courses');
    return this.prisma.standaloneCourse.create({ data: { ...data, coverImageUrl: coverUrl } });
  }
  async getStandaloneCourses() {
    return this.prisma.standaloneCourse.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  // CONTACT FORM
  async sendContactMessage(dto: ContactDto) {
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.emailService.sendBulkEmail(`Contact Form: ${dto.subject || 'No Subject'}`, `<p><strong>Name:</strong> ${dto.name}<br><strong>Email:</strong> ${dto.email}<br><br>${dto.message}</p>`);
    }
    return { message: 'Message sent successfully' };
  }
}