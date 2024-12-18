const availableBikesContainer = document.getElementById("availableBikes");
availableBikesContainer.innerHTML = "";

// Function to filter available bikes
function MakeList(bicycles) {
    const availableBikes = bicycles.filter(bike => bike.available);  // Filter available bikes
    return availableBikes;
}

// Function to fetch the list of available bikes and display them
async function printList() {
    try {
        const response = await fetch('http://localhost:4000/read-csv'); // Fetch bicycles from the server
        if (!response.ok) {
            throw new Error('Failed to fetch bicycles');
        }
//hello
        const bicycles = await response.json(); // Parse the JSON response
        const rentTimeInput = document.getElementById('rentTime'); // Get rent time input
        const sname = document.getElementById('name').value; // Get the student name
        const sid = document.getElementById('studentid').value; // Get the student ID
        const semail = document.getElementById('studentemail').value; // Get the student email
        const rentTime = parseInt(rentTimeInput.value, 10); // Parse the rent time as an integer

        const availableBikes = MakeList(bicycles); // Filter for available bikes
        console.log(availableBikes);

        if (availableBikes.length === 0) {
            availableBikesContainer.innerHTML = `<p>No bicycles available at this time.</p>`;
        } else {
            availableBikesContainer.innerHTML = ''; // Clear previous content
            availableBikes.forEach(bike => {
                const bikeOption = document.createElement("button");
                bikeOption.textContent = `Bicycle #${bike.id}`;
                bikeOption.onclick = () => rentBicycle(bike.id, rentTime, sname, sid, semail); // Pass bike ID and rent time
                availableBikesContainer.appendChild(bikeOption);
            });
        }
    } catch (error) {
        console.error('Error:', error);
        availableBikesContainer.innerHTML = `<p>Failed to load bicycles. Please try again later.</p>`;
    }
}

// Function to rent a bicycle
function rentBicycle(ID, rentTime, sname, sid, semail) {
    const data = { bikeID: ID, rentTime: rentTime, sname: sname, sid: sid, semail: semail };
    fetch('http://localhost:4000/rent-bicycle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Display success message to the user
            const messageBox = document.createElement('div');
            messageBox.textContent = data.message;
            messageBox.style.backgroundColor = '#dff0d8'; // Light green for success
            messageBox.style.padding = '10px';
            messageBox.style.marginTop = '10px';
            document.body.appendChild(messageBox);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Function to update bicycle statuses (get available bicycles)
fetch('http://localhost:4000/update-time', {
    method: 'GET',  // GET request to update time
    headers: {
        'Content-Type': 'application/json'  // Set the content type to JSON
    }
})
    .then(response => response.json())  // Parse the JSON response from the server
    .then(data => {
        // Handle the response from the server (e.g., show a success message)
        console.log(data.message);
    })
    .catch(error => {
        // Handle errors
        console.error('Error:', error);
    });

console.log("Hello");
