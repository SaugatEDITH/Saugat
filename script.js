const design_card_butttons = document.querySelectorAll('.design-card');
const introduction_text = document.querySelectorAll('.introduction-text');

const single_profile_card = document.querySelectorAll('.single-profile-card');
const testimonial_card = document.querySelectorAll('.testimonial-card');

design_card_butttons.forEach((button, index) => {
    button.addEventListener('click', () => {
        introduction_text.forEach((introduction, introductionIndex) => {
            if (index === introductionIndex) {
                introduction.style.display = 'block';
            } else {
                introduction.style.display = 'none';
            }
        });
        design_card_butttons.forEach((btn, btnIndex) => {
            if (index === btnIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');

            }
        });
    });
});

single_profile_card.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        testimonial_card.forEach((testimonialCard, testimonialCardIndex) => {
            if (index === testimonialCardIndex) {
                testimonialCard.style.display = 'block';
            } else {
                testimonialCard.style.display = 'none';
            }
        });
        single_profile_card.forEach((cardBtn, cardIndex) => {
            if (index === cardIndex) {
                cardBtn.classList.add('profile-card-active');
            } else {
                cardBtn.classList.remove('profile-card-active');
            }
        });
    });
});

// Select form and elements
const form = document.getElementById("contactForm");
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone-number");

// Function to display error message and style input
function showError(inputField, message) {
    const responseDiv = document.getElementById("responseMessage");
    responseDiv.textContent = message;  // Show error in the response div
    inputField.style.border = "2px solid red";  // Add red border to the input field
}

// Function to remove error message and reset input style
function removeError(inputField) {
    const responseDiv = document.getElementById("responseMessage");
    responseDiv.textContent = "";  // Clear the response div
    inputField.style.border = "";  // Reset the input field border
}

// Validate Name
function validateName() {
    const nameValue = name.value.trim();

    // Regex: The name should contain only letters (a-z, A-Z) and spaces. It should have at least 3 characters.
    const namePattern = /^[A-Za-z\s]{3,}$/;

    if (!namePattern.test(nameValue)) {
        showError(name, "Enter valid name!");
        return false;
    } else {
        removeError(name);
        return true;
    }
}


// Validate Email
function validateEmail() {
    const emailValue = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
        showError(email, "Please enter a valid email address.");
        return false;
    } else {
        removeError(email);
        return true;
    }
}

// Validate Phone Number
function validatePhone() {
    const phoneValue = phone.value.trim();
    const phonePattern = /^(97|98)\d{7,8}$/;
    if (!phonePattern.test(phoneValue)) {
        showError(phone, "Please enter a valid phone number.");
        return false;
    } else {
        removeError(phone);
        return true;
    }
}

// Add `onblur` event listeners for real-time validation
name.addEventListener("blur", validateName);
email.addEventListener("blur", validateEmail);
phone.addEventListener("blur", validatePhone);

// Optional: Real-time validation on input for user experience
name.addEventListener("input", removeError.bind(null, name));
email.addEventListener("input", removeError.bind(null, email));
phone.addEventListener("input", removeError.bind(null, phone));

// Validate All Fields on Submit
form.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission if validation fails

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (isNameValid && isEmailValid && isPhoneValid) {
        // Form is valid, submit data
        let formData = new FormData(form);

        fetch("https://formspree.io/f/xbjvnarq", {
            method: "POST",
            body: formData,
            headers: { "Accept": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                document.getElementById("responseMessage").innerHTML = "<p style='color:#00f56c;'>Message sent successfully!</p>";
                form.reset(); // Clear form after success
            } else {
                document.getElementById("responseMessage").innerHTML = "<p style='color:red;'>Error sending message. Try again.</p>";
            }
        })
        .catch(error => {
            document.getElementById("responseMessage").innerHTML = "<p style='color:red;'>Error: " + error.message + "</p>";
        });
    }
});
