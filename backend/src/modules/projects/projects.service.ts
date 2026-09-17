import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/app-error.js';

export class ProjectsService {
  async listProjects(userId: string) {
    return await prisma.project.findMany({
      where: { userId },
      include: {
        conversations: {
          where: { active: true },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            startedAt: true,
            projectId: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(userId: string, name: string, description?: string) {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new BadRequestError('El nombre del proyecto es obligatorio');
    }

    return await prisma.project.create({
      data: {
        userId,
        name: trimmedName,
        description: description?.trim(),
      },
      include: {
        conversations: true,
      },
    });
  }

  async updateProject(
    userId: string,
    projectId: string,
    data: { name?: string; description?: string }
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    if (project.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para modificar este proyecto');
    }

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name?.trim() || project.name,
        description: data.description !== undefined ? data.description?.trim() : project.description,
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    if (project.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para eliminar este proyecto');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true };
  }
}

export const projectsService = new ProjectsService();
