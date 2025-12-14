# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### Added
- Initial release with multi-vehicle support (20ft & 40ft ISO containers)
- Live FX rate updates for KRW/USD and EUR/USD via exchangerate-api.com
- Per-vehicle and aggregate cost breakdowns including:
  - Cost, Insurance & Freight (CIF)
  - Customs Duty calculation
  - VAT with company refund scenario support
  - Port agent fees, translations, homologation, speditor fee
- State persistence: calculator state stored in localStorage and mirrored to URL
- PDF export functionality with detailed assumptions and results
- Light/dark theme toggle with responsive bottom sheet UI
- Mobile-friendly responsive design
- Toast notifications for user feedback

### Features
- Support for 20ft (2 vehicles) and 40ft (4 vehicles) ISO containers
- Currency inputs in EUR and KRW with raw/₩10k mode support
- Live FX rates with range validation, fallback rates, and manual override
- Optional auto-refresh for exchange rates
- Comprehensive cost breakdown per vehicle
- Scenario comparison (Physical vs Company)
- URL-based scenario sharing for bookmarking

### Tech Stack
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS for styling
- Radix UI components
- jsPDF for report generation
- Netlify for deployment
- TanStack Query for data fetching
- Vitest for testing

### Browser Support
- Chrome, Firefox, Safari, Edge (latest versions)
- iOS Safari and Chrome Mobile

---

## Unreleased

### Planned
- [ ] Multi-language support (RU, DE, ES)
- [ ] Additional country import calculations
- [ ] Historical exchange rate tracking
- [ ] Excel export format
- [ ] Rate alerts and notifications
- [ ] Bulk import/export via CSV
