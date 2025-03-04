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


       

        let tripActive = false;
        let route;
        let marker, startTime, stopStart, totalDistance = 0, maxSpeed = 0, minSpeed = Infinity;

        // Initialize map
        const map = L.map('map').setView([0, 0], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        
        // Initialize route after map
        route = L.polyline([], { color: 'blue' }).addTo(map);

        // Listen for GPS updates
        let prevLatLng = null;
        db.ref('gps-data').on('value', snapshot => {
            const data = snapshot.val();
            if (data && tripActive) {
                const { latitude, longitude, speed, timestamp } = data;
                const currentLatLng = [latitude, longitude];
                
                map.setView(currentLatLng, 13);
                route.addLatLng(currentLatLng);
                if (marker) map.removeLayer(marker);
                marker = L.marker(currentLatLng).addTo(map);
                
                document.getElementById('speed').textContent = speed;
                maxSpeed = Math.max(maxSpeed, speed);
                minSpeed = Math.min(minSpeed, speed);
                document.getElementById('maxSpeed').textContent = maxSpeed;
                document.getElementById('minSpeed').textContent = minSpeed;

                // Calculate distance
                if (prevLatLng) {
                    const distance = getDistance(prevLatLng, currentLatLng);
                    totalDistance += distance;
                    document.getElementById('distance').textContent = totalDistance.toFixed(2);
                }
                prevLatLng = currentLatLng;
            }
        });

        function getDistance([lat1, lon1], [lat2, lon2]) {
            const R = 6371; // Radius of the Earth in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
        }

        document.getElementById('startTrip').addEventListener('click', () => {
            tripActive = true;
            startTime = Date.now();
            totalDistance = 0;
            maxSpeed = 0;
            minSpeed = Infinity;
            route.setLatLngs([]);
            document.getElementById('elapsedTime').textContent = '0';
            document.getElementById('stopDuration').textContent = '0';
        });

        document.getElementById('endTrip').addEventListener('click', () => {
            tripActive = false;
            const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            document.getElementById('elapsedTime').textContent = totalTime;
        });

