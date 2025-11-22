// when the page loads, we gotta load user data as well
async function loadUserData() {
  try {
    const res = await fetch("/api/user", { credentials: "include" });
    if (!res.ok) {
      console.error("Failed to load user data");
      return;
    }

    const user = await res.json();

    // full name must correspond
    const nameElement = document.getElementById("value-1");
    if (nameElement && user.name) {
      nameElement.textContent = user.name;
    }

    // email too
    const emailElement = document.getElementById("value-2");
    if (emailElement && user.email) {
      emailElement.textContent = user.email;
    }

    // phone
    const phoneElement = document.getElementById("value-4");
    if (phoneElement) {
      if (user.phone && user.phone.trim()) {
        phoneElement.textContent = user.phone;
        phoneElement.classList.remove("muted");
      } else {
        phoneElement.textContent = "Add number";
        phoneElement.classList.add("muted");
      }
    }

    // address
    const addressElement = document.getElementById("value-5");
    if (addressElement) {
      if (user.address && user.address.trim()) {
        addressElement.textContent = user.address;
        addressElement.classList.remove("muted");
      } else {
        addressElement.textContent = "Add home address";
        addressElement.classList.add("muted");
      }
    }
  } catch (err) {
    console.error("Error loading user data:", err);
  }
}

function validateField(fieldName, value) {

}

function modifyField(buttonId, valueId, label) {
  const button = document.getElementById(buttonId);
  const value = document.getElementById(valueId);

  button.onclick = async function () {
    if (button.textContent === "Modify") {
      const input = document.createElement("input");
      // Set input type based on label
      if (label.toLowerCase().includes("email")) {
        input.type = "email";
      } else if (label.toLowerCase().includes("phone") || label.toLowerCase().includes("cellular")) {
        input.type = "tel";
      } else {
        input.type = "text";
      }
      input.value = value.textContent.includes("Add") ? "" : value.textContent;
      value.textContent = "";
      value.appendChild(input);
      input.focus();
      button.textContent = "Save";
    } else {
      const input = value.querySelector("input");
      let newText = input.value.trim();
      const isEmpty = newText === "";

      // for api
      let fieldName = "";
      if (label.toLowerCase().includes("name")) {
        fieldName = "name";
      } else if (label.toLowerCase().includes("email")) {
        fieldName = "email";
      } else if (label.toLowerCase().includes("phone") || label.toLowerCase().includes("cellular")) {
        fieldName = "phone";
      } else if (label.toLowerCase().includes("address")) {
        fieldName = "address";
      }

      // save to server if all good
      if (fieldName) {
        button.textContent = "Saving...";
        button.disabled = true;

        try {
          const updateData = {};

          if (isEmpty) {
            if (fieldName === "name" || fieldName === "email") {
              // if name and email cannot be empty
              alert(`${label} cannot be empty`);
              button.textContent = "Save";
              button.disabled = false;
              return;
            }

            // allow these fields to be empty if ever
            if (fieldName === "phone") {
              updateData.phone = "";
            } else if (fieldName === "address") {
              updateData.address = "";
            }

          } else {
            // validation check
            if (fieldName === "name") {
              if (newText.length < 2) {
                alert("Name must be at least 2 characters.");
                button.textContent = "Save";
                button.disabled = false;
                return;
              }
              if (newText.length > 255) {
                alert("Name is too long.");
                button.textContent = "Save";
                button.disabled = false;
                return;
              }
            } else if (fieldName === "email") {
              // must have a pattern such as someName@someEmail.com
              const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailCheck.test(newText)) {
                alert("Please enter a valid email address.");
                button.textContent = "Save";
                button.disabled = false;
                return;
              }
            } else if (fieldName === "phone") {
              // allow for these signs  (+, spaces, dashes, parentheses and digits)
              const phoneCheck = /^[0-9+\-\s()]{7,20}$/;
              if (!phoneCheck.test(newText)) {
                alert("Please enter a valid phone number.");
                button.textContent = "Save";
                button.disabled = false;
                return;
              }
            } else if (fieldName === "address") {
              // address validation
              if (newText.length < 5) {
                alert("Address is too short.");
                button.textContent = "Save";
                button.disabled = false;
                return;
              }
            }

            // send update to backend
            updateData[fieldName] = newText;
          }

          const res = await fetch("/api/user", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(updateData)
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.error || "Failed to update " + label);
            button.textContent = "Save";
            button.disabled = false;
            return;
          }

          // Update display
          if (isEmpty) {
            newText = "Add " + label.toLowerCase();
            value.classList.add("muted");
          } else {
            value.classList.remove("muted");
          }
          value.textContent = newText;
          button.textContent = "Modify";
          button.disabled = false;

        } catch (err) {
          console.error("Error updating field:", err);
          alert("An error occurred while updating " + label);
          button.textContent = "Save";
          button.disabled = false;
        }
      } else {
        // For fields not saved to server, just update display
        if (isEmpty) newText = "Add " + label.toLowerCase();
        value.textContent = newText;
        button.textContent = "Modify";
      }
    }
  };
}

