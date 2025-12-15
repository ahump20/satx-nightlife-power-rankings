/**
 * Yelp Fusion API integration (official API only, no scraping)
 */

export interface YelpBusiness {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  price?: string;
  phone?: string;
  url?: string;
  imageUrl?: string;
  categories: string[];
}

export async function searchYelpBusinesses(
  latitude: number,
  longitude: number,
  radius: number = 5000, // meters
  categories: string = 'nightlife,bars'
): Promise<YelpBusiness[]> {
  const apiKey = process.env.YELP_API_KEY;
  
  if (!apiKey) {
    console.warn('Yelp API key not configured');
    return [];
  }

  try {
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&categories=${categories}&limit=50`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (!data.businesses) {
      return [];
    }

    return data.businesses.map((business: any) => ({
      id: business.id,
      name: business.name,
      address: business.location.address1,
      city: business.location.city,
      state: business.location.state,
      zipCode: business.location.zip_code,
      latitude: business.coordinates.latitude,
      longitude: business.coordinates.longitude,
      rating: business.rating,
      reviewCount: business.review_count,
      price: business.price,
      phone: business.phone,
      url: business.url,
      imageUrl: business.image_url,
      categories: business.categories.map((c: any) => c.title),
    }));
  } catch (error) {
    console.error('Error fetching from Yelp:', error);
    return [];
  }
}

export async function getYelpBusinessDetails(businessId: string): Promise<YelpBusiness | null> {
  const apiKey = process.env.YELP_API_KEY;
  
  if (!apiKey) {
    console.warn('Yelp API key not configured');
    return null;
  }

  try {
    const url = `https://api.yelp.com/v3/businesses/${businessId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const business = await response.json();

    return {
      id: business.id,
      name: business.name,
      address: business.location.address1,
      city: business.location.city,
      state: business.location.state,
      zipCode: business.location.zip_code,
      latitude: business.coordinates.latitude,
      longitude: business.coordinates.longitude,
      rating: business.rating,
      reviewCount: business.review_count,
      price: business.price,
      phone: business.phone,
      url: business.url,
      imageUrl: business.image_url,
      categories: business.categories.map((c: any) => c.title),
    };
  } catch (error) {
    console.error('Error fetching Yelp business details:', error);
    return null;
  }
}
