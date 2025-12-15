# SATX Nightlife Power Rankings

A modern, responsive web application for ranking and discovering the best nightlife venues in San Antonio, Texas.

## Features

- **Power Rankings Dashboard**: View real-time rankings of bars, clubs, lounges, and live music venues
- **Category Filtering**: Filter venues by type (Bars, Clubs, Lounges, Live Music)
- **Search Functionality**: Search venues by name, location, or category
- **Sorting Options**: Sort by rank, rating, or name
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Interactive UI**: Modern dark theme with smooth animations and transitions

## Getting Started

### Opening the Application

Simply open `index.html` in any modern web browser:

1. Navigate to the project directory
2. Double-click `index.html` or right-click and select "Open with Browser"
3. Alternatively, use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server
   ```
4. Open your browser to `http://localhost:8000`

## Project Structure

```
satx-nightlife-power-rankings/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and data
└── README.md          # Project documentation
```

## Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and CSS Variables
- **JavaScript (Vanilla)**: Interactive functionality without dependencies
- **Responsive Design**: Mobile-first approach with media queries

## Features Breakdown

### Dashboard
- Display venue cards with ranking information
- Color-coded rank badges (gold for top 3)
- Stats showing vibe, crowd, music, and service scores
- Star ratings for each venue

### Filtering & Search
- Filter by venue category
- Real-time search across names and locations
- Sort by multiple criteria

### Responsive Layout
- Desktop: Multi-column grid layout
- Tablet: Adaptive grid
- Mobile: Single column with touch-friendly controls

## Customization

### Adding New Venues

Edit the `venuesData` array in `script.js`:

```javascript
{
    id: 13,
    name: "New Venue Name",
    category: "bars", // or "clubs", "lounges", "live-music"
    location: "Street Address",
    rank: 13,
    rating: 4.5,
    vibe: 85,
    crowd: 88,
    music: 80,
    service: 87
}
```

### Styling

Modify CSS variables in `styles.css` to customize colors:

```css
:root {
    --primary-color: #6200ea;
    --secondary-color: #03dac6;
    --accent-color: #ff6b35;
    --dark-bg: #121212;
    /* ... more variables ... */
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- Backend integration for real-time data
- User authentication and voting system
- Venue detail pages with photos and reviews
- Integration with Google Maps
- Social sharing features
- Admin dashboard for managing rankings

## License

This project is open source and available for educational and commercial use.

## Contact

For questions or suggestions about the SATX Nightlife Power Rankings, please open an issue on GitHub.