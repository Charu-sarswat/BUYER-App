# Buyer Lead Management App

A modern, professional Next.js application for managing real estate buyer leads with comprehensive features including authentication, CSV import/export, real-time updates, and advanced filtering.

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### 1. Clone and Install
```bash
git clone <repository-url>
cd buyer-app
npm install
```

### 2. Environment Setup
```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_app"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration (Optional - for email notifications)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with demo users
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Demo Credentials
- **Admin**: `admin@buyerapp.com` / `admin123`
- **User**: `demo@example.com` / `demo123`

## Design Notes

### Where Validation Lives
- **Client-side**: Zod schemas with user-friendly form values (e.g., "0-3m" for timeline)
- **Server-side**: Transformed schemas that convert form values to database enum values
- **CSV Import**: Separate validation pipeline with transform functions for bulk data
- **Location**: `lib/schemas.ts` contains all validation logic

### SSR vs Client
- **Server Components**: Used for initial page loads and SEO-critical content
- **Client Components**: Used for interactive forms, real-time updates, and user interactions
- **API Routes**: All data mutations go through API routes with proper validation
- **Hybrid Approach**: Leverages Next.js App Router for optimal performance

### Ownership Enforcement
- **Database Level**: `ownerId` foreign key constraint ensures data integrity
- **API Level**: All buyer operations check `session.user.id` against `buyer.ownerId`
- **UI Level**: Users only see their own buyers in "My Buyers" section
- **Middleware**: Authentication required for all buyer-related routes

### Security Features
- **Rate Limiting**: In-memory rate limiting (20 creates/15min, 30 updates/15min, 5 imports/hour)
- **Password Hashing**: bcrypt with salt rounds of 12
- **Session Management**: JWT-based sessions with database storage
- **Input Validation**: Comprehensive Zod schemas prevent injection attacks
- **CSRF Protection**: Built-in NextAuth.js CSRF protection

## 📊 Database Schema

### Core Models
```sql
-- Users with role-based access
User {
  id: String (Primary Key)
  email: String (Unique)
  name: String
  password: String (Hashed)
  role: Enum (USER, ADMIN)
  createdAt: DateTime
  updatedAt: DateTime
}

-- Buyer leads with comprehensive tracking
Buyer {
  id: String (Primary Key)
  fullName: String
  email: String (Optional)
  phone: String
  city: Enum (Chandigarh, Mohali, Zirakpur, Panchkula, Other)
  propertyType: Enum (Apartment, Villa, Plot, Office, Retail)
  bhk: Enum (ONE, TWO, THREE, FOUR, Studio) -- Required for Apartment/Villa
  purpose: Enum (Buy, Rent)
  budgetMin: Int (Optional, in INR)
  budgetMax: Int (Optional, in INR)
  timeline: Enum (ZERO_TO_THREE_MONTHS, THREE_TO_SIX_MONTHS, MORE_THAN_SIX_MONTHS, Exploring)
  source: Enum (Website, Referral, Walk_in, Call, Other)
  notes: String (Optional)
  tags: String (Optional, JSON array)
  status: Enum (New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped)
  ownerId: String (Foreign Key to User)
  createdAt: DateTime
  updatedAt: DateTime
}

