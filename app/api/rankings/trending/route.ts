import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get trending movers - venues with biggest rank changes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const direction = searchParams.get('direction') as 'up' | 'down' | null;

    // Get current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get rankings for current month
    const rankings = await prisma.ranking.findMany({
      where: {
        month: currentMonth,
        trendDirection: direction || undefined,
      },
      include: {
        venue: true,
      },
      orderBy: {
        trendChange: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      month: currentMonth.toISOString(),
      trending: rankings,
    });
  } catch (error) {
    console.error('Error fetching trending venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending venues' },
      { status: 500 }
    );
  }
}
