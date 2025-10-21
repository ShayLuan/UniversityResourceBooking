function modifyField(buttonId, valueId, label) {
  const button = document.getElementById(buttonId);
  const value = document.getElementById(valueId);

  button.onclick = function () {
    if (button.textContent === "Modify") {
      const input = document.createElement("input");
      input.value = value.textContent.includes("Add") ? "" : value.textContent;
      value.textContent = "";
      value.appendChild(input);
      input.focus();
      button.textContent = "Save";
    } else {
      const input = value.querySelector("input");
      let newText = input.value.trim();
      if (newText === "") newText = "Add " + label.toLowerCase();
      value.textContent = newText;
      button.textContent = "Modify";
    }
  };
}

modifyField("modify-1", "value-1", "Full Name"); // buttonId, valueId, label
modifyField("modify-2", "value-2", "Email Address");
modifyField("modify-3", "value-3", "Password");
modifyField("modify-4", "value-4", "Cellular Phone");
modifyField("modify-5", "value-5", "Home Address");
