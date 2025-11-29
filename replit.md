# AeroGuard: Aerial Threat Detection & Crowd Dispersion System

## Overview

AeroGuard is a real-time AI/DL system for detecting aerial threats (UAVs, drones) and managing crowd evacuation. The application features a command center dashboard with live threat detection, trajectory prediction, crowd density analysis, and GIS-based evacuation planning.

The system combines computer vision (YOLO, Faster R-CNN), predictive analytics (Kalman filters, LSTM), and geospatial mapping to provide comprehensive situational awareness and emergency response capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool

**UI Component Library**: shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS using a custom tactical/command center theme

**State Management**: TanStack Query (React Query) for server state, with local component state for UI interactions

**Routing**: Wouter for lightweight client-side routing

**Key Design Patterns**:
- Component-based architecture with reusable UI primitives
- Custom tactical theme with cyan/teal accents on dark backgrounds
- Real-time data visualization using Recharts for graphs and React Leaflet for mapping
- Responsive layout with mobile support via drawer/sheet patterns

**Notable UI Features**:
- Live video feed simulation with threat detection overlays
- Interactive map with threat markers and trajectories
- Real-time alert feed with severity-based styling
- Image upload and analysis interface
- Dataset selector for viewing historical threat data

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with `/api/*` routes, returning JSON responses

**Development Mode**: Vite dev server integrated with Express for HMR (Hot Module Reload)

**Production Mode**: Static file serving of built React application

**Key Routes**:
- `GET /api/datasets` - Retrieve all threat datasets
- `GET /api/datasets/:id` - Get specific dataset details
- `POST /api/analyze` - Upload and analyze images for threats

**Data Storage**: Currently using in-memory storage (MemStorage class) with plans for PostgreSQL integration via Drizzle ORM

**File Upload**: Multer middleware for handling multipart/form-data image uploads (10MB limit)

### Data Layer

**ORM**: Drizzle ORM configured for PostgreSQL with schema defined in `shared/schema.ts`

**Database Schema**:
- `users` table - User authentication (id, username, password)
- `analyses` table - Threat analysis results (imageUrl, threatCount, crowdCount, density, status, detections)
- `threatDatasets` table - Historical threat data with geospatial coordinates and statistics

**Migration Strategy**: Drizzle Kit for schema migrations via `db:push` script

**Current State**: Application works with in-memory storage; PostgreSQL integration ready but not yet activated

### Build and Deployment

**Build Process**: 
- Client built with Vite, outputs to `dist/public`
- Server bundled with esbuild to `dist/index.cjs`
- Custom build script (`script/build.ts`) orchestrates both builds
- Selective bundling of dependencies to reduce cold start times

**Development Workflow**:
- `npm run dev` - Runs Express server with Vite middleware for HMR
- `npm run dev:client` - Standalone Vite dev server
- TypeScript type checking via `npm run check`

**Production**: 
- Single bundled Node.js server serving static assets
- Environment-based configuration via `NODE_ENV`

### Authentication and Session Management

**Planned Implementation**: User authentication with passport.js (passport-local strategy)

**Session Storage**: Configured for PostgreSQL session store via connect-pg-simple (currently not active)

**Current State**: Authentication infrastructure defined in schema but not yet implemented in routes

## External Dependencies

### AI/ML Services (Planned)

The attached Python files indicate integration with:
- **YOLO** (YOLOv8) for real-time object detection
- **Faster R-CNN** for classification verification
- **TensorFlow/PyTorch** for deep learning models
- **Kalman Filters** for trajectory prediction
- **LSTM/RNN** for time-series prediction

These are referenced in the application but not yet integrated with the Express backend.

### Database

**Neon PostgreSQL**: Configured via `@neondatabase/serverless` driver for serverless Postgres

**Connection**: Environment variable `DATABASE_URL` required for database connectivity

### Mapping Services

**Leaflet**: Open-source mapping library for interactive maps

**Map Tiles**: Default OpenStreetMap tiles (no API key required)

**Geospatial Libraries**: 
- react-leaflet for React integration
- Types from @types/leaflet and @types/react-leaflet

### UI Component Dependencies

**Radix UI**: Comprehensive set of accessible, unstyled React components (@radix-ui/react-*)

**Tailwind CSS**: Utility-first CSS framework with custom configuration

**Additional Libraries**:
- Recharts for data visualization
- framer-motion for animations
- date-fns for date manipulation
- lucide-react for icons

### Development Tools (Replit-specific)

**Replit Plugins**:
- `@replit/vite-plugin-cartographer` - Development mode code mapping
- `@replit/vite-plugin-dev-banner` - Development banner
- `@replit/vite-plugin-runtime-error-modal` - Runtime error overlay
- Custom `vite-plugin-meta-images` for OpenGraph image URL management

### File Upload and Processing

**Multer**: Multipart form data handling for image uploads

**Sharp**: Image processing library (referenced in dependencies)

### API Clients (Potential)

**OpenAI**: OpenAI SDK for potential AI integration

**Google Generative AI**: Google's generative AI SDK

**Stripe**: Payment processing (for potential premium features)

### Communication

**WebSocket**: Native WebSocket support via `ws` library for real-time updates

**Nodemailer**: Email sending capability (for alerts/notifications)