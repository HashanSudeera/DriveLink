document.addEventListener("DOMContentLoaded", function () {
    // Get buttons after page loads
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');
    const logoutbutton = document.getElementById('logout-button')
    const googleLoginButton = document.getElementById('google-login-button');
    const completeRegButton = document.getElementById('complete-registration-button');
    const googlesiginButton = document.getElementById('google-singin-button');

    if (registerButton) {
        registerButton.addEventListener('click', register);
    } else {
        console.error("Register button not found! Check if the ID is correct.");
    }

    if (loginButton) {
        loginButton.addEventListener('click', loginUser);
    } else {
        console.error("Login button not found! Check if the ID is correct.");
    }
    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', googleLogin);
    }
    if (googlesiginButton) {
        googlesiginButton.addEventListener('click', googlein);
    }
    if (completeRegButton) {
        completeRegButton.addEventListener('click', completeGoogleRegistration);
    }
    if (logoutbutton) {
        logoutbutton.addEventListener('click', logout);
    }
    else {
        console.error("Logout button not found! Check if the ID is correct.");
    }

});
// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase Configuration
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
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

// Register User
async function register(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const deviceId = document.getElementById('device-id').value.trim();
    const vehicleType = document.getElementById('vehicle-type').value.trim();
    const mileage = document.getElementById('mileage').value.trim();

    if (!username || !email || !password || !confirmPassword || !deviceId) {
        alert("Please fill in all required fields.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData = { username, email, deviceId, vehicleType, mileage, timestamp: new Date() };
        await setDoc(doc(db, "users", user.uid), userData);

        alert("Registration successful! Redirecting to login...");
        window.location.href = "login.html";
    } catch (error) {
        alert("Registration failed: " + error.message);
    }
}

// Login User
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful! Redirecting...");
        window.location.href = "dashboard/dashboard.html";
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}

// Dashboard Authentication
document.addEventListener("DOMContentLoaded", async function () {
    if (document.body.id === "dashboardPage") {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userId = user.uid;
                    const userSnap = await getDoc(doc(db, "users", userId));

                    if (!userSnap.exists()) {
                        console.error("User data not found.");
                        return;
                    }

                    const userData = userSnap.data();
                    const deviceId = userData.deviceId;
                    const username = userData.username;
                    const vehicleType = userData.vehicleType;

                    document.getElementById("device-id").innerText = deviceId;
                    document.getElementById("usernametag").innerText = `Hi, ${username} !`;

                    const vehicleSnap = await getDoc(doc(db, "vehicle", vehicleType));
                    if (vehicleSnap.exists()) {
                        const vehicleData = vehicleSnap.data();
                        localStorage.setItem("min_value", vehicleData.minLevel);
                        localStorage.setItem("max_value", vehicleData.maxLevel);
                        document.getElementById("min-id").innerText = vehicleData.minLevel;
                        document.getElementById("max-id").innerText = vehicleData.maxLevel;
                    }

                    loadSensorData(deviceId);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            } else {
                window.location.href = "../login.html";
            }
        });
    }
});

// Load Sensor Data
function loadSensorData(deviceId) {
    const sensorRef = ref(database, deviceId);
    onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById("ultrasonic-value").innerText = `Distance: ${data.ultrasonic.value} cm`;
            document.getElementById("led-status").innerText = `LED Status: ${data.led_status.value}`;

            localStorage.setItem("fuel_level", data.fuel_sensor.value);
            localStorage.setItem("battery_level", data.battery.value);

            setTimeout(() => updateFuelLevel(data.fuel_sensor.value), 500);
            setTimeout(() => updateBattery(data.battery.value), 500);
        } else {
            document.getElementById("ultrasonic-value").innerText = "No data available";
            document.getElementById("led-status").innerText = "LED Status: --";
        }
    });
}

// Logout
async function logout() {
    try {
        await signOut(auth);
        window.location.href = "../login.html";
    } catch (error) {
        console.error("Logout error:", error);
    }
}

