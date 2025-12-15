import { VENUES } from '@/lib/data/venues-research';
import VenuePageClient from './VenuePageClient';

// Generate static paths for all venues
export async function generateStaticParams() {
  return VENUES.map((venue) => ({
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
