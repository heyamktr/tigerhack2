document.getElementById('feedback-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Simple feedback message
    document.getElementById('form-message').textContent = 
        `Thank you, ${name}. Your feedback has been received!`;

    // Clear the form
    document.getElementById('feedback-form').reset();
});
