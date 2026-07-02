import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllStudents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                title: true,
                type: true,
              },
            },
            currentSubCategory: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentById(studentId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: { id: studentId, role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            course: true,
            currentSubCategory: true,
          },
        },
      },
    });
  }
}