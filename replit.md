# DSS Employee Selection System

## Overview

This is a Decision Support System (DSS) for employee selection that uses a weighted scoring algorithm to evaluate and rank job candidates. The system allows HR professionals to upload candidate data via Excel files, configure scoring weights for different criteria, and automatically calculate final scores to aid in hiring decisions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for file uploads, SheetJS (XLSX) for Excel processing
- **Validation**: Zod for runtime type validation

### Full-Stack Integration
- **Monorepo Structure**: Single repository with client, server, and shared code
- **Shared Types**: Common schema definitions in `/shared` directory
- **Development**: Concurrent client and server development with Vite proxy

## Key Components

### Data Models
- **Candidates Table**: Stores candidate information including name, experience, education level, interview score, age, and calculated final score
- **Scoring System**: Configurable weights for experience (25%), education (20%), interview (40%), and age (15%)

### Core Features
1. **Excel Upload Processing**: Validates and processes Excel files with candidate data
2. **Weighted Scoring Algorithm**: Normalizes criteria to 0-100 scale and applies configurable weights
3. **Real-time Score Calculation**: Automatic recalculation when weights are modified
4. **Data Export**: Export results back to Excel format
5. **Search and Filtering**: Client-side search and sorting capabilities

### UI Components
- **Dashboard**: Main interface showing candidate data and controls
- **Upload Section**: Drag-and-drop Excel file upload with validation
- **Weighting Panel**: Interactive sliders for adjusting scoring criteria weights
- **Candidate Table**: Responsive table with ranking, scores, and status indicators
- **Statistics Summary**: Overview cards showing total candidates, recommendations, and averages

## Data Flow

1. **File Upload**: Excel files are uploaded via multipart form data
2. **Data Validation**: Server validates Excel structure and data types using Zod schemas
3. **Score Calculation**: Weighted scoring algorithm processes candidate data
4. **Database Storage**: Validated candidates are stored with calculated scores
5. **Client Updates**: TanStack Query automatically refetches and updates UI
6. **Weight Adjustment**: Real-time recalculation when scoring weights are modified

### Scoring Algorithm
- **Experience**: Years of experience normalized (cap at 10 years = 100%)
- **Education**: 1-5 scale converted to 0-100%
- **Interview**: Direct 0-100 score
- **Age**: Optimal age around 30 with decline formula
- **Final Score**: Weighted average of all normalized criteria

## External Dependencies

### Core Runtime
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe database ORM
- **express**: Web application framework
- **multer**: File upload middleware
- **xlsx**: Excel file processing

### Frontend Libraries
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form state management
- **wouter**: Lightweight routing

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Development
- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Development Server**: Concurrent client (port 5173) and server (port 5000)

### Production
- **Deployment Target**: Replit Autoscale
- **Build Command**: `npm run build` (builds both client and server)
- **Start Command**: `npm run start` (serves bundled application)
- **Port Configuration**: External port 80 maps to internal port 5000

### Database Configuration
- **Connection**: PostgreSQL via DATABASE_URL environment variable
- **Migrations**: Drizzle Kit for schema management
- **Schema**: Located in `/shared/schema.ts` for type sharing

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```