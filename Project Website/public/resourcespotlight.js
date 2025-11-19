// ==============================
// Resource Spotlight Calendar JS
// ==============================

// Current calendar month
let currentDate = new Date();

// Bookings for the currently selected resource
// [{ id, user_id, resource, date, time, duration }]
let bookings = [];

// added this to format the dropdown properly
function formatResourceName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// --------------------------------------------------------
// LOAD RESOURCES
// --------------------------------------------------------
async function loadResources() {
    try {
        const res = await fetch("/api/resources", { credentials: "include" });
        const list = await res.json();

        const select = document.getElementById("resourceSelect");
        select.innerHTML = "";

        list.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.name;       
            opt.textContent = formatResourceName(r.name); // i formatted dispplay cuz otherwise it's an ugly name
            select.appendChild(opt);
        });

        // Auto-load first resource
        if (list.length > 0) {
            select.value = list[0].name;
            loadBookingsForResource(list[0].name);
        }

    } catch (err) {
        console.error("Failed loading resources:", err);
    }
}

// --------------------------------------------------------
// LOAD BOOKINGS FOR SELECTED RESOURCE
// --------------------------------------------------------
async function loadBookingsForResource(resourceName) {
    try {
        const res = await fetch(`/api/bookings/resource/${resourceName}`, {
            credentials: "include"
        });

        if (!res.ok) {
            console.error("Error fetching bookings for resource:", resourceName);
            bookings = [];
            renderCalendar();
            return;
        }

        bookings = await res.json();
        console.log("Bookings for", resourceName, bookings);
        renderCalendar();
    } catch (err) {
        console.error("Failed to load bookings:", err);
    }
}

// Helper: normalize any date value to "YYYY-MM-DD"
function normalizedDate(raw) {
    const d = new Date(raw);
    if (isNaN(d)) return raw;  // if it's already a "YYYY-MM-DD" string it might just pass through
    return d.toISOString().split("T")[0];
}

// --------------------------------------------------------
// RENDER CALENDAR
// --------------------------------------------------------
function renderCalendar() {
    const monthLabel = document.getElementById("monthLabel");
    const grid = document.getElementById("calendarGrid");

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Set label (e.g., "November 2025")
    monthLabel.textContent = currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    // Remove old day cells
    const oldDays = grid.querySelectorAll(".day");
    oldDays.forEach(cell => cell.remove());

    // First day of this month, and total number of days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement("div");
        div.classList.add("day", "empty");
        grid.appendChild(div);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
        const div = document.createElement("div");
        div.classList.add("day");
        div.textContent = day;

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Match bookings for this date
        const dayBookings = bookings.filter(b => normalizedDate(b.date) === dateStr);

        if (dayBookings.length > 0) {
            // Sum total duration in minutes
            const totalMinutes = dayBookings.reduce((sum, b) => {
                const dur = Number(b.duration) || 0;
                return sum + dur;
            }, 0);

            const totalHours = (totalMinutes / 60).toFixed(1);

            // Apply color rule:
            // < 3 hours => yellow; >= 3 hours => red
            if (totalMinutes < 180) {
                div.classList.add("booked-light");
            } else {
                div.classList.add("booked-heavy");
            }

            // Tooltip showing details
            const tooltip = document.createElement("div");
            tooltip.classList.add("tooltip");
            tooltip.innerHTML = `
                <strong>${totalHours} hours booked</strong><br>
                ${dayBookings.length} booking(s)
            `;
            div.appendChild(tooltip);
            div.classList.add("has-tooltip");
        }

        // Highlight today (optional: only if month/year match current real date)
        const today = new Date();
        if (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        ) {
            div.classList.add("today");
        }

        grid.appendChild(div);
    }
}

// --------------------------------------------------------
// EVENT LISTENERS
// --------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Load resources when page loads
    loadResources();

    // Month navigation
    document.getElementById("prevMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Resource dropdown change
    document.getElementById("resourceSelect").addEventListener("change", (e) => {
        const val = e.target.value;
        loadBookingsForResource(val);
    });
});
