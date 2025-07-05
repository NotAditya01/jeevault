# JEE Vault

A platform for sharing educational resources for JEE preparation.

## Features

- Upload and share PDF resources for JEE preparation
- Browse resources by subject and type
- Admin approval workflow for quality control
- Clean, responsive UI with dark mode support
- Local PDF storage

## Tech Stack

- **Frontend**: HTML, CSS (TailwindCSS), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Storage**: Local file storage for PDFs
- **Authentication**: Basic auth for admin panel

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB database

### Installation

1. Clone the repository
   ```
   git clone https://github.com/adii-the-billionaire/JEE-Vault.git
   cd JEE-Vault
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB URI and admin credentials

5. Start the development server
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `public/` - Static assets and frontend files
  - `js/` - JavaScript files
  - `index.html` - Homepage
  - `upload.html` - Upload form
  - `admin.html` - Admin dashboard
- `models/` - MongoDB models
- `utils/` - Utility functions
- `uploads/` - Uploaded PDF files
- `server.js` - Express server

## Admin Access

1. Navigate to `/admin.html`
2. Login with credentials from your `.env` file

## License

MIT 