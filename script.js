// alert("not responsive at so see the page in landscape on phones");
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


document.getElementById("contactForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent page refresh

    let form = event.target;
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
});



