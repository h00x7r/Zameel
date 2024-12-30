// API endpoints
const API_URL = 'http://localhost:3000/api';

// Language switching functionality
function toggleLanguage() {
    const html = document.documentElement;
    const isRTL = html.dir === 'rtl';
    const langButton = document.querySelector('.lang-switch .lang-text');
    
    html.dir = isRTL ? 'ltr' : 'rtl';
    langButton.textContent = isRTL ? 'عربي' : 'English';
    
    document.querySelectorAll('[data-en][data-ar]').forEach(element => {
        element.textContent = isRTL ? element.dataset.en : element.dataset.ar;
    });
}

// Registration function
async function register() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Show verification form and hide registration form
        document.getElementById('registrationForm').classList.add('hidden');
        document.getElementById('verificationForm').classList.remove('hidden');
        
        // Store email for verification
        localStorage.setItem('pendingVerificationEmail', email);
        
        // Start verification timer
        startVerificationTimer();
        
        // Focus first verification input
        document.querySelector('.code-input[data-index="0"]').focus();

    } catch (error) {
        alert(error.message);
    }
}

// Verify email code
async function verifyCode() {
    const email = localStorage.getItem('pendingVerificationEmail');
    if (!email) {
        alert('Please register first');
        return;
    }

    const codeInputs = document.querySelectorAll('.code-input');
    const verificationCode = Array.from(codeInputs).map(input => input.value).join('');

    if (verificationCode.length !== 6) {
        alert('Please enter the complete verification code');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                code: verificationCode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Verification failed');
        }

        // Store token and redirect
        localStorage.setItem('token', data.token);
        localStorage.removeItem('pendingVerificationEmail');
        window.location.href = 'index.html';

    } catch (error) {
        alert(error.message);
        // Clear verification inputs
        codeInputs.forEach(input => input.value = '');
        codeInputs[0].focus();
    }
}

// Resend verification code
async function resendCode() {
    const email = localStorage.getItem('pendingVerificationEmail');
    if (!email) {
        alert('Please register first');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/resend-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to resend code');
        }

        // Clear existing verification inputs
        document.querySelectorAll('.code-input').forEach(input => input.value = '');
        document.querySelector('.code-input[data-index="0"]').focus();

        // Restart verification timer
        startVerificationTimer();

        alert('Verification code resent successfully');

    } catch (error) {
        alert(error.message);
    }
}

// Login function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('fullName', data.fullName);
        window.location.href = 'index.html';

    } catch (error) {
        alert(error.message);
    }
}

// Sign out function
async function signOut() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sign out failed');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('fullName');
        window.location.href = '/login.html';

    } catch (error) {
        alert(error.message);
    }
}

// Sign out from all devices
async function signOutAll() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (!confirm('Are you sure you want to sign out from all devices?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signout-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sign out failed');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('fullName');
        window.location.href = '/login.html';

    } catch (error) {
        alert(error.message);
    }
}

// Get active sessions
async function getActiveSessions() {
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/active-sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get active sessions');
        }

        const sessions = await response.json();
        const sessionsContainer = document.getElementById('activeSessions');
        
        if (sessionsContainer) {
            sessionsContainer.innerHTML = sessions.map(session => `
                <div class="session-item">
                    <div class="device-info">${session.deviceInfo || 'Unknown Device'}</div>
                    <div class="session-time">
                        <div>Login: ${new Date(session.createdAt).toLocaleString()}</div>
                        <div>Last Activity: ${new Date(session.lastActivity).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Get sessions error:', error);
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    // Redirect to login if not authenticated
    if (!token && !currentPage.includes('login.html') && !currentPage.includes('register.html')) {
        window.location.href = '/login.html';
        return;
    }
    
    // Redirect to index if already authenticated
    if (token && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        window.location.href = '/index.html';
        return;
    }

    // Get active sessions for authenticated pages
    if (token && currentPage.includes('index.html')) {
        getActiveSessions();
    }
});
