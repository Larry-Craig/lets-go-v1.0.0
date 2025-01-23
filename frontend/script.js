// Registration Form Submission
document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    document.getElementById('response-message').innerText = data.message;
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