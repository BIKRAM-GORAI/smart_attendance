// Get the form element
const form = document.getElementById('teacherSignupForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Collect form data using the IDs
  const teacherData = {
    fullName: document.getElementById('fullName').value.trim(),
    teacherId: document.getElementById('teacherId').value.trim(),
    gender: document.getElementById('gender').value,
    whatsapp: document.getElementById('whatsapp').value.trim(),
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value
  };

  // Validate password match
  if (teacherData.password !== teacherData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    // Send POST request to /teacher-signup
    const response = await fetch('/teacher-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });

    const result = await response.json();

    if (result.success) {
      alert("Signup successful! Please login.");
      window.location.href = '/teacher-login';
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error(err);
    alert("Something went wrong! Please try again.");
  }
});

// Optional: Password strength indicator
function checkPasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthIndicator = document.getElementById('strengthIndicator');

  if (password.length >= 8) {
    strengthIndicator.style.backgroundColor = "green";
  } else if (password.length >= 5) {
    strengthIndicator.style.backgroundColor = "orange";
  } else {
    strengthIndicator.style.backgroundColor = "#475569";
  }
}
