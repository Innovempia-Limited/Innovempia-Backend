import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

import { PaymentsService } from '../payments/payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { PrismaService } from '../prisma/prisma.service';

import { CmsService } from './cms.service';

import { ContactDto } from './dto/contact.dto';
import { StandaloneCourseDto } from './dto/standalone-course.dto';
import {EnrollStandaloneDto} from '../payments/enroll-standalone.dto'
@ApiTags('CMS & Public')
@Controller('cms')
export class CmsController {
  constructor(
    private cmsService: CmsService,
    private paymentsService: PaymentsService,
    private prisma: PrismaService,
  ) {}

  // --- PUBLIC ROUTES ---
  @Get('team')
  @ApiOperation({ summary: 'Public: Get team members' })
  getTeam() { return this.cmsService.getTeam(); }

  @Get('projects')
  @ApiOperation({ summary: 'Public: Get portfolio projects' })
  getProjects() { return this.cmsService.getProjects(); }

  @Get('blogs')
  @ApiOperation({ summary: 'Public: Get blog posts' })
  getBlogs() { return this.cmsService.getBlogs(); }

  @Get('blogs/:slug')
  @ApiOperation({ summary: 'Public: Get single blog post' })
  getBlog(@Param('slug') slug: string) { return this.cmsService.getBlogBySlug(slug); }

  @Get('events')
  @ApiOperation({ summary: 'Public: Get events' })
  getEvents() { return this.cmsService.getEvents(); }

  @Get('jobs')
  @ApiOperation({ summary: 'Public: Get open jobs' })
  getJobs() { return this.cmsService.getJobs(); }

  @Get('standalone-courses')
  @ApiOperation({ summary: 'Public: Get standalone paid courses' })
  getStandaloneCourses() { return this.cmsService.getStandaloneCourses(); }

  @Post('contact')
  @ApiOperation({ summary: 'Public: Send a contact message' })
  contact(@Body() dto: ContactDto) { return this.cmsService.sendContactMessage(dto); }

  @Post('newsletter')
  @ApiOperation({ summary: 'Public: Subscribe to newsletter' })
  subscribe(@Body('email') email: string) { return this.cmsService.subscribeNewsletter(email); }

  @Post('jobs/:jobId/apply')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Public/Student: Apply for a job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        userId: { type: 'string' },
        resume: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'resume', maxCount: 1 }]))
  applyJob(@Param('jobId') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.applyToJob(id, data, files); }

  @Post('custom-projects')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Public: Request a custom project' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'description'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        description: { type: 'string' },
        budget: { type: 'string' },
        images: { 
          type: 'array', 
          items: { type: 'string', format: 'binary' },
          maxItems: 10
        }
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  requestProject(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.requestCustomProject(data, files); }

  // --- STANDALONE COURSES ENROLLMENT ---
  @Post('standalone-courses/:id/enroll')
  @ApiOperation({ summary: 'Public: Pay & Enroll (Creates account if none exists)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'john@example.com' },
        phone: { type: 'string', example: '08012345678' },
      },
    },
  })
  async enrollCourse(@Param('id') courseId: string, @Body() dto: EnrollStandaloneDto) { 
    return this.paymentsService.initializeStandaloneCourse(dto, courseId); 
  }

  @Get('standalone-courses/my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Get all courses I have paid for' })
  async getMyCourses(@CurrentUser('id') userId: string) {
    const payments = await this.prisma.paymentRecord.findMany({
      where: { userId, type: 'STANDALONE_COURSE', status: 'SUCCESS' },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map(p => p.course);
  }


  // --- ADMIN ROUTES ---
  @Post('admin/newsletter/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Send newsletter (supports attachment)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        message: { type: 'string' },
        document: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  sendNewsletter(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.sendNewsletter(data.subject, data.message, files); }

  @Get('admin/subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getSubscribers() { return this.cmsService.getSubscribers(); }

  @Post('admin/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Add team member' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        position: { type: 'string' },
        email: { type: 'string' },
        twitterUrl: { type: 'string' },
        linkedinUrl: { type: 'string' },
        githubUrl: { type: 'string' },
        order: { type: 'number' },
        image: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  addTeam(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addTeamMember(data, files); }

  @Delete('admin/team/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  deleteTeam(@Param('id') id: string) { return this.cmsService.deleteTeamMember(id); }

  @Put('admin/team/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Edit team member' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        position: { type: 'string' },
        email: { type: 'string' },
        twitterUrl: { type: 'string' },
        linkedinUrl: { type: 'string' },
        githubUrl: { type: 'string' },
        order: { type: 'number' },
        image: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  updateTeam(@Param('id') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.updateTeamMember(id, data, files); }

  @Post('admin/projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Add portfolio project (multiple images)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        demoUrl: { type: 'string' },
        sourceCodeUrl: { type: 'string' },
        liveUrl: { type: 'string' },
        duration: { type: 'string' },
        status: { type: 'string' },
        techStack: { type: 'array', items: { type: 'string' } },
        aiIntegrationDetails: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' } },
        architectureHighlight: { type: 'string' },
        projectType: { type: 'string' },
        background: { type: 'string', format: 'binary' },
        images: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'background', maxCount: 1 }, { name: 'images', maxCount: 10 }]))
  addProject(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addProject(data, files); }

  @Put('admin/projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Edit portfolio project' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        demoUrl: { type: 'string' },
        sourceCodeUrl: { type: 'string' },
        liveUrl: { type: 'string' },
        duration: { type: 'string' },
        status: { type: 'string' },
        techStack: { type: 'array', items: { type: 'string' } },
        aiIntegrationDetails: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' } },
        architectureHighlight: { type: 'string' },
        projectType: { type: 'string' },
        background: { type: 'string', format: 'binary' },
        images: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'background', maxCount: 1 }, { name: 'images', maxCount: 10 }]))
  updateProject(@Param('id') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.updateProject(id, data, files); }

  // --- BLOGS ---
  @Post('admin/blogs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Add blog post (HTML content)' })
