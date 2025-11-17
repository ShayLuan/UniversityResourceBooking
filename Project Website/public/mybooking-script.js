
function formatDate(dateInput) {
    if (!dateInput) return 'Invalid date';
    
    let date;
    
    // handle date object direct from mysql
    if (dateInput instanceof Date) {
        date = dateInput;
    }
    // i'll try to handle both date object formats
    // seriously i'm not sure how the format part is not working
    else if (typeof dateInput === 'string') {
        const ymdMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (ymdMatch) {
            const [, year, month, day] = ymdMatch.map(Number);
            date = new Date(year, month - 1, day);
        }
        else if (dateInput.includes('T')) {
            date = new Date(dateInput);
        }
        else {
            date = new Date(dateInput);
        }
    }
    else {
        date = new Date(dateInput);
    } // i think by this point it should be a date object
      // and i've handled all formats lol 
    if (isNaN(date.getTime())) {
        console.error('Invalid date input:', dateInput);
        return 'Invalid date';
    }
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${day}, ${year}`;
}

// convert date 
function formatDateForInput(dateInput) {
    if (!dateInput) return '';
    
    let date;
    
    if (dateInput instanceof Date) {
        date = dateInput;
    }
    // string handler
    else if (typeof dateInput === 'string') {
        // if already good format, return 
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        date = new Date(dateInput);
    }
    else {
        date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Calculate end time from start time and duration
function calculateEndTime(startTime, durationMinutes) {
    const [timePart, ampm] = startTime.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    
    let hour24 = hours;
    if (ampm === 'PM' && hours !== 12) hour24 += 12;
    if (ampm === 'AM' && hours === 12) hour24 = 0;
    
    const startMinutes = hour24 * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHour24 = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    
    let endHour12 = endHour24 > 12 ? endHour24 - 12 : endHour24;
    if (endHour12 === 0) endHour12 = 12;
    const endAmpm = endHour24 >= 12 ? 'PM' : 'AM';
    
    return `${endHour12}:${endMin.toString().padStart(2, '0')} ${endAmpm}`;
}

// Format resource name for display
function formatResourceName(resource) {
    const resourceMap = {
        'study-rooms': 'Study Rooms',
        'computer-labs': 'Computer Labs',
        'sports-facilities': 'Sports Facilities',
        'event-spaces': 'Event Spaces',
        'library-resources': 'Library Resources'
    };
    return resourceMap[resource] || resource;
}

// Load bookings from server
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            console.error('Failed to load bookings');
            return;
        }
        
        const bookings = await response.json();
        const bookingList = document.getElementById('booking-list');
        
        if (bookings.length === 0) {
            bookingList.innerHTML = '<li style="text-align: center; padding: 2rem; color: #666;">No bookings found.</li>';
            return;
        }
        
        bookingList.innerHTML = bookings.map((booking, index) => {
            const formattedDate = formatDate(booking.date);
            const endTime = calculateEndTime(booking.time, booking.duration);
            const timeRange = `${booking.time}–${endTime}`;
            const resourceName = formatResourceName(booking.resource);
            
            // Get date in YYYY-MM-DD format for modify button
            const dateForModify = formatDateForInput(booking.date);
            
            return `
                <li class="booking-item">
                    <div class="details">
                        <strong>${resourceName}</strong>
                        <span>${formattedDate} • ${timeRange}</span>
                    </div>
                    <div class="actions">
                        <button id="modify-${booking.id}" class="button-outline" type="button" onclick="modifyBooking(${booking.id}, '${booking.resource.replace(/'/g, "\\'")}', '${dateForModify}', '${booking.time.replace(/'/g, "\\'")}', ${booking.duration})">
                            Modify
                        </button>
                        <button
                            id="booking-${booking.id}"
                            class="button outline"
                            type="button"
                            onclick="cancelBooking(${booking.id})"
                        >
                            Cancel
                        </button>
                    </div>
                </li>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading bookings:', err);
    }
}

// modify booking - redirects to booking form
function modifyBooking(bookingId, resource, date, time, duration) {
    // for the form conver
    const dateForForm = formatDateForInput(date);
    
    // store booking data in sessionStorage
    sessionStorage.setItem('modifyBooking', JSON.stringify({
        id: bookingId,
        resource: resource,
        date: dateForForm,
        time: time,
        duration: duration
    }));
    
    // redirect to booking form
    window.location.href = '/booking-form.html';
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Reload bookings
            await loadBookings();
        } else {
            alert('Failed to cancel booking');
        }
    } catch (err) {
        console.error('Error canceling booking:', err);
        alert('Error canceling booking. Please try again.');
    }
}

// Load bookings when page loads
document.addEventListener('DOMContentLoaded', loadBookings);
