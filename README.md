# 🎮 Infinity Gaming Lounge POS System

A comprehensive, production-ready Point of Sale and management system designed specifically for gaming lounges and eSports centers. Built with modern technologies to handle customer management, gaming sessions, tournaments, inventory, and mobile payments.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

### 🎯 Core Management
- **Customer Management**: Complete customer profiles with loyalty tracking
- **Gaming Sessions**: Real-time session management with timer and billing
- **Station Management**: Multi-platform gaming station control (PC, PlayStation, Xbox, Nintendo, VR)
- **Game Library**: Comprehensive game catalog with genre categorization
- **Payment Processing**: Cash and M-Pesa STK Push integration

### 🏆 Advanced Features
- **Tournament System**: Full tournament management with brackets, matches, and rewards
- **Loyalty Program**: Tiered loyalty system (Bronze, Silver, Gold, Platinum)
- **Inventory Management**: Real-time stock tracking with automated updates
- **Analytics Dashboard**: Revenue trends, popular games, customer insights
- **Role-based Access**: Admin, Supervisor, and Cashier roles with appropriate permissions

### 🔒 Security & Compliance
- **Authentication**: Supabase Auth with middleware-protected routes
- **Row Level Security (RLS)**: Database-level security policies
- **Data Validation**: Comprehensive form validation with Zod schemas
- **Audit Trail**: Complete transaction and activity logging

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **ORM**: Direct Supabase client queries
- **File Storage**: Supabase Storage

### Payments & Integrations
- **Mobile Payments**: M-Pesa Daraja API (STK Push)
- **Payment Methods**: Cash, M-Pesa, Split payments
- **Webhooks**: Secure payment confirmation callbacks

### Analytics
- **Analytics**: Custom dashboard with real-time metrics
- **Reporting**: Revenue, customer, and operational reports

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- M-Pesa Daraja API credentials (optional, for mobile payments)

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/infinity-gaming-pos.git
cd infinity-gaming-pos
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the project root:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Public site URL for auth/reset links
NEXT_PUBLIC_SITE_URL=http://localhost:5000

# M-Pesa (Daraja API) - Optional
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=http://localhost:3000/api/mpesa-callback
MPESA_CALLBACK_SECRET=your-callback-secret
```

### 3. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire `database_setup.sql` file contents
4. Execute the script to create all tables, policies, and functions

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5000` to access the application (configured for Replit environment).

### 5. Build for Production
```bash
npm run build
npm start
```

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: System users with role-based access
- **customers**: Customer profiles and loyalty data
- **stations**: Gaming station configurations
- **games**: Game library with metadata
- **sessions**: Gaming session records
- **tournaments**: Tournament management
- **inventory_items**: Stock management
- **loyalty_transactions**: Points and rewards tracking
- **payments**: Payment processing records

## 🎮 Usage Guide

### Admin Dashboard
- Monitor real-time revenue and session metrics
- Manage gaming stations and game library
- Configure tournament brackets and rewards
- Oversee staff performance and analytics

### Cashier Operations
- Start/end gaming sessions
- Process payments (cash/M-Pesa)
- Manage customer check-ins
- Handle loyalty point redemptions

### Customer Management
- Register new customers
- Track loyalty points and tier status
- View session history and spending
- Process birthday rewards automatically

### Tournament System
- Create tournaments with multiple formats (knockout, round-robin)
- Manage participants and matches
- Track standings and results
- Distribute rewards automatically

## 🔧 Configuration

### Gaming Stations
Configure different types of gaming stations:
- **PC**: High-end gaming computers
- **PlayStation**: PS4/PS5 consoles
- **Xbox**: Xbox One/Series X|S
- **Nintendo**: Switch consoles
- **VR**: Virtual reality setups

### Loyalty Program
Automatic tier progression based on points:
- **Bronze**: 0-199 points
- **Silver**: 200-499 points
- **Gold**: 500-999 points
- **Platinum**: 1000+ points

### Payment Methods
- **Cash**: Traditional cash payments
- **M-Pesa**: Mobile money via STK Push
- **Split**: Combination of payment methods

## 🛡️ Security

The system implements multiple layers of security:

- **Authentication**: Secure user registration and login
- **Authorization**: Role-based access control
- **Database Security**: Row Level Security policies
- **API Protection**: Middleware-protected routes
- **Data Validation**: Server-side input validation
- **Audit Logging**: Complete activity tracking

## 🚀 Deployment

### Replit (Recommended for Development)
The project is pre-configured for Replit deployment:
1. Import the repository to Replit
2. Configure environment variables
3. Run the setup script
4. Deploy using Replit's hosting

### Vercel
```bash
npm i -g vercel
vercel
```


## 📈 Analytics & Reporting

The system provides comprehensive analytics:

- **Revenue Tracking**: Daily, weekly, monthly revenue trends
- **Customer Analytics**: New customers, retention, spending patterns
- **Popular Games**: Most played games and genres
- **Station Utilization**: Usage statistics per station
- **Staff Performance**: Revenue per staff member
- **Loyalty Insights**: Points distribution and tier analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing code style and conventions
- Add appropriate tests for new features
- Update documentation as needed
- Ensure all TypeScript checks pass

## 📝 API Documentation

### Payment Processing
- `POST /api/stk-push` - Initiate M-Pesa STK Push payment
- `POST /api/mpesa-callback` - M-Pesa webhook callback for payment confirmations

### Tournament Management
- `POST /api/tournaments/[id]/complete` - Complete a tournament and award rewards
- `POST /api/tournaments/rewards/[id]/award` - Award a specific tournament reward

### Authentication
Authentication is handled through Supabase Auth with the following pages:
- `/login` - User login page
- `/signup` - User registration page  
- `/forgot-password` - Password reset page
- `/auth/update-password` - Password update page

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify Supabase credentials in `.env.local`
- Check network connectivity
- Ensure RLS policies are properly configured

**M-Pesa Payment Failures**
- Verify Daraja API credentials
- Check callback URL configuration
- Ensure proper network access for webhooks

**Authentication Problems**
- Clear browser cache and cookies
- Verify Supabase Auth configuration
- Check redirect URLs in Supabase dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the icon library
- [Recharts](https://recharts.org/) for the analytics charts

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation and troubleshooting guide
- Review the database setup instructions

---

Built with ❤️ for gaming communities worldwide.