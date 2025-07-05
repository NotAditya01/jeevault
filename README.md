# JEE Vault

A platform for sharing and accessing JEE preparation resources.

## Features

- Browse and search for JEE preparation materials
- Upload PDF resources or share external links
- Admin approval system for quality control
- Filter resources by subject and tags
- Dark mode support
- Mobile responsive design

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/jeevault

   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=securepassword

   # Cloudinary Configuration (Required for production file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Cloudinary Setup (Required for Production)

To enable file uploads in production:

1. Create a free Cloudinary account at https://cloudinary.com/
2. Get your cloud name, API key, and API secret from your dashboard
3. Add these values to your environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. For Vercel deployment, add these as environment variables in your Vercel project settings

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and deploy.

## License

MIT 