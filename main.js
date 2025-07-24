//------------------------------------VARIABLES-------------------------------------//

const firstName = document.getElementById('Fname');
const lastName = document.getElementById('Lname');
const LphoneNumber = document.getElementById('loginphoneNo');
const RphoneNumber = document.getElementById('registerphoneNo');
const captcha = document.getElementById('captchaInput');

//----------------------------CONVERSION FROM TEXT TO NO----------------------------//

const validNumber = function(phoneNo) {
    if (!/^\d{10,15}$/.test(phoneNo)) {
        document.querySelector("#message").innerHTML = "Not a Valid Number (must be 10-15 digits)";
        console.log("INVALID");
        return false;
    } else {
        console.log("VALID");
        return true;
    }
};

//-----------------------------------TOGGLE-----------------------------------------//
function showForm(formId) {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    loginBox.style.display = 'none';
    registerBox.style.display = 'none';
    if (formId === 'login-box') {
        loginBox.style.display = 'block';
    } else if (formId === 'register-box') {
        registerBox.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showForm('login-box');
});

document.querySelector('.switch input').addEventListener('change', (e) => {
    if (e.target.checked) {
        showForm('register-box');
    } else {
        showForm('login-box');
    }
});

//-----------------------------AUTHENTICATION IN LOGIN------------------------------//

async function comparePhoneNo() {
    const phoneNumber = document.getElementById('loginphoneNo').value;
    if (!validNumber(phoneNumber)) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
    }
    try {
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_no: phoneNumber })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        if (data.success) {
            alert('WELCOME!');
        } else {
            alert('Incorrect number: ' + (data.error || ''));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
    }
}
//------------------------------CAPTCHA GENERATION---------------------------------//

function generateCaptcha() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById('captcha-text').textContent = captcha;
}

window.onload = generateCaptcha;

document.getElementById('captchaInput').addEventListener('input', function() {
    const userInput = this.value;
    const captchaText = document.getElementById('captcha-text').textContent;
    if (userInput === captchaText) {
        this.style.borderColor = '#00ff00';
    } else {
        this.style.borderColor = '#ff0000';
    }
});

//--------------------------------REGISTRATION-----------------------------------------------//

document.querySelector('.reg-btn button').addEventListener('click', async (e) => {
    e.preventDefault();

    const userData = {
        first_name: document.getElementById('Fname').value.trim().replace(/^\w/, c => c.toUpperCase()),
        last_name: document.getElementById('Lname').value.trim().replace(/^\w/, c => c.toUpperCase()),
        phone_no: document.getElementById('registerphoneNo').value.trim(),
        agreed: document.getElementById('agreement').checked
    };
    console.log("User Data:", userData);

    if (!userData.first_name || !userData.last_name || !userData.phone_no) {
        alert('Please fill all required fields');
        return;
    }

    if (!/^\d{10,15}$/.test(userData.phone_no)) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
    }

    if (!userData.agreed) {
        alert('You must agree to terms & conditions');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();

        if (response.ok) {
            alert('Account Created');
            document.getElementById('Fname').value = '';
            document.getElementById('Lname').value = '';
            document.getElementById('registerphoneNo').value = '';
            document.getElementById('agreement').checked = false;
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('REGISTRATION FAILED:', error);
        alert('FAILED');
    }
});

//---------------------------------RESPONSIVENESS--------------------------------------------//
document.addEventListener('DOMContentLoaded', function() {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const toggleSwitch = document.querySelector('.switch input');

    loginBox.style.display = 'flex';
    registerBox.style.display = 'none';

    toggleSwitch.addEventListener('change', function() {
        if (this.checked) {
            loginBox.style.display = 'none';
            registerBox.style.display = 'flex';
        } else {
            loginBox.style.display = 'flex';
            registerBox.style.display = 'none';
        }
    });
});