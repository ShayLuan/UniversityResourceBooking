
/* Catching Mismatching password & its confirmation (Register)*/
document.getElementById("register-form").addEventListener("submit", function(event) 
{
    /* Comparing passwords */
    let pw1 = document.getElementById("password").value;
    let pw2 = document.getElementById("confirm-password").value;
    if (pw1 !== pw2) {
        alert("Passwords do not match!"); // An alert pop up
        event.preventDefault(); // Stops the form from submitting
    }
}
);