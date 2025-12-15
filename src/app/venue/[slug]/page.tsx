import { MOCK_VENUES } from '@/lib/data/mock-venues';
import VenuePageClient from './VenuePageClient';

// Generate static paths for all venues
export async function generateStaticParams() {
  return MOCK_VENUES.map((venue) => ({
    slug: venue.slug,
  }));
}

export default function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <VenuePageClient params={params} />;
}
