import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const trimmedSearch = search?.trim();

    const companies = await this.prisma.company.findMany({
      where: trimmedSearch
        ? { name: { contains: trimmedSearch, mode: 'insensitive' } }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { problems: true } },
      },
      orderBy: { problems: { _count: 'desc' } },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c._count.problems,
    }));
  }
}
