// js/scan-qr-script.js

const resultBox = document.getElementById("result");
const scanner = new Html5Qrcode("reader");

function showMessage(message, success = true) {
  resultBox.innerHTML = `
    <p style="color:${success ? 'green' : 'red'}; font-weight:bold;">
      ${message}
    </p>
  `;
}

// Start QR scanner
function startScanner() {
  scanner.start(
    { facingMode: "environment" }, // rear camera
    { fps: 10, qrbox: 250 },       // scanning box size
    async (decodedText) => {
      // ✅ Stop scanning after successful read
      await scanner.stop();

      try {
        // Send QR data to backend (assuming QR contains studentId)
        const response = await fetch("/mark-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: decodedText })
        });

        const result = await response.json();

        if (result.success) {
          showMessage(`✅ ${result.name}'s attendance marked successfully!`);
        } else {
          showMessage(`❌ ${result.message}`, false);
        }
      } catch (err) {
        console.error(err);
        showMessage("⚠️ Error marking attendance", false);
      }

      // Auto-reset after 3 sec → ready for next student
      setTimeout(() => {
        resultBox.innerHTML = "";
        startScanner();
      }, 3000);
    },
    (errorMessage) => {
      // ignore scan errors, scanning continues
    }
  ).catch(err => {
    console.error("Scanner start failed:", err);
    showMessage("⚠️ Unable to access camera", false);
  });
}

// Start scanner when page loads
window.onload = () => {
  startScanner();
};
