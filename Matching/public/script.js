document.getElementById('matchBtn').addEventListener('click', () => {
    fetch('http://localhost:4010/match', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        const resultsTable = document.getElementById('resultsTable');
        resultsTable.innerHTML = ''; // Clear previous results

        data.forEach(match => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${match.passengerName}</td>
                <td>${match.driverName}</td>
                <td>${match.pickupLocation}</td>
                <td>${match.destination}</td>
                <td>${new Date(match.scheduledTime).toLocaleString()}</td>
                <td>${match.tripType}</td>
            `;
            resultsTable.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
