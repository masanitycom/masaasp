# MASAASP
**不動産クラウドファンディング アフィリエイト管理システム**

A comprehensive affiliate management system for real estate crowdfunding with multi-tier reward calculations, organization charts, and admin controls.

## 🎯 Features

### Core Functionality
- **User Authentication**: Secure login with Supabase Auth and custom access control
- **Organization Chart**: Interactive hierarchy visualization with lazy loading
- **Multi-tier Rewards**: Flexible commission calculation for different property types
- **Admin Dashboard**: CSV upload, fund management, and user administration
- **Access Control**: System access flags and admin permissions

### Key Components
- **Dashboard**: User stats, downline summary, and reward overview
- **Organization Tree**: Progressive loading with 5-tier expansion
- **Reward Calculation**: Dynamic property-based commission structures
- **CSV Management**: Bulk data import for users, levels, and investments
- **Fund Settings**: Configurable reward structures per property

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand, SWR
- **UI Components**: Lucide React, React Hook Form
- **Charts**: D3.js for organization visualization

## 📁 Project Structure

```
masaasp/
├── src/
│   ├── app/
│   │   ├── dashboard/          # User dashboard
│   │   ├── organization/       # Organization chart
│   │   ├── login/             # Authentication
│   │   └── admin/             # Admin controls
│   ├── components/
│   │   └── OrganizationChart/ # Tree components
│   ├── lib/
│   │   └── supabase/          # DB clients
│   └── types/                 # TypeScript definitions
├── supabase/
│   └── migrations/            # Database schema
└── README.md
```

## 🗄️ Database Schema

### Key Tables
- **users**: User accounts with access control flags
- **camel_levels**: Organization hierarchy with upline relationships
- **investment_history**: Property investment tracking
- **fund_settings**: Flexible reward configuration per property
- **calculated_rewards**: Commission calculations and payouts

### Security
- **Row Level Security (RLS)**: Strict data access policies
- **Access Control**: `system_access_flg` and `admin_flg` permissions
- **Data Isolation**: Users can only view their downline organization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/masanitycom/masaasp.git
   cd masaasp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Database Setup**
   Run the migration in Supabase:
   ```sql
   -- Execute supabase/migrations/001_initial_schema.sql
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📊 Key Features

### Organization Chart
- **Progressive Loading**: 5-member chunks for performance
- **Lazy Expansion**: Click to load downline members
- **Search Function**: Find users by ID or name
- **Access Control**: View only your downline organization

### Reward System
- **Flexible Configuration**: Property-specific commission rates
- **Multi-tier Support**: Up to 5 levels of referral rewards
- **Dynamic Calculation**: Real-time commission computation
- **Template System**: Pre-configured reward structures

### Admin Features
- **CSV Upload**: Bulk import for all data types
- **Fund Management**: Configure reward structures
- **User Administration**: Manage access permissions
- **Data Synchronization**: Automatic updates and validation

## 🔒 Security

### Authentication
- Supabase Auth integration
- Custom user ID and password system
- Session management with middleware

### Authorization
- **System Access**: `system_access_flg` controls login ability
- **Admin Access**: `admin_flg` controls admin features
- **Data Access**: RLS policies ensure users see only authorized data

### Data Protection
- Row Level Security on all tables
- Encrypted password storage
- Input validation and sanitization

## 📈 Scalability

### Performance Optimizations
- **Progressive Loading**: Lazy load organization data
- **Virtual Scrolling**: Handle large datasets efficiently
- **Caching Strategy**: SWR for optimal data fetching
- **Database Indexing**: Optimized queries for hierarchy operations

### Architecture
- **Serverless**: Vercel Functions for backend logic
- **CDN**: Global content delivery
- **Database**: Supabase distributed PostgreSQL
- **Monitoring**: Built-in error tracking

## 🔄 Development Workflow

### Current Status
✅ Basic application structure
✅ Authentication system
✅ Database schema with RLS
✅ Organization chart with lazy loading
✅ User dashboard
✅ Git repository setup

### Next Steps
- Add user detail views
- Implement fund management
- Create reward calculation features
- Build admin CSV upload
- Add responsive design

## 📝 License

This project is proprietary software for MASAASP.

---

**Note**: This system handles sensitive financial data. Ensure proper security measures and compliance with relevant regulations before deployment.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>