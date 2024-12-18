document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded fired!");
    
    const tripTypeDropdown = document.getElementById('tripType');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    const returnTimeContainer = document.getElementById('returnTimeContainer');
    const infoMessage = document.getElementById('infoMessage');
    const infoText = document.getElementById('infoText');
    
    // Check if elements exist
    if (!tripTypeDropdown || !nextButton || !submitButton || !returnTimeContainer || !infoMessage || !infoText) {
        console.error('Some elements are missing from the DOM!');
        return;
    }

    // Toggle visibility when the "Next" button is clicked
    nextButton.addEventListener('click', function () {
        const tripType = tripTypeDropdown.value;

        returnTimeContainer.style.display = 'none';
        infoMessage.style.display = 'none';
        console.log(tripType);  // This will log the trip type value

        if (tripType === 'round-trip') {
            returnTimeContainer.style.display = 'block';
        } else {
            infoMessage.style.display = 'block';
            infoText.textContent = 'Loading...';
        }

        submitButton.style.display = 'inline-block';
    });
});


// Form submission event
document.getElementById('passenger-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form from submitting normally

    // Get form data
    const passengerName = document.getElementById('passengerName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const numPassengers = document.getElementById('numPassengers').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const destination = document.getElementById('destination').value;
    const tripType = document.getElementById('tripType').value;
    const scheduledTime = document.getElementById('scheduledTime').value;
    const returnTime = tripType === 'round-trip' ? document.getElementById('returnTime').value : null;

    // Prepare passenger data object
    const passengerData = {
        passengerName,
        phoneNumber,
        email,
        numPassengers,
        pickupLocation,
        destination,
        tripType,
        scheduledTime,
        returnTime
    };

    // Submit data to the server
    async function submitPassengerData() {
        try {
            const response = await fetch('http://localhost:4000/save-passenger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passengerData)
            });

            if (!response.ok) {
                throw new Error('Failed to save passenger data');
            }

            alert('Passenger data saved successfully!');
            window.location.href = "available-drivers.html";
        } catch (error) {
            console.error('Error saving passenger data:', error);
            alert('Error saving passenger data');
        } finally {
            submitButton.disabled = false; // Re-enable the submit button
        }
    }

    submitPassengerData(); // Call the function to submit data
});

// Fetch and display passengers
function loadPassengers() {
    fetch('http://localhost:4000/get-passengers')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch passengers. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const passengerListDiv = document.getElementById('passenger-list');
            passengerListDiv.innerHTML = ''; // Clear existing list

            // Check if passengers are available
            if (!data.passengers || data.passengers.length === 0) {
                passengerListDiv.innerHTML = '<p>No passengers found.</p>';
                return;
            }

            // Populate passenger list
            data.passengers.forEach(passenger => {
                const passengerDiv = document.createElement('div');
                passengerDiv.classList.add('passenger-item');

                passengerDiv.innerHTML = `
                    <p><strong>Name:</strong> ${passenger.passengerName}</p>
                    <p><strong>Contact Number:</strong> ${passenger.contactNumber}</p>
                    <p><strong>Email:</strong> ${passenger.email}</p>
                    <p><strong>Number of Passengers:</strong> ${passenger.numPassengers}</p>
                    <p><strong>Pickup Location:</strong> ${passenger.pickupLocation}</p>
                    <p><strong>Destination:</strong> ${passenger.destination}</p>
                    <p><strong>Trip Type:</strong> ${passenger.tripType}</p>
                    <p><strong>Scheduled Time:</strong> ${passenger.scheduledTime}</p>
                    <hr>
                `;

                passengerListDiv.appendChild(passengerDiv);
            });
        })
        .catch(error => {
            console.error('Error loading passengers:', error);
            alert('Error loading passengers. Please check your connection or try again later.');
        });
}
