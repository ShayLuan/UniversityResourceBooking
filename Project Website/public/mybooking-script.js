function cancelBooking(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const li = btn.closest('.booking-item');
    if (li) li.remove();
}