@ApiBody({
     schema: {
       type: 'object',
       properties: {
         title: { type: 'string' },
         content: { type: 'string' },
         authorName: { type: 'string' },
         ctaLabel: { type: 'string' },
         ctaUrl: { type: 'string' },
         cover: { type: 'string', format: 'binary' }
       },
     },
   })
   @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
   addBlog(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addBlog(data, files); }

  @Put('admin/blogs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Edit a blog post' })
@ApiBody({
     schema: {
       type: 'object',
       properties: {
         title: { type: 'string' },
         content: { type: 'string' },
         authorName: { type: 'string' },
         ctaLabel: { type: 'string' },
         ctaUrl: { type: 'string' },
         cover: { type: 'string', format: 'binary' }
       },
     },
   })
   @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
   updateBlog(@Param('id') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.updateBlog(id, data, files); }

  @Delete('admin/blogs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete a blog post (Soft delete)' })
  deleteBlog(@Param('id') id: string) { return this.cmsService.deleteBlog(id); }

  // --- EVENTS ---
  @Post('admin/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Add event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' },
        location: { type: 'string' },
        registrationLink: { type: 'string' },
        cover: { type: 'string', format: 'binary' }
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  addEvent(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addEvent(data, files); }

  @Put('admin/events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Edit an event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' },
        location: { type: 'string' },
        registrationLink: { type: 'string' },
        cover: { type: 'string', format: 'binary' }
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  updateEvent(@Param('id') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.updateEvent(id, data, files); }

  @Delete('admin/events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete an event (Soft delete)' })
  deleteEvent(@Param('id') id: string) { return this.cmsService.deleteEvent(id); }

  @Post('admin/jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Add job role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Senior Backend Developer' },
        type: { type: 'string', example: 'Remote' },
        description: { type: 'string', example: 'We need an expert in NestJS and microservices...' },
        requirements: { type: 'string', example: '5 years experience, Node.js, PostgreSQL' },
        salaryRange: { type: 'string', example: '150,000 - 250,000 NGN' },
      },
    },
  })
  addJob(@Body() data: any) { return this.cmsService.addJob(data); }

  @Delete('admin/jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete a job role' })
  async deleteJob(@Param('id') id: string) { return this.cmsService.deleteJob(id); }

  @Get('admin/jobs/:jobId/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getApplications(@Param('jobId') id: string) { return this.cmsService.getJobApplications(id); }

  @Get('admin/custom-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getCustomRequests() { return this.cmsService.getCustomRequests(); }

  @Post('admin/standalone-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Add standalone paid course' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        content: { type: 'string' },
        whatsappGroupLink: { type: 'string' },
        deadline: { type: 'string', format: 'date-time' },
        startDate: { type: 'string', format: 'date-time' },
        level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        blueprint: { type: 'string' },
        classDays: { type: 'string' },
        classTime: { type: 'string' },
        venue: { type: 'string' },
        cover: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  addStandaloneCourse(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addStandaloneCourse(data, files); }

  @Put('admin/standalone-courses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Update standalone paid course' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        content: { type: 'string' },
        whatsappGroupLink: { type: 'string' },
        deadline: { type: 'string', format: 'date-time' },
        startDate: { type: 'string', format: 'date-time' },
        level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        blueprint: { type: 'string' },
        classDays: { type: 'string' },
        classTime: { type: 'string' },
        venue: { type: 'string' },
        cover: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  updateStandaloneCourse(@Param('id') id: string, @Body() data: any, @UploadedFiles() files: any) { return this.cmsService.updateStandaloneCourse(id, data, files); }
}