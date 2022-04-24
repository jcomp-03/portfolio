const tooltips = document.querySelectorAll('.tt');
tooltips.forEach(tt => {
    new bootstrap.Tooltip(tt);
})