// API endpoints
const API_URL = 'http://localhost:3000/api';

// Allowed email domains
const ALLOWED_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'protonmail.com', 'mail.ru'];

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
    const isArabic = document.documentElement.dir === 'rtl';

    // Check email domain
    const domain = email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
        alert(isArabic 
            ? "البريد الإلكتروني غير مسموح به. يرجى استخدام بريد من النطاقات المسموح بها." 
            : "Email domain is not allowed. Please use an allowed domain.");
        return;
    }

    if (password !== confirmPassword) {
        alert(isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: fullName,
                email,
                password,
                language: isArabic ? 'ar' : 'en'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        // Show verification form and hide registration form
        document.getElementById('registrationForm').classList.add('hidden');
        document.getElementById('verificationForm').classList.remove('hidden');
        
        // Store email for verification
        localStorage.setItem('pendingVerificationEmail', email);
        
        // Display email in verification form
        const emailDisplay = document.getElementById('verificationEmail');
        emailDisplay.textContent = email;
        
        // Start verification timer
        startVerificationTimer();
        
        // Focus first verification input
        document.querySelector('.code-input[data-index="0"]').focus();

        // Show success message
        alert(isArabic 
            ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' 
            : 'Verification code has been sent to your email');

    } catch (error) {
        if (error.message.includes('already registered')) {
            const shouldRemove = confirm('This email is already registered but unverified. Would you like to remove it and try again?');
            if (shouldRemove) {
                await removeUnverifiedEmail(email);
            }
        } else {
            alert(error.message);
        }
    }
}

// Verify email code
async function verifyCode() {
    const email = localStorage.getItem('pendingVerificationEmail');
    if (!email) {
        const isArabic = document.documentElement.dir === 'rtl';
        alert(isArabic ? 'الرجاء التسجيل أولاً' : 'Please register first');
        return;
    }

    const codeInputs = document.querySelectorAll('.code-input');
    const verificationCode = Array.from(codeInputs).map(input => input.value).join('');
    const isArabic = document.documentElement.dir === 'rtl';

    if (verificationCode.length !== 6) {
        alert(isArabic ? 'الرجاء إدخال رمز التحقق كاملاً' : 'Please enter the complete verification code');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify-email`, {
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
            throw new Error(isArabic ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code');
        }

        // Store token
        localStorage.setItem('token', data.token);
        localStorage.removeItem('pendingVerificationEmail');
        
        // Show success message
        alert(isArabic 
            ? 'تم التحقق من بريدك الإلكتروني بنجاح' 
            : 'Email verified successfully');
        
        // Redirect with language parameter
        window.location.href = `index.html?lang=${isArabic ? 'ar' : 'en'}`;

    } catch (error) {
        alert(error.message);
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
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isArabic = document.documentElement.dir === 'rtl';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                language: isArabic ? 'ar' : 'en'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message.includes('verify your email')) {
                document.getElementById('unverifiedMessage').classList.remove('hidden');
            } else {
                document.getElementById('unverifiedMessage').classList.add('hidden');
            }
            throw new Error(data.message);
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('userLanguage', isArabic ? 'ar' : 'en');
        
        // Redirect with language parameter
        window.location.href = `index.html?lang=${isArabic ? 'ar' : 'en'}`;

    } catch (error) {
        const errorMessage = isArabic ? 'فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.' : 
                                      'Login failed. Please check your email and password.';
        alert(errorMessage);
    }
}

// Handle unverified email cleanup
async function cleanupUnverifiedEmail() {
    const email = document.getElementById('email').value;
    if (!email) {
        const isArabic = document.documentElement.dir === 'rtl';
        alert(isArabic ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/force-cleanup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error('Cleanup failed');
        }

        const data = await response.json();
        const isArabic = document.documentElement.dir === 'rtl';
        
        if (data.userRemoved || data.pendingRemoved) {
            alert(isArabic 
                ? 'تم إزالة البريد الإلكتروني. يمكنك الآن التسجيل مرة أخرى.' 
                : 'Email removed. You can now register again.');
            window.location.href = 'register.html';
        } else {
            alert(isArabic 
                ? 'البريد الإلكتروني غير موجود أو تم التحقق منه بالفعل' 
                : 'Email not found or already verified');
        }
    } catch (error) {
        console.error('Error:', error);
        const isArabic = document.documentElement.dir === 'rtl';
        alert(isArabic 
            ? 'حدث خطأ أثناء التنظيف. حاول مرة اخرى.' 
            : 'Error during cleanup. Please try again.');
    }
}

// Add event listener to login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});

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

// Remove unverified email
async function removeUnverifiedEmail(email) {
    try {
        const response = await fetch(`${API_URL}/remove-unverified/${email}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to remove email');
        }

        alert('Email removed successfully. You can now register again.');
        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('Error removing email. Please try again.');
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