/// Function to Sign in with Google
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Collect additional details
            const username = prompt("Enter a username:");
            const deviceId = prompt("Enter your device ID:");
            const vehicleType = prompt("Enter your vehicle type (motorcycle, van, car, lorry):");
            const mileage = prompt("Enter your vehicle mileage:");

            // Save user data
            await setDoc(userRef, {
                username,
                email: user.email,
                deviceId,
                vehicleType,
                mileage,
                timestamp: serverTimestamp()
            });
        }
        alert("Google Sign-In successful! Redirecting...");
        window.location.href = "dashboard/dashboard.html";
    } catch (error) {
        alert("Google Sign-In failed: " + error.message);
    }
}

// Function to complete Google Registration
async function completeGoogleRegistration(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        alert("User not logged in!");
        return;
    }

    const username = document.getElementById('username').value.trim();
    const deviceId = document.getElementById('device-id').value.trim();
    const vehicleType = document.getElementById('vehicle-type').value.trim();
    const mileage = document.getElementById('mileage').value.trim();

    if (!username || !deviceId) {
        alert("Please fill in all required fields.");
        return;
    }

    const userData = {
        username,
        email: user.email,
        deviceId,
        vehicleType,
        mileage,
        timestamp: serverTimestamp()
    };

    try {
        await setDoc(doc(db, "users", user.uid), userData);
        alert("Registration completed! Redirecting to dashboard...");
        window.location.href = "dashboard/dashboard.html";
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Event listener for Google Login button
document.addEventListener("DOMContentLoaded", () => {
    const googleLoginButton = document.getElementById("google-login-button");
    if (googleLoginButton) {
        googleLoginButton.addEventListener("click", signInWithGoogle);
    }
});




// fuel moniter sections

function updateFuelLevel(min_level, max_level, current_level) {
    // Prevent division by zero
    if (max_level === min_level) {
        console.error("Max level and min level are the same. Cannot calculate fuel level.");
        return;
    }

    // Calculate fuel level percentage
    let fuel_level = ((current_level - min_level) / (max_level - min_level)) * 100;

    // Ensure the fuel level stays between 0% and 100%
    fuel_level = Math.max(0, Math.min(100, fuel_level));

    // Update UI elements
    const water = document.getElementById("waterLevel");
    const text = document.getElementById("fuelText");

    if (water && text) {
        water.style.height = fuel_level + "%";
        text.innerText = fuel_level.toFixed(1) + "%"; // Show 1 decimal place
    } else {
        console.error("UI elements not found: waterLevel or fuelText");
    }
}



//battery sensor data

/* const charge = document.querySelector(".charge");
const batteryPercentage = document.getElementById("battery-percentage");

function updateBattery(level) {
    console.log("update")

    cal_level = (level / 12) * 100;
    console.log(cal_level);
    charge.style.height = cal_level + "%";

    if (cal_level <= 25) {
        charge.style.background = "var(--red)";
    } else if (cal_level <= 50) {
        charge.style.background = "var(--orange)";
    } else if (cal_level <= 75) {
        charge.style.background = "var(--yellow)";
    } else if (cal_level <= 100) {
        charge.style.background = "var(--green)";
    }

    batteryPercentage.innerText = `Battery: ${cal_level}%`;
} */




function updateBattery(level) {
    const charge = document.querySelector(".charge");
    const batteryPercentage = document.getElementById("battery-percentage");
    console.log("Updating battery level...");

    // Ensure elements exist
    if (!charge || !batteryPercentage) {
        console.error("Error: Battery elements not found in the DOM!");
        return;
    }

    // Ensure level is valid
    if (level === undefined || level === null) {
        console.error("Error: Battery level is undefined or null.");
        return;
    }

    // Calculate battery level
    let cal_level = (level / 12) * 100;
    cal_level = Math.max(0, Math.min(cal_level, 100)); // Ensure value is between 0-100

    console.log("Calculated Battery Level:", cal_level);

    // Update battery UI
    charge.style.height = cal_level + "%";

    if (cal_level <= 25) {
        charge.style.background = "var(--red)";
    } else if (cal_level <= 50) {
        charge.style.background = "var(--orange)";
    } else if (cal_level <= 75) {
        charge.style.background = "var(--yellow)";
    } else {
        charge.style.background = "var(--green)";
    }

    batteryPercentage.innerText = `Battery: ${Math.round(cal_level)}%`;
}



