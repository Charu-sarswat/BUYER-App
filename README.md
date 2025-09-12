# Buyer Lead Intake Mini App

A comprehensive Next.js application for managing buyer leads with features like form validation, CSV import/export, authentication, and real-time updates.

## 🚀 Features

### Core Functionality
- **Buyer Management**: Create, view, edit, and delete buyer leads
- **Advanced Filtering**: Filter by city, property type, status, timeline, and search
- **CSV Import/Export**: Bulk import up to 200 rows with validation, export filtered data
- **Authentication**: Email-based authentication using NextAuth.js
- **Real-time Updates**: Track changes with buyer history
- **Concurrency Control**: Prevent conflicts with optimistic locking

### Technical Features
- **Type Safety**: Full TypeScript support with Zod validation
- **Database**: Prisma ORM with SQLite/PostgreSQL support
- **Rate Limiting**: In-memory rate limiting for API endpoints
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Accessibility**: ARIA labels, focus management, and screen reader support
- **Testing**: Jest unit tests for CSV validation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (default) or PostgreSQL

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd buyer-lead-intake
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Email (for demo purposes)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="your-email@gmail.com"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### Buyers Table
```sql
- id: String (Primary Key)
- fullName: String (Required)
- email: String (Required, Unique)
- phone: String (Optional)
- city: String (Required)
- propertyType: Enum (APARTMENT, VILLA, PLOT, OTHER)
- bhk: Int (Optional, Required for APARTMENT/VILLA)
- purpose: Enum (INVESTMENT, END_USE, BOTH)
- budgetMin: Float (Optional)
- budgetMax: Float (Optional)
- timeline: Enum (IMMEDIATE, ZERO_TO_THREE, THREE_TO_SIX, SIX_TO_TWELVE, MORE_THAN_TWELVE)
- source: String (Optional)
- notes: String (Optional)
- tags: String (Optional, JSON array)
- status: Enum (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATING, CLOSED_WON, CLOSED_LOST)
- ownerId: String (Foreign Key to User)
- createdAt: DateTime
- updatedAt: DateTime
```

### Buyer History Table
```sql
- id: String (Primary Key)
- buyerId: String (Foreign Key to Buyer)
- field: String (Field name that changed)
- oldValue: String (Previous value)
- newValue: String (New value)
- changedBy: String (User ID who made the change)
- createdAt: DateTime
```

## 🔧 API Endpoints

### Buyers
- `GET /api/buyers` - List buyers with pagination and filters
- `POST /api/buyers` - Create a new buyer
- `GET /api/buyers/[id]` - Get buyer details with history
- `PATCH /api/buyers/[id]` - Update buyer (with concurrency check)
- `DELETE /api/buyers/[id]` - Delete buyer

### Import/Export
- `POST /api/buyers/import` - Import buyers from CSV
- `GET /api/buyers/export` - Export buyers to CSV

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth.js endpoints

## 📊 CSV Format

### Import Format
```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
John Doe,john@example.com,+1234567890,Mumbai,APARTMENT,2,INVESTMENT,5000000,8000000,IMMEDIATE,Website,Interested in 2BHK,premium
Jane Smith,jane@example.com,,Delhi,PLOT,,END_USE,,,THREE_TO_SIX,,,
```

### Required Fields
- `fullName`: Buyer's full name
- `email`: Valid email address
- `city`: City name
- `propertyType`: APARTMENT, VILLA, PLOT, or OTHER
- `purpose`: INVESTMENT, END_USE, or BOTH
- `timeline`: IMMEDIATE, ZERO_TO_THREE, THREE_TO_SIX, SIX_TO_TWELVE, or MORE_THAN_TWELVE

### Conditional Fields
- `bhk`: Required for APARTMENT and VILLA property types

### Optional Fields
- `phone`: Phone number
- `budgetMin`: Minimum budget
- `budgetMax`: Maximum budget
- `source`: Lead source
- `notes`: Additional notes
- `tags`: Comma-separated tags

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage
- CSV validation with various edge cases
- Schema validation for all buyer fields
- Error handling for invalid data
- CSV parsing with quoted fields and escaped characters

## 🎨 UI Components

### Form Components
- **NewBuyerForm**: Create new buyer with conditional BHK field
- **BuyerDetail**: View and edit buyer with inline editing
- **SignInForm**: Email-based authentication

### List Components
- **BuyersList**: Paginated list with filters and search
- **BuyersNav**: Navigation with user info

### Utility Components
- **ErrorMessage**: Accessible error display with auto-dismiss
- **LoadingSpinner**: Consistent loading states
- **EmptyState**: Empty state with call-to-action

## 🔒 Security Features

### Rate Limiting
- **Create**: 20 requests per 15 minutes
- **Update**: 30 requests per 15 minutes
- **Import**: 5 requests per hour

### Authentication
- Email-based authentication
- Session management with database storage
- Role-based access control (USER/ADMIN)

### Data Validation
- Zod schema validation on all inputs
- SQL injection protection via Prisma
- XSS protection with proper escaping

## ♿ Accessibility Features

### ARIA Support
- `role="alert"` for error messages
- `aria-live="polite"` for dynamic content
- `aria-invalid` and `aria-describedby` for form fields

### Keyboard Navigation
- Tab order follows logical flow
- Enter key submits forms
- Escape key dismisses modals

### Screen Reader Support
- Semantic HTML structure
- Descriptive labels and instructions
- Error messages announced immediately

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Docker
```bash
# Build image
docker build -t buyer-lead-intake .

# Run container
docker run -p 3000:3000 buyer-lead-intake
```

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
npm run db:studio    # Open Prisma Studio

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **React 18** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

### Backend
- **Next.js API Routes** for serverless functions
- **Prisma ORM** for database operations
- **NextAuth.js** for authentication
- **Zod** for schema validation

### Database
- **SQLite** (development) / **PostgreSQL** (production)
- **Prisma Migrations** for schema management
- **Connection pooling** for performance

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

## 🔄 Changelog

### v1.0.0
- Initial release
- Buyer CRUD operations
- CSV import/export
- Authentication system
- Rate limiting
- Comprehensive testing
- Accessibility features
#   B U Y E R - A p p 
 
