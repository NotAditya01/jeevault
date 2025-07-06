# JEE Vault 🚀

A minimal, open-source platform for discovering and sharing high-quality **JEE (Joint Entrance Examination) preparation resources** – from coaching modules to foreign–author books and concise revision notes.

---

## ✨ Features

- 🔍 **Search &amp; Browse** resources by subject, tag &amp; keyword
- 📚 **Tags** for quick filtering (Books, Notes, Question Banks…)
- 🌐 **External Link Support** (Google Drive, Telegram, Direct PDF, etc.)
- 📝 **Contributor Form** – anyone can submit a resource for review
- 🧑‍💼 **Admin Panel** for reviewing / approving uploads
- 🌓 **Dark Mode** &amp; responsive mobile-first UI

---

## 🖥️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Backend     | Node.js, Express 4, Mongoose 8 |
| Database    | MongoDB / MongoDB Atlas |
| Front-end   | Tailwind CSS, Vanilla JS, HTML 5 |
| Deployment  | Vercel (serverless) |
| Tooling     | dotenv, nodemon, chalk |

---

## 🚀 Quick Start

1. **Clone &amp; Install**

   ```bash
   git clone https://github.com/yourusername/jee-vault.git
   cd jee-vault
   npm install
   ```

2. **Configure Environment** – copy `.env.example` (below) to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   # then edit .env
   ```

   ```dotenv
   # .env.example
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jee-vault?retryWrites=true&amp;w=majority
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=supersecret
   PORT=3000 # optional – default 3000
   ```

3. **Run Locally**

   ```bash
   # development (auto-restart)
   npm run dev

   # production
   npm start
   ```

4. Visit **http://localhost:3000** in your browser.

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | `/api/resources`   | List **approved** resources          |
| POST   | `/api/resources`   | Submit a new resource (awaits review) |

<details>
<summary>POST Body Schema</summary>

```json5
{
  "title": "Physics Galaxy Mechanics",
  "description": "Comprehensive notes on rotational motion",
  "subject": "Physics",
  "tag": "notes",           // one of [ "notes", "books" ]
  "url": "https://drive.google.com/file/d/...",
  "uploadedBy": "John Doe"  // optional
}
```
</details>

### Admin Endpoints (Basic Auth)

> Supply `Authorization: Basic base64(username:password)` header using the credentials from `.env`.

| Method | Endpoint                               | Purpose                     |
|--------|----------------------------------------|-----------------------------|
| GET    | `/api/admin/resources?status=pending`  | List pending uploads        |
| GET    | `/api/admin/resources?status=approved` | List approved uploads       |
| PATCH  | `/api/admin/resources/:id`             | `action=approve|reject|update` |
| DELETE | `/api/admin/resources/:id`             | Delete a resource           |

---

## 🗂️ Project Structure

```
jee-vault/
├─ models/           ← Mongoose models
│  └─ Resource.js
├─ public/           ← Static front-end (HTML/JS/CSS)
├─ utils/            ← Helper utilities &amp; config validation
├─ server.js         ← Express entry-point
└─ README.md
```

---

## 🤝 Contributing

1. **Fork** the repo &amp; create your branch: `git checkout -b feature/my-feature`  
2. **Commit** your changes: `git commit -m "feat: add amazing feature"`  
3. **Push** to the branch: `git push origin feature/my-feature`  
4. **Open a Pull Request** 🚀

Please follow the existing code-style (prettier / eslint coming soon) and write clear commit messages. All contributions – bug-fixes, docs &amp; features – are welcome!

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- [Node.js](https://nodejs.org) – server runtime  
- [Express](https://expressjs.com) – fast, unopinionated web framework  
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) – hosted database  
- [Tailwind CSS](https://tailwindcss.com) – utility-first CSS framework  
- [Vercel](https://vercel.com) – seamless cloud deployment  

> Made with ❤️ for the JEE community