-- Change tracking for audit trail
BuyerHistory {
  id: String (Primary Key)
  buyerId: String (Foreign Key to Buyer)
  field: String (Field name that changed)
  oldValue: String (Previous value)
  newValue: String (New value)
  changedBy: String (User ID who made the change)
  createdAt: DateTime
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth.js endpoints

### Buyers Management
- `GET /api/buyers` - List all buyers (admin) or user's buyers with pagination/filters
- `POST /api/buyers` - Create new buyer lead
- `GET /api/buyers/[id]` - Get buyer details with history
- `PATCH /api/buyers/[id]` - Update buyer (with concurrency check)
- `DELETE /api/buyers/[id]` - Delete buyer

### User-Specific Operations
- `GET /api/buyers/my-buyers` - Get current user's buyers
- `GET /api/buyers/[id]/history` - Get buyer change history

### Import/Export
- `POST /api/buyers/import` - Import buyers from CSV (max 200 rows)
- `GET /api/buyers/export` - Export filtered buyers to CSV

## 📋 CSV Import/Export

### Import Format
```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,8000000,0-3m,Website,Interested in 2BHK,premium
Jane Smith,jane@example.com,,Mohali,Plot,,Rent,,,3-6m,Referral,Looking for investment,investor
```

### Required Fields
- `fullName`: Buyer's full name (2-80 characters)
- `phone`: Phone number (10-15 digits)
- `city`: One of: Chandigarh, Mohali, Zirakpur, Panchkula, Other
- `propertyType`: One of: Apartment, Villa, Plot, Office, Retail
- `purpose`: One of: Buy, Rent
- `timeline`: One of: 0-3m, 3-6m, >6m, Exploring

### Conditional Fields
- `bhk`: Required for Apartment and Villa (1, 2, 3, 4, Studio)

### Optional Fields
- `email`: Valid email address
- `budgetMin`: Minimum budget in INR
- `budgetMax`: Maximum budget in INR
- `source`: Lead source
- `notes`: Additional notes (max 1000 characters)
- `tags`: Comma-separated tags

## 🎨 UI/UX Features

### Modern Design System
- **Typography**: Poppins font family for professional appearance
- **Colors**: Blue-based color scheme with professional gradients
- **Components**: Custom shadcn/ui components with enhanced styling
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design with Tailwind CSS

### Key Components
- **BuyersList**: Paginated table with advanced filtering and search
- **MyBuyersList**: Card-based layout for user's personal buyers
- **NewBuyerForm**: Comprehensive form with conditional fields
- **BuyerDetail**: Detailed view with inline editing capabilities
- **Authentication**: Clean sign-in/sign-up forms

## 🧪 Testing

### Test Coverage
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Tested Features
- CSV validation with edge cases
- Schema validation for all buyer fields
- Error handling for invalid data
- CSV parsing with quoted fields and escaped characters

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
EMAIL_SERVER_HOST="your-smtp-host"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="your-email"
```

## 📝 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## What's Done vs Skipped (and Why)

### ✅ What's Done

#### Core Features
- **User Authentication**: Email/password with NextAuth.js
- **Buyer CRUD**: Create, read, update, delete buyer leads
- **Ownership Model**: Users can only access their own buyers
- **CSV Import/Export**: Bulk operations with validation
- **Advanced Filtering**: Filter by city, property type, status, timeline
- **Search Functionality**: Full-text search across buyer data
- **Change Tracking**: Complete audit trail for all modifications
- **Rate Limiting**: Protection against abuse
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript with Zod validation

#### UI/UX Features
- **Modern Design**: Professional blue theme with Poppins font
- **Component Library**: Custom shadcn/ui components
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Consistent loading indicators
- **Empty States**: Helpful empty state components

#### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Client and server-side validation with Zod
- **Security**: Password hashing, session management, CSRF protection
- **Testing**: Jest unit tests for critical functionality
- **Performance**: Optimized queries with proper indexing

### ❌ What's Skipped (and Why)

#### Advanced Features (Future Enhancements)
- **Email Notifications**: Skipped to keep MVP focused on core functionality
- **File Attachments**: Not required for initial buyer management
- **Advanced Analytics**: Dashboard with charts and metrics (future feature)
- **Multi-tenant Support**: Single organization focus for simplicity
- **Real-time Collaboration**: WebSocket updates (future enhancement)
- **Mobile App**: Web-first approach with responsive design
- **Advanced Permissions**: Simple USER/ADMIN roles sufficient for MVP

#### Technical Decisions
- **Redis Caching**: In-memory rate limiting sufficient for current scale
- **Message Queue**: Direct database operations for simplicity
- **Microservices**: Monolithic approach for easier development and deployment
- **GraphQL**: REST API sufficient for current data complexity

## 🔒 Security Considerations

### Implemented Security
- Password hashing with bcrypt
- JWT session management
- CSRF protection via NextAuth.js
- Input validation and sanitization
- Rate limiting on API endpoints
- SQL injection protection via Prisma

### Production Recommendations
- Use environment variables for all secrets
- Implement proper CORS policies
- Add request logging and monitoring
- Consider implementing API key authentication for external access
- Regular security audits and dependency updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ using Next.js, TypeScript, Prisma, and Tailwind CSS**