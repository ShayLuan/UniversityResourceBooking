
/* Register submission with inline error handling */
const registerForm = document.getElementById("register-form");
if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const pw1 = document.getElementById("password").value;
        const pw2 = document.getElementById("confirm-password").value;
        const errorEl = document.getElementById("register-error");

        if (errorEl) errorEl.textContent = "";

        // password match check(frontend)
        if (pw1 !== pw2) {
            if (errorEl) errorEl.textContent = "Passwords do not match.";
            return;
        }

        // checking required fields 
        if (!name || !email || !pw1) {
            if (errorEl) errorEl.textContent = "Please fill all required fields.";
            return;
        }

        try {
            //sending confirm-password to backend
            const body = new URLSearchParams ({ 
                name, 
                email, 
                password: pw1,
                "confirm-password": pw2
            });

            const res = await fetch("/Register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body
            });

            if (res.ok) {
                window.location.href = "/Login.html";
                return;
            }
            const data = await res.json().catch(() => ({}));

            if (res.status === 409 && data && data.error === "duplicate_email") {
                if (errorEl) errorEl.textContent = "*this email already registered.";
                return;
            }
            if (errorEl) errorEl.textContent = data.message || "Registration failed. Please try again.";

        } catch (e) {
            if (errorEl) errorEl.textContent = "Network error. Please try again.";
        }
    });
}