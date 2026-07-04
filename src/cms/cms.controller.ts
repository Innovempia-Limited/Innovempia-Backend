import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CmsService } from './cms.service';

import { ContactDto } from './dto/contact.dto';

@ApiTags('CMS & Public')
@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

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
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        description: { type: 'string' },
        budget: { type: 'string' },
        images: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  requestProject(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.requestCustomProject(data, files); }


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
        background: { type: 'string', format: 'binary' },
        images: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'background', maxCount: 1 }, { name: 'images', maxCount: 10 }]))
  addProject(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addProject(data, files); }

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
        cover: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  addBlog(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addBlog(data, files); }

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
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  addEvent(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addEvent(data, files); }

  @Post('admin/jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Add job role' })
  addJob(@Body() data: any) { return this.cmsService.addJob(data); }

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
        cover: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]))
  addStandaloneCourse(@Body() data: any, @UploadedFiles() files: any) { return this.cmsService.addStandaloneCourse(data, files); }
}