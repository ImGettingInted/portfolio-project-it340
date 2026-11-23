const API_BASE = '/api/auth';

function setMessage(message, isError = false) {
  const status = document.querySelector('#auth-message');
  if (!status) return;

  status.textContent = message;
  status.style.color = isError ? '#b00020' : '#126b35';
}

async function submitAuth(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({
    message: 'The server returned an invalid response.'
  }));

  if (!response.ok) {
    throw new Error(data.message || 'The request failed.');
  }

  return data;
}

const registerForm = document.querySelector('#register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(registerForm);
    const password = data.get('password');
    const confirm = data.get('confirm');

    if (password !== confirm) {
      setMessage('Passwords do not match.', true);
      return;
    }

    try {
      const result = await submitAuth(`${API_BASE}/register`, {
        full_name: data.get('full_name'),
        email: data.get('email'),
        password
      });

      setMessage(result.message);
      registerForm.reset();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 700);
    } catch (error) {
      setMessage(error.message, true);
    }
  });
}

const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);

    try {
      const result = await submitAuth(`${API_BASE}/login`, {
        email: data.get('email'),
        password: data.get('password')
      });

      setMessage(result.message);
      loginForm.reset();
      setTimeout(() => {
        window.location.href = 'homepage.html';
      }, 700);
    } catch (error) {
      setMessage(error.message, true);
    }
  });
}
