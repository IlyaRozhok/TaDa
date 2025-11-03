# Database Setup Guide

## Overview

This guide explains how to set up the database for the TaDa rental platform backend.

## Prerequisites

- PostgreSQL 16 or higher
- Node.js 18 or higher
- npm or yarn

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=rental_platform_stage
NODE_ENV=development
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE rental_platform_stage;
```

### 2. Run Migrations

```bash
# Install dependencies
npm install

# Run migrations
npm run typeorm:migration:run
```

## Migration Order

The migrations will run in the following order:

1. **CreateBaselineSchema1735400000000** - Creates all base tables with proper structure
2. **AddNewPreferencesFields1735420000000** - Adds preference fields
3. **AddUserProfileFields1735440000000** - Adds user profile fields
4. **RenameWorkArrangementToWorkStyle1735450000000** - Renames work style field
5. **CreatePropertiesTable1735460000000** - Creates properties table (redundant, handled by baseline)
6. **SeedTestProperties1735470000000** - Seeds test data
7. **AddUserContactFields1735480000000** - Adds contact fields
8. **MovePersonalFieldsToPreferences1735490000000** - Moves personal fields to preferences
9. **CreatePropertyMediaTable1735820000000** - Creates property media table (redundant, handled by baseline)
10. **AddUrlToPropertyMedia1752067887898** - Adds URL field to property media
11. **RefactorUserModel1752601418409** - Refactors user model
12. **MoveFullNameToUsersTable1752603000000** - Moves full name to users table
13. **MakeProfileFullNameNullable1752603100000** - Makes profile full name nullable
14. **AddGoogleOAuthFields1752610000000** - Adds Google OAuth fields
15. **MoveShortlistToTenantProfile1752615000000** - Moves shortlist to tenant profile
16. **FixUserPreferencesRelation1752650000000** - Fixes user preferences relation
17. **MakeRoleNullable1752670000000** - Makes role nullable
18. **ChangePropertyTypeToArray1754915754587** - Changes property type to array

## Table Structure

### Users Table

- Basic user information (email, password, role, status)
- OAuth fields (google_id, provider)
- Profile fields (full_name, avatar_url, email_verified)

### Properties Table

- Property details (title, description, address, price)
- Location coordinates (lat, lng)
- Property features (bedrooms, bathrooms, property_type, furnishing)
- Media and images support

### Operator Profiles Table

- Company information (company_name, business_address)
- Professional details (license_number, years_experience)
- Personal details (date_of_birth, nationality)
- Services and operating areas

### Tenant Profiles Table

- Personal preferences (age_range, occupation, industry)
- Lifestyle choices (work_style, pets, smoker)
- Shortlisted properties

### Property Media Table

- Media files (images, videos)
- S3 integration support
- Ordering and featured flags

## Troubleshooting

### Common Issues

1. **Migration conflicts**: If you get constraint errors, the tables may already exist. The baseline migration handles this gracefully.

2. **Missing columns**: All required columns are now included in the baseline migration.

3. **Foreign key errors**: Ensure the users table is created before other tables that reference it.

### Reset Database

If you need to start fresh:

```bash
# Drop and recreate database
DROP DATABASE rental_platform_stage;
CREATE DATABASE rental_platform_stage;

# Run migrations again
npm run typeorm:migration:run
```

## Development vs Production

- **Development**: Set `NODE_ENV=development` to enable auto-synchronization
- **Production**: Set `NODE_ENV=production` and always use migrations

## Notes

- The baseline migration (`CreateBaselineSchema`) now includes all necessary columns
- Redundant migrations are handled gracefully with existence checks
- All foreign key relationships are properly established
- Indexes are created for performance optimization