// password modification 
function modifyPassword() {
  const button = document.getElementById("modify-3");
  const value = document.getElementById("value-3");
  let step = 0;

  // NB: 
  // this part has steps
  // step 0 - initial state
  // step 1 - current password entered
  // step 2 - new password and confirm password entered

  button.onclick = async function () {
    if (button.textContent === "Modify") {
      // create elements for current password
      step = 0;
      value.innerHTML = "";

      const currentPasswordLabel = document.createElement("label");
      currentPasswordLabel.className = "password-label";
      currentPasswordLabel.textContent = "Current Password: ";

      const currentPasswordInput = document.createElement("input");
      currentPasswordInput.type = "password";
      currentPasswordInput.className = "password-input";
      currentPasswordInput.placeholder = "Enter current password";

      value.appendChild(currentPasswordLabel);
      value.appendChild(currentPasswordInput);
      currentPasswordInput.focus();
      button.textContent = "Next";

      value.dataset.step = "0";

    } else if (button.textContent === "Next") {
      // check current pw
      const currentPasswordInput = value.querySelector("input[type='password']");
      const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : "";
      const existingError = value.querySelector(".password-error");

      // remove the error msg
      if (existingError) {
        existingError.remove();
      }

      if (!currentPassword) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "Please enter your current password";
        value.appendChild(errorMsg);
        return;
      }

      // check pw with server
      button.textContent = "Verifying...";
      button.disabled = true;

      try {
        const res = await fetch("/api/user/verify-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ password: currentPassword })
        });

        const data = await res.json();
        button.disabled = false;

        if (!res.ok || !data.valid) {
          const errorMsg = document.createElement("span");
          errorMsg.className = "password-error";
          errorMsg.textContent = "Current password is incorrect";
          value.appendChild(errorMsg);
          button.textContent = "Next";
          return;
        }

        // still need current password cuz can't be the same
        value.dataset.currentPassword = currentPassword;

        // new fields for new password and confirm
        value.innerHTML = "";

        const currentPasswordLabel = document.createElement("label");
        currentPasswordLabel.className = "password-label";
        currentPasswordLabel.textContent = "Current Password: ";

        const currentPasswordDisplay = document.createElement("span");
        currentPasswordDisplay.className = "password-success";
        currentPasswordDisplay.textContent = "✓ Verified";

        currentPasswordLabel.appendChild(currentPasswordDisplay);

        const newPasswordLabel = document.createElement("label");
        newPasswordLabel.className = "password-label";
        newPasswordLabel.textContent = "New Password: ";
        newPasswordLabel.style.marginTop = "10px";

        const newPasswordInput = document.createElement("input");
        newPasswordInput.type = "password";
        newPasswordInput.id = "new-password-input";
        newPasswordInput.className = "password-input";
        newPasswordInput.placeholder = "Enter new password";

        const confirmPasswordLabel = document.createElement("label");
        confirmPasswordLabel.className = "password-label";
        confirmPasswordLabel.textContent = "Confirm New Password: ";
        confirmPasswordLabel.style.marginTop = "10px";

        const confirmPasswordInput = document.createElement("input");
        confirmPasswordInput.type = "password";
        confirmPasswordInput.id = "confirm-password-input";
        confirmPasswordInput.className = "password-input";
        confirmPasswordInput.placeholder = "Confirm new password";

        value.appendChild(currentPasswordLabel);
        value.appendChild(newPasswordLabel);
        value.appendChild(newPasswordInput);
        value.appendChild(confirmPasswordLabel);
        value.appendChild(confirmPasswordInput);

        newPasswordInput.focus();
        button.textContent = "Save";
        value.dataset.step = "1";

      } catch (err) {
        console.error("Error verifying password:", err);
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "An error occurred. Please try again.";
        value.appendChild(errorMsg);
        button.textContent = "Next";
        button.disabled = false;
      }

    } else if (button.textContent === "Save") {
      // now validate and save new data
      const currentPassword = value.dataset.currentPassword;
      const newPasswordInput = document.getElementById("new-password-input");
      const confirmPasswordInput = document.getElementById("confirm-password-input");
      const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

      const existingErrors = value.querySelectorAll(".password-error");
      existingErrors.forEach(err => err.remove());

      // valid?
      if (!newPassword) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "Please enter a new password";
        newPasswordInput.parentNode.insertBefore(errorMsg, newPasswordInput.nextSibling);
        return;
      }

      if (newPassword !== confirmPassword) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "New password and confirmation do not match";
        confirmPasswordInput.parentNode.insertBefore(errorMsg, confirmPasswordInput.nextSibling);
        return;
      }

      if (newPassword === currentPassword) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "New password must be different from current password";
        newPasswordInput.parentNode.insertBefore(errorMsg, newPasswordInput.nextSibling);
        return;
      }

      // send to server
      button.textContent = "Saving...";
      button.disabled = true;

      try {
        const res = await fetch("/api/user/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
          })
        });

        const data = await res.json();

        if (!res.ok) {
          const errorMsg = document.createElement("span");
          errorMsg.className = "password-error";
          errorMsg.textContent = data.error || "Failed to update password";
          value.appendChild(errorMsg);
          button.textContent = "Save";
          button.disabled = false;
          return;
        }

        // show success message
        value.innerHTML = "";
        const successLabel = document.createElement("label");
        successLabel.className = "password-label";
        successLabel.textContent = "Password: ";

        const successMsg = document.createElement("span");
        successMsg.className = "password-success";
        successMsg.textContent = "✓ Password updated successfully";

        successLabel.appendChild(successMsg);
        value.appendChild(successLabel);

        // reset to display mode after a short delay
        setTimeout(() => {
          value.textContent = "**********";
          value.dataset.mask = "true";
          button.textContent = "Modify";
          button.disabled = false;
          value.dataset.step = "0";
          delete value.dataset.currentPassword;
        }, 2000);

      } catch (err) {
        console.error("Error updating password:", err);
        const errorMsg = document.createElement("span");
        errorMsg.className = "password-error";
        errorMsg.textContent = "An error occurred while updating password";
        value.appendChild(errorMsg);
        button.textContent = "Save";
        button.disabled = false;
      }
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadUserData();

  modifyField("modify-1", "value-1", "Full Name");
  modifyField("modify-2", "value-2", "Email Address");
  modifyPassword(); // changed this for a whole new function
  modifyField("modify-4", "value-4", "Cellular Phone");
  modifyField("modify-5", "value-5", "Home Address");
});
