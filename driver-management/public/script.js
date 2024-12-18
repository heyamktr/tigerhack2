class LocalDriver {
    constructor(name, phoneNumber, car, capacity, available) {
        this.name = name; // Driver's name
        this.phoneNumber = phoneNumber; // Driver's contact number
        this.car = car; // Car make/model
        this.capacity = capacity; // Number of passengers the car can accommodate
        this.available = available; // Availability status of the driver
    }

    // Getters and Setters for each property
    getName() {
        return this.name;
    }

    setName(newName) {
        this.name = newName;
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }

    setPhoneNumber(newPhoneNumber) {
        this.phoneNumber = newPhoneNumber;
    }

    getCar() {
        return this.car;
    }

    setCar(newCar) {
        this.car = newCar;
    }

    getCapacity() {
        return this.capacity;
    }

    setCapacity(newCapacity) {
        if (newCapacity >= 1) {
            this.capacity = newCapacity;
        }
    }

    // Availability Getter/Setter
    getAvailability() {
        return this.available;
    }

    setAvailability(status) {
        this.available = status;
    }

    // Method to return the driver's data in a structured format for displaying
    displayDriver() {
        return `
            <div class="driver-info">
                <p><strong>Driver Name:</strong> ${this.name}</p>
                <p><strong>Phone Number:</strong> ${this.phoneNumber}</p>
                <p><strong>Car:</strong> ${this.car}</p>
                <p><strong>Capacity:</strong> ${this.capacity} passengers</p>
                <p><strong>Availability:</strong> ${this.available ? "Available" : "Not Available"}</p>
            </div>
        `;
    }
}

module.exports = LocalDriver;
