# Contributing to SATX Nightlife Power Rankings

Thank you for your interest in contributing to SATX Nightlife Power Rankings!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Set up your `.env` file (see `.env.example`)
5. Set up PostgreSQL with PostGIS
6. Run migrations: `npm run db:push`
7. Seed the database: `npm run db:seed`
8. Start dev server: `npm run dev`

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier recommended)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and reusable

## Testing

Before submitting a PR:

1. Test your changes locally
2. Ensure the build works: `npm run build`
3. Check for TypeScript errors
4. Test mobile responsiveness
5. Test PWA functionality if changed

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Update documentation if needed
4. Test thoroughly
5. Submit a PR with a clear description
6. Link any related issues

## API Usage Guidelines

**IMPORTANT**: This project only uses official APIs with proper authentication:

- Google Places API (with valid API key)
- Yelp Fusion API (with valid API key)
- No web scraping
- No ToS violations

When adding new data sources, ensure they are:
- Official APIs with proper authentication
- Compliant with their Terms of Service
- Documented in the README

## Data Privacy

- Do not commit API keys or secrets
- Use environment variables for all sensitive data
- Follow GDPR/CCPA guidelines for user data
- Minimize personal data collection

## Questions?

Open an issue for discussion before starting major changes.

Thank you for contributing!
