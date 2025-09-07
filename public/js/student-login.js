// student-login.js

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submission

  // Get form data
  const formData = new FormData(loginForm);
  const data = {
    studentId: formData.get("studentId"),
    password: formData.get("password")
  };

  try {
    // Send login request to server
    const response = await fetch("/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      // ✅ Save studentId in localStorage for dashboard
      localStorage.setItem("studentId", result.studentId);

      // Redirect to student dashboard
      window.location.href = "/student-dashboard";
    } else {
      alert(result.message || "Login failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error during login");
  }
});
