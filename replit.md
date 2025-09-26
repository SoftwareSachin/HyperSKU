# HyperLocal Forecast - Enterprise Inventory Forecasting Platform

## Overview

HyperLocal Forecast is a lightweight, developer-friendly SaaS platform that provides AI-powered demand forecasting for retail stores, dark-stores, and quick-commerce operations. The system ingests POS/ERP data and delivers 7-day per-SKU probabilistic forecasts with lead-time aware reorder suggestions, anomaly detection, and interactive dashboards to help stores optimize inventory management and reduce stockouts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component system, styled with Tailwind CSS
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Charts**: Recharts for data visualization and forecast plotting

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with standardized error handling and logging middleware
- **Authentication**: Replit Auth integration with session-based authentication
- **Authorization**: Role-based access control (RBAC) with organization-level multi-tenancy
- **Services**: Modular service architecture for forecasting, anomaly detection, CSV processing, notifications, and exports

### Database & ORM
- **Database**: PostgreSQL with Neon serverless database provider
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema**: Multi-tenant design with organizations, stores, SKUs, suppliers, sales, inventory, forecasts, reorders, and anomalies
- **Migrations**: Drizzle Kit for database schema management and migrations

### Data Processing & Analytics
- **Forecasting Engine**: Statistical models using time series analysis with seasonal decomposition
- **Anomaly Detection**: Pattern-based anomaly detection for demand spikes, inventory discrepancies, and forecast accuracy monitoring
- **CSV Processing**: Flexible data ingestion system supporting sales, inventory, and SKU data imports
- **Reorder Logic**: Lead-time aware inventory replenishment calculations with conservative and aggressive suggestions

### Business Logic Services
- **Forecast Service**: Generates 7-day probabilistic forecasts (median, P10, P90) using historical sales data
- **Anomaly Detection Service**: Identifies unusual patterns in sales and inventory data
- **CSV Processor**: Validates and imports data from various sources with error handling
- **Notification Service**: SendGrid integration for email alerts on stockouts, anomalies, and forecast accuracy
- **Export Service**: Generates CSV and PDF reports for forecasts and purchase orders

## External Dependencies

### Cloud Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Hosting**: Replit for development and deployment environment
- **Authentication**: Replit's OIDC authentication system

### Third-Party Services
- **Email**: SendGrid for transactional emails and notification system
- **Payments**: Stripe integration for billing and subscription management (React Stripe.js)
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

### Development Tools
- **Build**: Vite with esbuild for fast development and production builds
- **TypeScript**: Full-stack type safety with shared schema definitions
- **Linting**: ESLint configuration for code quality
- **CSS**: Tailwind CSS with CSS variables for theming and PostCSS for processing

### UI Dependencies
- **Component Library**: Comprehensive Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Form Validation**: Zod schema validation with React Hook Form resolvers
- **Styling**: Class Variance Authority (CVA) for component variant management
- **Charts**: Recharts for responsive data visualization