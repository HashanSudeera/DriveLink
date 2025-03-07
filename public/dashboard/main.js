import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI",
    authDomain: "espclientsnew.firebaseapp.com",
    databaseURL: "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "espclientsnew",
    storageBucket: "espclientsnew.firebasestorage.app",
    messagingSenderId: "196283041268",
    appId: "1:196283041268:web:6f24e1202238bf01fea5a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);

// Export app so it can be used in other files



import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
// Retrieve stored values
let deviceId = localStorage.getItem("deviceId") || "test_device";
if (!deviceId) {
    console.error("Device ID is missing!");
} else {
    console.log("Using Device ID:", deviceId);
}
// Reference the fuel sensor data in Firebase
const userRef = ref(db, `${deviceId}/fuel_sensor`);
onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        let current_Value = parseFloat(data.value);
        console.log("Current Fuel Value:", current_Value);
        updateFuelLevel(current_Value);
    } else {
        console.warn("No data found for the given device ID.");
    }
});
function updateFuelLevel(fuel_level) {
    const water = document.getElementById("waterLevel");
    const text = document.getElementById("fuelText");
    if (water && text) {
        water.style.height = fuel_level + "%";
        text.innerText = fuel_level.toFixed(1) + "%";
    } else {
        console.error("UI elements not found: waterLevel or fuelText");
    }
}