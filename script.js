// Sample venue data for the power rankings
const venuesData = [
    {
        id: 1,
        name: "The Aztec Theatre",
        category: "live-music",
        location: "104 N St Mary's St",
        rank: 1,
        rating: 4.8,
        vibe: 95,
        crowd: 92,
        music: 98,
        service: 90
    },
    {
        id: 2,
        name: "Paramour",
        category: "clubs",
        location: "800 S Alamo St",
        rank: 2,
        rating: 4.7,
        vibe: 93,
        crowd: 90,
        music: 91,
        service: 88
    },
    {
        id: 3,
        name: "The Espee",
        category: "bars",
        location: "200 S Presa St",
        rank: 3,
        rating: 4.6,
        vibe: 90,
        crowd: 88,
        music: 85,
        service: 92
    },
    {
        id: 4,
        name: "Warehouse Live",
        category: "live-music",
        location: "1122 E Commerce St",
        rank: 4,
        rating: 4.5,
        vibe: 88,
        crowd: 87,
        music: 93,
        service: 85
    },
    {
        id: 5,
        name: "Smoke Skybar",
        category: "lounges",
        location: "St. Anthony Hotel",
        rank: 5,
        rating: 4.5,
        vibe: 91,
        crowd: 85,
        music: 82,
        service: 90
    },
    {
        id: 6,
        name: "Club Rio",
        category: "clubs",
        location: "651 Bowie St",
        rank: 6,
        rating: 4.4,
        vibe: 86,
        crowd: 89,
        music: 87,
        service: 83
    },
    {
        id: 7,
        name: "The Lonesome Rose",
        category: "bars",
        location: "2114 N St Mary's St",
        rank: 7,
        rating: 4.4,
        vibe: 87,
        crowd: 86,
        music: 84,
        service: 86
    },
    {
        id: 8,
        name: "Jazz, TX",
        category: "live-music",
        location: "312 Pearl Pkwy",
        rank: 8,
        rating: 4.3,
        vibe: 85,
        crowd: 82,
        music: 90,
        service: 84
    },
    {
        id: 9,
        name: "The Luxury",
        category: "lounges",
        location: "103 E Jones Ave",
        rank: 9,
        rating: 4.3,
        vibe: 84,
        crowd: 83,
        music: 80,
        service: 88
    },
    {
        id: 10,
        name: "Bar 1919",
        category: "bars",
        location: "1420 S Alamo St",
        rank: 10,
        rating: 4.2,
        vibe: 83,
        crowd: 81,
        music: 79,
        service: 87
    },
    {
        id: 11,
        name: "Alamo Beer Company",
        category: "bars",
        location: "202 Lamar St",
        rank: 11,
        rating: 4.2,
        vibe: 82,
        crowd: 84,
        music: 78,
        service: 85
    },
    {
        id: 12,
        name: "Ticket Sports Pub",
        category: "bars",
        location: "401 E Commerce St",
        rank: 12,
        rating: 4.1,
        vibe: 81,
        crowd: 80,
        music: 77,
        service: 84
    }
];

// State management
let currentCategory = 'all';
let currentSort = 'rank';
let filteredVenues = [...venuesData];

// DOM elements
const rankingsGrid = document.getElementById('rankingsGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterButtons = document.querySelectorAll('.filter-btn');
const menuToggle = document.getElementById('menuToggle');
const navList = document.querySelector('.nav-list');

// Initialize the app
function init() {
    renderVenues();
    setupEventListeners();
}

// Render venue cards
function renderVenues() {
    rankingsGrid.innerHTML = '';
    
    if (filteredVenues.length === 0) {
        rankingsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <h3>No venues found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
        return;
    }

    filteredVenues.forEach(venue => {
        const card = createVenueCard(venue);
        rankingsGrid.appendChild(card);
    });
}

// Create a venue card element
function createVenueCard(venue) {
    const card = document.createElement('div');
    card.className = 'venue-card';
    card.setAttribute('data-category', venue.category);
    
    const rankClass = venue.rank <= 3 ? 'top-3' : '';
    const stars = '★'.repeat(Math.floor(venue.rating)) + (venue.rating % 1 >= 0.5 ? '½' : '');
    
    card.innerHTML = `
        <div class="venue-rank ${rankClass}">${venue.rank}</div>
        <div class="venue-header">
            <h3 class="venue-name">${venue.name}</h3>
            <span class="venue-category">${formatCategory(venue.category)}</span>
            <p class="venue-location">📍 ${venue.location}</p>
        </div>
        <div class="venue-stats">
            <div class="stat">
                <div class="stat-value">${venue.vibe}</div>
                <div class="stat-label">Vibe</div>
            </div>
            <div class="stat">
                <div class="stat-value">${venue.crowd}</div>
                <div class="stat-label">Crowd</div>
            </div>
            <div class="stat">
                <div class="stat-value">${venue.music}</div>
                <div class="stat-label">Music</div>
            </div>
            <div class="stat">
                <div class="stat-value">${venue.service}</div>
                <div class="stat-label">Service</div>
            </div>
        </div>
        <div class="venue-rating">
            <span class="stars">${stars}</span>
            <span class="rating-number">${venue.rating}</span>
        </div>
    `;
    
    return card;
}

// Format category name
function formatCategory(category) {
    const categoryNames = {
        'bars': 'Bar',
        'clubs': 'Club',
        'lounges': 'Lounge',
        'live-music': 'Live Music'
    };
    return categoryNames[category] || category;
}

// Filter venues by category
function filterByCategory(category) {
    currentCategory = category;
    applyFilters();
}

// Search venues
function searchVenues(query) {
    applyFilters(query);
}

// Sort venues
function sortVenues(sortBy) {
    currentSort = sortBy;
    
    switch(sortBy) {
        case 'rank':
            filteredVenues.sort((a, b) => a.rank - b.rank);
            break;
        case 'rating':
            filteredVenues.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            filteredVenues.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    renderVenues();
}

// Apply all filters
function applyFilters(searchQuery = '') {
    filteredVenues = venuesData.filter(venue => {
        // Category filter
        const categoryMatch = currentCategory === 'all' || venue.category === currentCategory;
        
        // Search filter
        const query = searchQuery.toLowerCase() || searchInput.value.toLowerCase();
        const searchMatch = !query || 
            venue.name.toLowerCase().includes(query) ||
            venue.location.toLowerCase().includes(query) ||
            formatCategory(venue.category).toLowerCase().includes(query);
        
        return categoryMatch && searchMatch;
    });
    
    sortVenues(currentSort);
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterByCategory(button.dataset.category);
        });
    });
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchVenues(e.target.value);
    });
    
    // Search button
    document.querySelector('.search-button').addEventListener('click', () => {
        searchVenues(searchInput.value);
    });
    
    // Sort select
    sortSelect.addEventListener('change', (e) => {
        sortVenues(e.target.value);
    });
    
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                navList.classList.remove('active');
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && navList.classList.contains('active')) {
            navList.classList.remove('active');
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
