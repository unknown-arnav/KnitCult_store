# KnitCult - Minimalist Soccer Jersey Store MVP

## User Personas & Requirements
- **Target Users**: Football jersey collectors, streetwear enthusiasts, and fans seeking retro match-grade soccer kits.
- **Design Philosophy**: Minimalist monochrome aesthetic (Black & White palette with sharp grey/zinc accents, NO PURPLE).
- **Core User Flow**:
  1. **Authentication / Sign-in**: Guest & simulated email sign-in / registration with persistent profile state.
  2. **Home Page**: Minimalist hero with category switchers, manifesto quote, and trending featured jerseys.
  3. **Catalog & Search**: Advanced multi-filter search (league, club, era/year, max price slider, sorting).
  4. **Product Detail View**: Size selector, player printing customizer (official legends + custom name/number input), and image gallery.
  5. **Cart Drawer**: Real-time bag management, quantity adjustment, and subtotal/shipping calculator.
  6. **Checkout & Order Tracking**: Multi-step simulated secure checkout (shipping address, test credit card payment) leading to instant order confirmation and live tracking ID.

## Mocked in Frontend
- All jersey catalog items, inventory states, and simulated orders currently live in `/app/frontend/src/mock.js` and React Context (`StoreContext.js`), ready to be connected to FastAPI & MongoDB in Phase 2.

## Next Action Items (Phase 2)
1. Wire FastAPI backend endpoints for `/api/jerseys`, `/api/orders`, and `/api/auth`.
2. Replace local context state with Axios API requests using `REACT_APP_BACKEND_URL`.
3. Seed MongoDB database with historical jersey catalog.
