// Handle form submission for feedback
document.getElementById('feedback-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent form from refreshing the page

  // Get the form values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const feedback = document.getElementById('feedback').value;

  // Simple confirmation message
  alert(`Thank you, ${name}! Your feedback has been submitted.`);

  // Optionally, you could send the feedback to a server here

  // Clear form after submission
  document.getElementById('feedback-form').reset();
});
