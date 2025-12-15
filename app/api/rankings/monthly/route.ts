import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get monthly power rankings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Default to current month if not specified
    const targetDate = monthParam ? new Date(monthParam) : new Date();
    const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);

    const rankings = await prisma.ranking.findMany({
      where: {
        month: firstDayOfMonth,
      },
      include: {
        venue: {
          include: {
            deals: {
              where: { isActive: true },
            },
            events: {
              where: {
                eventDate: {
                  gte: new Date(),
                },
              },
              take: 3,
            },
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
      take: limit,
    });

    return NextResponse.json({
      month: firstDayOfMonth.toISOString(),
      rankings,
      totalCount: rankings.length,
    });
  } catch (error) {
    console.error('Error fetching monthly rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
