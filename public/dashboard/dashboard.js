const toggleButton = document.getElementById('toggle-btn')
const sidebar = document.getElementById('sidebar')

function toggleSidebar() {
    sidebar.classList.toggle('close')
    toggleButton.classList.toggle('rotate')

    closeAllSubMenus()
}

function toggleSubMenu(button) {

    if (!button.nextElementSibling.classList.contains('show')) {
        closeAllSubMenus()
    }

    button.nextElementSibling.classList.toggle('show')
    button.classList.toggle('rotate')

    if (sidebar.classList.contains('close')) {
        sidebar.classList.toggle('close')
        toggleButton.classList.toggle('rotate')
    }
}

function closeAllSubMenus() {
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
        ul.classList.remove('show')
        ul.previousElementSibling.classList.remove('rotate')
    })
}

//fuel sensor data 

function updateFuelLevel(level) {
    const water = document.getElementById("waterLevel");
    const text = document.getElementById("fuelText");
    water.style.height = level + "%";
    text.innerText = level + "%";
}
// Example: Simulating data update
setTimeout(() => updateFuelLevel(75), 1000); // Smoothly fill to 100% in 5 seconds


//battery sensor data

const charge = document.querySelector(".charge");
const batteryPercentage = document.getElementById("battery-percentage");
const batterySlider = document.getElementById("battery-slider");

function updateBattery(level) {
    charge.style.height = level + "%";

    if (level <= 25) {
        charge.style.background = "var(--red)";
    } else if (level <= 50) {
        charge.style.background = "var(--orange)";
    } else if (level <= 75) {
        charge.style.background = "var(--yellow)";
    } else if (level <= 100) {
        charge.style.background = "var(--green)";
    }

    batteryPercentage.innerText = `Battery: ${level}%`;
}

batterySlider.addEventListener("input", (event) => {
    updateBattery(event.target.value);
});

updateBattery(0);

// Set your fixed latitude and longitude (Replace with your actual coordinates)
let latitude = 6.1213940;  // Example: San Francisco
let longitude = 80.3353461;  // Example: San Francisco

// Initialize the map at your fixed location
let map = L.map('map').setView([latitude, longitude], 20);

// Load OpenStreetMap tiles
L.tileLayer('https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=SaEENvPjbsqJNNpQTrXe', {
    attribution: '&copy; MapTiler & OpenStreetMap contributors'
}).addTo(map);

// Add a marker at the fixed location
L.marker([latitude, longitude]).addTo(map)
    .bindPopup(`Vehical: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    .openPopup();
