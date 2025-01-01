document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const verificationForm = document.getElementById('verificationForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const verificationFormElement = document.getElementById('verificationFormElement');
    const resendCode = document.getElementById('resendCode');

    let currentEmail = '';

    // Toggle between forms
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        verificationForm.style.display = 'none';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        verificationForm.style.display = 'none';
    });

    // Handle login form submission
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                if (data.message === 'Please verify your email first') {
                    currentEmail = email;
                    loginForm.style.display = 'none';
                    verificationForm.style.display = 'block';
                } else {
                    alert(data.message || 'Login failed');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });

    // Handle registration form submission
    registerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                currentEmail = email;
                registerForm.style.display = 'none';
                verificationForm.style.display = 'block';
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });

    // Handle verification form submission
    verificationFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('verificationCode').value;

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: currentEmail, code })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Email verified successfully! Please login.');
                verificationForm.style.display = 'none';
                loginForm.style.display = 'block';
            } else {
                alert(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert('An error occurred during verification');
        }
    });

    // Handle resend verification code
    resendCode.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentEmail) {
            alert('Please register or login first');
            return;
        }

        try {
            const response = await fetch('/api/auth/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: currentEmail })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Verification code resent! Please check your email.');
            } else {
                alert(data.message || 'Failed to resend verification code');
            }
        } catch (error) {
            console.error('Resend code error:', error);
            alert('An error occurred while resending the code');
        }
    });
});
