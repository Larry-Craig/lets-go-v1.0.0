document.getElementById('book-ride').addEventListener('click', function() {
    const pickupLocation = document.getElementById('pickup').value;
    const dropoffLocation = document.getElementById('dropoff').value;

    if (pickupLocation && dropoffLocation) {
        alert(`Booking a ride from ${pickupLocation} to ${dropoffLocation}`);
        // Here you can add further logic for booking a ride, like sending data to the server.
    } else {
        alert('Please enter both pickup and dropoff locations.');
    }
});