# Zameel - Modern Educational Platform

<div align="center">
  <img src="public/images/logo.png" alt="Zameel Logo" width="200"/>
  <br>
  <p><strong>Empowering education through interactive learning and seamless collaboration</strong></p>
</div>

## Overview

Zameel is a sophisticated educational platform designed to make learning engaging and accessible. Built with modern web technologies, it offers a seamless learning experience for both English and Arabic speakers, making education more interactive and enjoyable.

## Key Features

- **Interactive Learning**
  - Subject-based learning modules
  - Interactive exercises
  - Progress tracking
  - Personalized learning paths

- **Secure User Management**
  - Two-step registration
  - Email verification
  - Secure authentication
  - User profiles

- **Multi-language Support**
  - English interface
  - Arabic interface
  - RTL support
  - Cultural adaptation

- **Educational Resources**
  - Digital learning materials
  - Interactive content
  - Resource sharing
  - Study materials

## Technical Stack

- **Backend**
  - Node.js
  - Express.js
  - PostgreSQL
  - Sequelize ORM

- **Frontend**
  - HTML5
  - CSS3
  - JavaScript
  - Responsive Design

- **Security**
  - bcrypt password hashing
  - JWT authentication
  - Email verification
  - HTTPS/SSL

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zameel.git
   ```

2. Install dependencies:
   ```bash
   cd zameel
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the application:
   ```bash
   npm start
   ```

## Configuration

Create a `.env` file with the following variables:

```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email verification
- `POST /api/auth/login` - User login
- `GET /api/courses` - Get available courses
- `GET /api/materials` - Access study materials
- `POST /api/auth/logout` - User logout

## Security Features

- Secure user authentication
- Email verification system
- Data encryption
- GDPR compliance
- Privacy protection
- Regular security updates

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please:
1. Check the documentation
2. Open an issue
3. Contact support at support@zameel.com

## Acknowledgments

- Educational content creators
- Open source community
- All our contributors

---

<div align="center">
  Made with ❤️ by Khalil
  <br>
  2024 Zameel. All rights reserved.
</div>
