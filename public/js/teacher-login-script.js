// teacher-login-script.js

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loginData = {
    teacherId: document.getElementById("teacherId").value.trim(),
    password: document.getElementById("password").value
  };

  try {
    const response = await fetch("/teacher-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to dashboard
      window.location.href = result.redirect;
    } else {
      // Show error
      alert(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong! Please try again.");
  }
});
