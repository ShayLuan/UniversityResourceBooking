flatpickr("#date", {
  minDate: "today",
  dateFormat: "Y-m-d",
  showMonths: 2,
  locale: { firstDayOfWeek: 1 }
});


// ==============================================
// LOAD REAL RESOURCES FROM THE DATABASE
// ==============================================
async function loadResources() {
  const select = document.getElementById("resource");
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const res = await fetch("/api/resources");
    const resources = await res.json();

    // Clear dropdown
    select.innerHTML = `<option value="">Choose a resource...</option>`;

    // Add each resource ( using real DB names)
    resources.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.name;        //saves real name
      opt.textContent = r.name;  //displays real name
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load resources:", err);
    select.innerHTML = `<option value="">Error loading resources</option>`;
  }
}

// Call immediately
loadResources();




// let's forget about the hardcoded times
function generateTimeSlots() {
  const times = [];
  for (let hour = 8; hour <= 20; hour++) {
    // Convert to 12-hour format
    let hour12 = hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) {
      hour12 = hour - 12;
    } else if (hour === 0) {
      hour12 = 12;
    }

    // Add :00 slot
    const time00 = `${hour12}:00 ${ampm}`;
    times.push(time00);

    // no :30 for last one 
    if (hour < 20) {
      const time30 = `${hour12}:30 ${ampm}`;
      times.push(time30);
    }
  }
  return times;
}

const times = generateTimeSlots();
const timeScrollContainer = document.getElementById("time-scroll");
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
  timeScrollContainer.appendChild(slot);
});

// Check if we're modifying an existing booking
let modifyBookingId = null;
const modifyData = sessionStorage.getItem('modifyBooking');
if (modifyData) {
  try {
    const booking = JSON.parse(modifyData);
    modifyBookingId = booking.id;

    // Pre-fill the form
    document.getElementById('resource').value = booking.resource;
    document.getElementById('date').value = booking.date;
    document.getElementById('duration').value = booking.duration;

    // Set the time slot
    timeInput.value = booking.time;
    document.querySelectorAll('.time-slot').forEach(slot => {
      if (slot.textContent.trim() === booking.time) {
        slot.classList.add('selected');
      }
    });

    // Update form title
    document.querySelector('h1').textContent = 'Modify Booking';

    // Clear sessionStorage after using it
    sessionStorage.removeItem('modifyBooking');
  } catch (err) {
    console.error('Error parsing modify booking data:', err);
  }
}

// Required fields before confirm
const form = document.getElementById("bookingForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const missing = [];
  const date = document.getElementById("date");
  const time = document.getElementById("time");
  const duration = document.getElementById("duration");
  const resource = document.getElementById("resource");

  if (!date.value) {
    missing.push("Date");
  }

  if (!time.value) {
    missing.push("Time");
  }

  if (!duration.value) {
    missing.push("Time period");
  }

  if (!resource.value) {
    missing.push("Resource");
  }

  if (missing.length > 0) {
    alert("You're missing the following required field:\n• " + missing.join("\n• "));
    return;
  }

  // Submit booking to backend
  try {
    const url = modifyBookingId ? `/api/bookings/${modifyBookingId}` : '/api/bookings';
    const method = modifyBookingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resource: resource.value,
        date: date.value,
        time: time.value,
        duration: parseInt(duration.value)
      })
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      alert(modifyBookingId ? 'Booking updated successfully!' : 'Booking created successfully!');
      window.location.href = '/MyBookings.html';
    } else {
      alert(`Failed to ${modifyBookingId ? 'update' : 'create'} booking: ` + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert(`Error ${modifyBookingId ? 'updating' : 'creating'} booking. Please try again.`);
  }
});
