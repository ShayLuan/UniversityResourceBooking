function cancelBooking(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const li = btn.closest('.booking-item');
    if (li) li.remove();
}
function modifyBooking(id) {
    window.location.href = 'booking-form.html';
}