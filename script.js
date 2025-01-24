// Registration Form Submission
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const dob = document.getElementById('dob').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, age, dob, email, phone, location, username, password }),
    });

    const data = await response.json();
    document.getElementById('notification').innerText = data.message;
});

// Login Form Submission
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    document.getElementById('response-message').innerText = data.message;

    // Optionally, display a welcome message on successful login
    if (response.ok) {
        const welcomeMessage = `Welcome, ${username}!`;
        document.getElementById('response-message').innerText = welcomeMessage;
        // Optionally, clear the form or redirect
    }
});

// Logout Functionality
document.getElementById('logout-button').addEventListener('click', async function() {
    const response = await fetch('/api/logout', { method: 'POST' });
    const data = await response.json();
    document.getElementById('response-message').innerText = data.message;
});