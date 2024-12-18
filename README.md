# **TigerHack 2024: Transportation Solutions**

### **Overview**
This project aims to provide a comprehensive transportation system for DePauw University students emphasizing convenience, accessibility, and cost-effectiveness. The system includes a platform for matching passengers with local drivers, managing bicycle rentals. It ensures safety, efficiency, and seamless coordination through smart scheduling and real-time availability tracking.

---

## **Features**

### 1. **Transportation Classification**
   - Comprehensive listing of available transportation options:
     - Rural transits
     - Local drivers
     - Bicycle rentals
    - Contact information for transit providers.

---

### 2. **Driver-Passenger Matching System**
#### **Drivers**
- Fill out a form with:
  - Availability schedule
  - Precise locations
  - Capacity (number of passengers)
  - Round trip or one-way options
- Submit preferences for types of passengers (if applicable).
- Drivers have choice of choosing passengers and time blocks.

#### **Passengers**
- Specify travel needs, such as:
  - Number of passengers
  - Trip type (roundtrip or one-way)
  - Desired location(s) and time.

#### **Process**
- Drivers choose their potential passengers based on provided information.
- Passengers receive email, notifying their drivers' information and trip details.
- Passengers can have choice of agree or refuse to take this trip.
---

### 3. **Bicycle Rental Program**
- **Free Rentals**:
  - Available for specific time blocks.
  - Helmets provided for safety.
- **Tracking & Management**:
  - Real-time tracking of available bicycles.
  - Students must fill out forms for:
    - Duration of use
    - Extensions (additional fees may apply).
- **Advance Booking**:
  - Reserve bicycles in advance for planned trips.

---

## **Getting Started**

### **Installation**
1. Clone this repository:
   ```bash
   git clone https://github.com/chingo09/TigerHack.git
   ```
2. Install dependencies:
   ```bash
   cd TigerHack
   ```
   ```bash
   cd TransportSolution
   ```
   ```bash
   npm init -y
   ```
   ```bash
   npm install express body-parser xlsx
   ```
   ```bash
   npm install express csv-parser csv-writer body-parser cors
   ```
   ```bash
   node server.js
---

### **Usage**
1. **Driver-Student Matching**:
   - Drivers fill out availability forms.
   - Students request rides using the passenger form.
   - Drivers choose passengers based on preference. 

2. **Bicycle Rentals**:
   - Use the web platform to view available bicycles.
   - Fill out a reservation form.

---

## **Budget Considerations**
1. **Bicycle Rentals**:
   - Fees (TBD) for extended usage.
   - Helmets provided for safety.
2. **Driver Matching System**:
   - Emergency trip fees (details TBD).
3. **Shuttle Services**:
   - University funding for requests exceeding ⅔ seat capacity.

---

## **Future Improvements**
- Advanced matching patterns for student drivers and passengers.
- Mobile app for streamlined access.
- Enhanced safety protocols for all transportation options.

