# JEE Vault - Educational Resource Sharing Platform

A web platform for sharing and managing JEE (Joint Entrance Examination) educational resources. Built with Node.js, Express, MongoDB, and Tailwind CSS.

## Features

- Resource sharing and management
- Dark/Light theme support
- Mobile responsive design
- Admin panel for content moderation
- File upload with Cloudinary integration
- Search and filter functionality

## Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Storage**: Cloudinary
- **Authentication**: Basic Auth (Admin)

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd jee-vault
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/jee_vault
PORT=3000
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Project Structure

```
├── models/          # Database models
├── public/          # Static files
│   ├── js/         # Client-side JavaScript
│   ├── css/        # Stylesheets
│   └── *.html      # HTML pages
├── utils/          # Utility functions
├── server.js       # Express server
└── package.json    # Project dependencies
```

## API Endpoints

### Public Routes
- `GET /resources` - Get all approved resources
- `POST /upload` - Upload a new resource

### Admin Routes (Requires Authentication)
- `POST /api/admin/login` - Admin login
- `GET /admin/resources` - Get all resources
- `PATCH /admin/resources/:id/approve` - Approve a resource
- `DELETE /admin/resources/:id` - Delete a resource

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 