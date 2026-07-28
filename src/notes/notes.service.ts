import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(userId: string, dto: CreateNoteDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, userId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.dayNote.create({
      data: {
        enrollmentId: dto.enrollmentId,
        userId,
        dayNumber: dto.dayNumber,
        title: dto.title,
        content: dto.content ?? '',
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async getMyNotes(userId: string) {
    return this.prisma.dayNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotesByEnrollment(userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.dayNote.findMany({
      where: { enrollmentId },
      orderBy: { dayNumber: 'asc' },
    });
  }

  async getNote(userId: string, noteId: string) {
    const note = await this.prisma.dayNote.findUnique({
      where: { id: noteId },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new NotFoundException('Note not found');

    return note;
  }

  async updateNote(userId: string, noteId: string, dto: UpdateNoteDto) {
    const note = await this.prisma.dayNote.findUnique({
      where: { id: noteId },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new NotFoundException('Note not found');

    return this.prisma.dayNote.update({
      where: { id: noteId },
      data: {
        ...(dto.dayNumber !== undefined && { dayNumber: dto.dayNumber }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
      },
    });
  }

  async deleteNote(userId: string, noteId: string) {
    const note = await this.prisma.dayNote.findUnique({
      where: { id: noteId },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new NotFoundException('Note not found');

    return this.prisma.dayNote.delete({ where: { id: noteId } });
  }
}