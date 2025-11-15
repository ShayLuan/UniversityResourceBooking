flatpickr("#date", {
  minDate: "today",
  dateFormat: "Y-m-d",
  showMonths: 2,
  locale: { firstDayOfWeek: 1 }
});


const times = [
    "8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM",
    "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM",
    "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
    "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
    "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
    "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM",
    "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM",
    "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM",
    "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM",
    "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM",
    "6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM",
    "7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
    "8:00 PM"
];

const grid = document.getElementById("time-grid");
const timeInput = document.getElementById("time");

times.forEach(time => {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = time;
    slot.onclick = function () {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        timeInput.value = time;
    };
    grid.appendChild(slot);
});

// Required fields before confirm
const form = document.getElementById("bookingForm");

form.addEventListener("submit", (event) => {
  const missing = [];
  const date = document.getElementById("date");
  const time = document.getElementById("time");
  
  if (!date.value) {
    missing.push("Date");
  }

  if (!time.value) { 
    missing.push("Time");
  }

  if (missing.length > 0) {
    event.preventDefault();
    alert("You're missing the following required field:\n• " + missing.join("\n• "));
  }
});
