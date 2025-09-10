# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YuwoApp is a music game venue reservation mini-program built with uni-app framework for "鱼窝预约" (Fish Cave Reservation). It allows users to reserve time slots at music game venues with features like QR code check-in, payment integration, and administrative management.

## Required Development Tools

**MANDATORY**: This project requires HBuilderX IDE for compilation as uni-app's compiler is built-in and not available in other IDEs.

### Development Workflow

1. Clone repository and open in HBuilderX
2. Bind uniCloud and download all cloud functions/database schemas
3. Development and testing
4. Deploy to WeChat Mini Program platform

## Technology Stack

### Frontend
- **Framework**: uni-app (Vue 3 Composition API)
- **Language**: TypeScript
- **State Management**: Pinia
- **UI Components**: uni-ui, wot-design-uni
- **Styling**: SCSS with global variables in `uni.scss`

### Backend
- **Cloud Platform**: uniCloud (Alibaba Cloud)
- **Database**: NoSQL with JSON Schema validation
- **Cloud Functions**: Serverless business logic
- **Authentication**: uni-id

### Dependencies
- axios: HTTP client
- dayjs: Date manipulation
- pinia: State management
- qrcode: QR code generation

## Key Development Commands

### Development
- Run in HBuilderX simulator: Use HBuilderX's built-in simulator
- Run on device: Use HBuilderX's device debugging features
- Cloud function deployment: Through HBuilderX uniCloud panel

### Building
- WeChat Mini Program: Use HBuilderX's "Publish to WeChat Mini Program"
- Other platforms: Use HBuilderX's platform-specific build options

## Project Architecture

### Core Pages
- `pages/index/index`: Main reservation interface with calendar
- `pages/order/order`: Order creation
- `pages/signIn/signIn`: QR code check-in
- `pages/user/user`: User profile
- `pages/recharge/recharge`: Payment system
- `pages/config/config`: Admin configuration
- `pages/report/report`: Statistics and reporting

### Cloud Functions
- `orderHandler`: Order management and processing
- `reservationHandler`: Reservation logic
- `signinHandler`: Check-in handling
- `reportHandler`: Statistics generation
- `admin-ops`: Administrative operations
- `autoStopOrder`: Automated order management

### Database Collections
- `fishcave-orders`: Reservation orders
- `fishcave-viporders`: VIP membership orders
- `machines`: Equipment management
- `machine-groups`: Machine categorization
- `prices`: Standard pricing
- `prices_vip`: VIP pricing
- `membership`: User membership data
- `signin`: Check-in records
- `reservation-log`: Reservation history

## Key Configuration Files

- `pages.json`: Page routing and navigation configuration
- `manifest.json`: Application manifest and platform settings
- `theme.json`: Dark/light theme configuration
- `uni.scss`: Global SCSS variables and styles

## State Management

Pinia store in `stores/userProfileStore.ts` manages user profile data including:
- User ID and authentication
- Role-based permissions
- User profile information

## Security & Authentication

- uni-id based authentication system
- Role-based access control (admin/user)
- WeChat Pay integration for payments
- GDPR-compliant user data handling

## Code Style Conventions

- Vue 3 Composition API throughout
- TypeScript for type safety
- SCSS for styling following uni-app design system
- Responsive mobile-first design
- Component-based architecture using uni_modules

## Important Notes

- The project is primarily targeted at WeChat Mini Program
- Other platforms (H5, Android, iOS) are theoretically supported but not tested
- All secrets are managed through uniCloud and not stored in the repository
- Cloud functions use JQL database API for secure data access

## Common Development Tasks

### Adding New Pages
1. Create page in `pages/` directory
2. Add route configuration in `pages.json`
3. Update navigation if needed in tab bar or uniIdRouter

### Working with Cloud Functions
1. Create function in `uniCloud-aliyun/cloudfunctions/`
2. Add database schema in `uniCloud-aliyun/database/`
3. Deploy through HBuilderX uniCloud panel

### State Management
1. Use Pinia stores for global state
2. Follow the pattern in `stores/userProfileStore.ts`
3. Access stores using composition API patterns