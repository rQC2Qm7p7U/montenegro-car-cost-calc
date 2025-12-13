# Montenegro Car Import Cost Calculator

An interactive web tool for logistics teams and car dealers to estimate the landed cost of importing multiple vehicles into Montenegro. The calculator models container freight, customs, VAT, translation/homologation fees, and supports both private buyers and companies with VAT refunds. Currency inputs accept EUR or KRW, exchange rates can be refreshed live, and results can be exported as a PDF for sharing with clients.

## Features
- Multi-vehicle support with container-aware limits (20ft up to 2 cars, 40ft up to 4) and per-car price inputs in EUR or KRW (with raw/₩10k modes).
- Live FX updates for KRW/EUR and USD/EUR via exchangerate-api.com with range validation, fallback rates, and manual override plus optional auto-refresh.
- Per-car and aggregate breakdowns: CIF, customs duty, VAT, port agent costs, translations, homologation, speditor fee, misc charges, and VAT refund scenario for companies.
- State persistence and sharing: calculator state is stored in `localStorage` and mirrored to the URL so scenarios can be bookmarked or shared.
- Exportable reports: generates a PDF summary of assumptions and results; results are also shown in a responsive bottom sheet with quick scenario toggles.
- Theming and UX niceties: light/dark toggle, toast notifications, debounced inputs, and mobile-friendly layout.

## Tech Stack
- React 18 + TypeScript, Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query for data fetching
- Vitest for unit testing

## Getting Started
Prerequisites: Node.js 18+ and npm installed.

```sh
npm install        # Install dependencies
npm run dev        # Start the Vite dev server
```

Open the printed local URL (typically http://localhost:5173) to use the calculator.

## Available Scripts
- `npm run dev` – run the app locally with hot reload.
- `npm run build` – production build to `dist/`.
- `npm run preview` – preview the production build locally.
- `npm run lint` – lint the codebase with ESLint.
- `npm run test` – run the Vitest suite.

## Domain Logic & Key Files
- `src/lib/carImport.ts` – core cost model: freight by container type, port agent fees, CIF/customs/VAT math, per-car rollups.
- `src/components/Calculator.tsx` – main UI state machine, FX handling, persistence, and section composition.
- `src/components/calculator/*` – input sections (vehicle details, currency rates, car prices) and results bottom sheet with PDF export.
- `src/hooks/useCalculatorPersistence.ts` – syncs calculator state to `localStorage` and the URL.
- `src/utils/currency.ts` – FX fetching with sane bounds plus format/parse helpers for KRW/EUR.

## Usage Notes
1) Select container size and number of cars; enter vehicle prices in EUR or KRW.  
2) Refresh or override exchange rates; toggle auto-update if desired.  
3) Adjust customs duty, VAT, translation pages, homologation, and miscellaneous costs as needed.  
4) Toggle between Physical/Company scenarios to see VAT refund impact, then export the PDF report for clients.

Default assumptions (adjust in the UI or in `src/lib/carImport.ts`): freight `$3150`/`$4150` for 20ft/40ft, local port handling `€350`/`€420`, translations `€35` per page, and speditor fee `€150 + 21% VAT`.
