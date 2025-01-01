const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
connectDB();

document.addEventListener('DOMContentLoaded', () => {
    // Navigation buttons functionality
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
        });
    });

    // Subject cards functionality
    const subjectCards = document.querySelectorAll('.subject-card');
    
    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add animation when clicking on a subject
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'translateY(-5px)';
            }, 200);

            // Here you can add navigation to subject-specific content
            const subject = card.querySelector('h3').textContent;
            console.log(`Selected subject: ${subject}`);
        });
    });
});

// Language switching functionality
function toggleLanguage() {
    const html = document.documentElement;
    const isRTL = html.dir === 'rtl';
    const langButton = document.querySelector('.lang-switch .lang-text');
    
    // Toggle direction
    html.dir = isRTL ? 'ltr' : 'rtl';
    
    // Update language button text
    langButton.textContent = isRTL ? 'عربي' : 'English';
    
    // Update all translatable elements
    document.querySelectorAll('[data-en][data-ar]').forEach(element => {
        element.textContent = isRTL ? element.dataset.en : element.dataset.ar;
    });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Serve admin panel
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Serve main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
