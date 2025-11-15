document.getElementById('manage-resource-link').addEventListener('click', function (event) {
    event.preventDefault(); // don't want the event to do its normal thing
    document.getElementById('edit-tools').style.display = "block";
});

document.getElementById('add-resource-button').addEventListener('click', function (event) {
    document.getElementById('add-resource-selector').style.display = "block";
});

document.getElementById('back-button').addEventListener('click', function (event) {
    document.getElementById('edit-tools').style.display = "none";
});

document.getElementById('resourceSelect').addEventListener('change', function (event) {
    document.getElementById('operation-selector').style.display = "block";
});

document.getElementById('operation-selector').addEventListener('change', function (event) {
    document.getElementById('confirm-changes').style.display = "flex";
});

document.getElementById('add-resource-selector').addEventListener('change', function (event) {
    if (this.value) {
        document.getElementById('add-resource-confirm-button').style.display = "flex";
    } else {
        document.getElementById('add-resource-confirm-button').style.display = "none";
    }
});

document.getElementById('analyticsCard').addEventListener('click', function () {
    window.open('analytics.html', '_blank', 'width=900,height=600');
});