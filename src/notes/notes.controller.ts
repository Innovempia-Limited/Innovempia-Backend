import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { NotesService } from './notes.service';

import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a day note' })
  async createNote(@CurrentUser('id') userId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.createNote(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notes for the authenticated user' })
  async getMyNotes(@CurrentUser('id') userId: string) {
    return this.notesService.getMyNotes(userId);
  }

  @Get('enrollment/:enrollmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notes for a specific enrollment' })
  async getNotesByEnrollment(
    @CurrentUser('id') userId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.notesService.getNotesByEnrollment(userId, enrollmentId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single note by ID' })
  async getNote(@CurrentUser('id') userId: string, @Param('id') noteId: string) {
    return this.notesService.getNote(userId, noteId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a note' })
  async updateNote(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(userId, noteId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a note' })
  async deleteNote(@CurrentUser('id') userId: string, @Param('id') noteId: string) {
    return this.notesService.deleteNote(userId, noteId);
  }
}