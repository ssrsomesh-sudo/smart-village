# smart-village
# 🏘️ Smart Village

> A comprehensive village management system for Tadipatri constituency, Andhra Pradesh

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://smart-village.pages.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production-success)](https://smart-village.pages.dev/)

## 📋 Overview

Smart Village is a modern web application designed to digitize village administration and improve citizen engagement in the Tadipatri constituency. The system manages 103,000+ family records across 100+ villages in 4 mandals, providing tools for data management, SMS communications, and birthday tracking.

### 🎯 Mission

To digitize village records, improve citizen communication, and strengthen community bonds through technology-driven governance.

---

## ✨ Key Features

### 📊 Dashboard
- Real-time statistics and analytics
- Mandal-wise and village-wise distribution
- Quick search and filtering

### 📁 Data Management
- Excel file upload (.xlsx, .xls)
- Bulk data import with validation
- 103,082+ family records
- Advanced search and filtering

### 🎂 Birthday Management
- Automatic birthday detection (IST timezone)
- Filter by mandal, village, date range
- Age calculation
- Pagination (10/25/50/100 per page)

### 📱 SMS Center
- **Send SMS:** Bulk SMS with filters (mandal, village, age, gender)
- **Birthday SMS:** Auto-personalized birthday wishes with [NAME] replacement
- **History:** Full SMS log with pagination and phone number tracking
- **Statistics:** Message analytics and delivery tracking

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **UI:** Bootstrap 5
- **State Management:** React Hooks
- **Routing:** React Router DOM
- **HTTP Client:** Fetch API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma
- **File Processing:** xlsx, multer
- **SMS:** Fast2SMS API

### Database
- **Type:** PostgreSQL
- **Hosting:** Render.com
- **Size:** 103,082+ records
- **Tables:** FamilyRecord, sms_logs

### Deployment
- **Frontend:** Cloudflare Pages (auto-deploy)
- **Backend:** Railway (auto-deploy)
- **Database:** Render PostgreSQL
- **Version Control:** Git + GitHub

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Fast2SMS API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/smart-village.git
cd smart-village
```

2. **Install dependencies**

Frontend:
```bash
cd frontend
npm install
```

Backend:
```bash
cd backend
npm install
npx prisma generate
```

3. **Configure environment variables**

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```

Backend `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
FAST2SMS_API_KEY=your_api_key_here
PORT=5000
```

4. **Setup database**
```bash
cd backend
npx prisma db push
```

5. **Run the application**

Frontend:
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

Backend:
```bash
cd backend
npm start
# Runs at http://localhost:5000
```

---

## 📊 Database Schema

### FamilyRecord
Primary table storing resident information:
- `id` - Primary Key
- `mandalName`, `villageName` - Administrative divisions
- `name`, `phoneNumber`, `address` - Basic details
- `dateOfBirth` - Stored in UTC
- `gender`, `aadhar`, `qualification`, `caste`
- `occupation`, `needEmployment`, `arogyasriCardNumber`
- `birthdayThisWeek`, `birthdayThisMonth` - Boolean flags

### SmsLog
SMS history tracking:
- `id` - Primary Key
- `message` - SMS content
- `recipients` - Count
- `numbers` - Comma-separated phone numbers
- `sentAt` - Timestamp (IST)
- `status` - 'sent' or 'failed'

---

## 🌍 Geographic Coverage

**Constituency:** Tadipatri, Andhra Pradesh, India

**Mandals:**
- TADIPATRI
- PEDDAPAPPURU
- PEDDAVADUGURU
- YADIKI

**Total Villages:** 100+ villages across 4 mandals

---

## 🔐 Security

- Environment variables for sensitive data
- API key protection
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)

---

## 📱 API Endpoints

### Family Records
- `GET /api/records` - Get all records
- `POST /api/upload-excel` - Upload Excel file
- `GET /api/dashboard-stats` - Get dashboard statistics

### SMS
- `POST /api/send-sms` - Send SMS
- `GET /api/sms-history` - Get SMS history
- `GET /api/sms-stats` - Get SMS statistics

### Birthdays
- `GET /api/upcoming-birthdays` - Get upcoming birthdays

---

## 🐛 Known Issues & Solutions

### Timezone Handling (Fixed: Dec 18, 2025)
**Issue:** Birthday dates showing 1 day off  
**Solution:** Implemented UTC date handling throughout the application
- Use `Date.UTC()` for date creation
- Use `.getUTCMonth()`, `.getUTCDate()` for extraction
- IST timezone handling for current date

---

## 📈 Performance

- **Database Records:** 103,082 family records
- **Query Performance:** ~100ms average
- **Excel Upload:** Handles 10,000+ rows
- **SMS Batch Size:** 100 recipients per batch
- **Build Time:** Frontend ~2 min, Backend ~2 min

---

## 🔮 Future Enhancements

- [ ] User authentication & authorization
- [ ] Role-based access control (Admin, Operator, Viewer)
- [ ] Advanced reporting & analytics
- [ ] SMS delivery status tracking
- [ ] Mobile app (React Native)
- [ ] Offline capability
- [ ] Data export (PDF, Excel)
- [ ] Multi-language support (Telugu, English)
- [ ] WhatsApp integration
- [ ] Email notifications

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Somesh**  
Developed for Tadipatri Constituency, Andhra Pradesh

---

## 🙏 Acknowledgments

- Thanks to the village administrators of Tadipatri constituency
- Built with ❤️ for better citizen service
- Powered by Fast2SMS for communication

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

## 🌟 Show Your Support

If this project helped you, please give it a ⭐️!

---

**Live Demo:** [https://smart-village.pages.dev/](https://smart-village.pages.dev/)

**Last Updated:** December 18, 2025
