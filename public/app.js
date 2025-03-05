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

// Firebase Configuration
var firebaseConfig = {
    apiKey: "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI",
    authDomain: "espclientsnew.firebaseapp.com",
    databaseURL: "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "espclientsnew",
    storageBucket: "espclientsnew.firebasestorage.app",
    messagingSenderId: "196283041268",
    appId: "1:196283041268:web:6f24e1202238bf01fea5a1"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore and Realtime Database
var db = firebase.firestore();
var database = firebase.database();



// 🛠 Function to Register User
function register(event) {
    event.preventDefault();

    // Get user inputs
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const deviceId = document.getElementById('device-id').value.trim();
    const vehicleType = document.getElementById('vehicle-type').value.trim();
    const mileage = document.getElementById('mileage').value.trim();

    // Basic validation
    if (!username || !email || !password || !confirmPassword || !deviceId) {
        alert("Please fill in all required fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Firebase Authentication - Register User
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User registered:", user.uid);

            // User data to store in Firestore
            const userData = {
                username,
                email,
                deviceId,
                vehicleType,
                mileage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save user data in Firestore
            return db.collection('users').doc(user.uid).set(userData);
        })
        .then(() => {
            console.log("User data saved to Firestore.");
            alert("Registration successful! Redirecting to login...");
            window.location.href = "login.html"; // Redirect to login page
        })
        .catch((error) => {
            console.error("Registration error:", error.message);
            alert("Registration failed: " + error.message);
        });
}

// 🛠 Function to Login User
function loginUser(event) {
    event.preventDefault();

    // Get user inputs
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validation
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    // Firebase Authentication - Sign In User
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User logged in:", user.uid);
            alert("Login successful! Redirecting...");
            window.location.href = "dashboard/dashboard.html"; // Redirect after login
        })
        .catch((error) => {
            console.error("Login error:", error.message);
            alert("Login failed: " + error.message);
        });
}
let min_value = null;
let max_value = null;


document.addEventListener("DOMContentLoaded", async function () {
    if (document.body.id === "dashboardPage") {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userId = user.uid;
                    const db = firebase.firestore();

                    // Fetch user data from Firestore
                    const userRef = db.collection("users").doc(userId);
                    const userSnap = await userRef.get();

                    if (!userSnap.exists) {
                        console.error("User data not found in Firestore.");
                        return;
                    }

                    const userData = userSnap.data();
                    const deviceId = userData.deviceId;
                    const username = userData.username;
                    const vehicleType = userData.vehicleType; // Get vehicleType

                    // Update UI
                    document.getElementById("device-id").innerText = deviceId;
                    document.getElementById("usernametag").innerText = `Hi, ${username} !`;

                    // Fetch vehicle data using vehicleType
                    const vehicleRef = db.collection("vehicle").doc(vehicleType);
                    const vehicleSnap = await vehicleRef.get();

                    if (vehicleSnap.exists) {
                        const vehicleData = vehicleSnap.data();
                        min_value = vehicleData.minLevel;
                        max_value = vehicleData.maxLevel;
                        console.log("Vehicle Data:", vehicleData);

                        document.getElementById("min-id").innerText = min_value;
                        document.getElementById("max-id").innerText = max_value;
                    } else {
                        console.log("No vehicle data found.");
                    }

                    // Call additional functions
                    loadSensorData(deviceId);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            } else {
                // Redirect if user is not logged in
                window.location.href = "../login.html";
            }
        });
    }
});

function loadSensorData(deviceId) {
    const sensorRef = firebase.database().ref(deviceId);
    sensorRef.on("value", (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById("ultrasonic-value").innerText = `Distance: ${data.ultrasonic.value} cm`;
            document.getElementById("led-status").innerText = `LED Status: ${data.led_status.value}`;

            // Declare current_level correctly
            let current_level = data.fuel_sensor.value;

            // Use the correct variable names min_value & max_value
            setTimeout(() => updateFuelLevel(min_value, max_value, current_level), 1000);
        } else {
            document.getElementById("ultrasonic-value").innerText = "No data available";
            document.getElementById("led-status").innerText = "LED Status: --";
        }
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../login.html";

    }).catch((error) => {
        console.error("Logout error:", error);
    });
}
// 🔹 Function to Sign in with Google
function signInWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;

            // Check if user already exists in Firestore
            return db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (!doc.exists) {
                        return db.collection('users').doc(user.uid).set({
                            username,
                            email: user.email,
                            deviceId,
                            vehicleType,
                            mileage,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
        })
        .then(() => {
            alert("Google Sign-In successful! Redirecting...");
            window.location.href = "dashboard/dashboard.html";
        })
        .catch((error) => {
            alert("Google Sign-In failed: " + error.message);
        });
}

// Google Sign-In function
function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("Google Sign-In successful:", user);

            // Check if user exists in Firestore
            const userRef = db.collection('users').doc(user.uid);
            return userRef.get().then((doc) => {
                if (!doc.exists) {
                    // If user doesn't exist, store data
                    const userData = {
                        username: user.displayName || "Google User",
                        email: user.email,
                        deviceId: "N/A",
                        vehicleType: "N/A",
                        mileage: "N/A",
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    return userRef.set(userData);
                }
            });
        })
        .then(() => {
            alert("Login successful! Redirecting...");
            window.location.href = "dashboard/dashboard.html";
        })
        .catch((error) => {
            console.error("Google Sign-In failed:", error.message);
            alert("Google Sign-In failed: " + error.message);
        });
}

// Add event listener for Google Login button
document.addEventListener("DOMContentLoaded", function () {
    const googleLoginButton = document.getElementById("google-login-button");
    if (googleLoginButton) {
        googleLoginButton.addEventListener("click", googleSignIn);
    }
});
// Google Sign-In
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("Google login success:", user.uid);

            // Check if user exists in Firestore
            const userRef = db.collection("users").doc(user.uid);
            userRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("User exists, redirecting to dashboard...");
                    window.location.href = "dashboard/dashboard.html";
                } else {
                    console.log("New user, redirecting to complete profile...");
                    window.location.href = "google.html";
                }
            });
        })
        .catch((error) => {
            console.error("Google Login Error:", error.message);
            alert("Google Login Failed: " + error.message);
        });
}
function completeGoogleRegistration(event) {
    event.preventDefault();

    const user = firebase.auth().currentUser;
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
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save user data in Firestore
    db.collection("users").doc(user.uid).set(userData)
        .then(() => {
            console.log("User data saved to Firestore.");
            alert("Registration completed! Redirecting to dashboard...");
            window.location.href = "dashboard/dashboard.html";
        })
        .catch((error) => {
            console.error("Error saving user data:", error);
            alert("Error: " + error.message);
        });
}
document.addEventListener("DOMContentLoaded", function () {
    const googleLoginButton = document.getElementById("google-login-button");

    if (googleLoginButton) {
        googleLoginButton.addEventListener("click", signInWithGoogle);
    }
});
// Google Sign-In function
function googlein() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("Google login success:", user.uid);

            // Check if Firestore is properly initialized before accessing db
            if (db) {
                const userRef = db.collection("users").doc(user.uid);
                userRef.get().then((doc) => {
                    if (doc.exists) {
                        console.log("User exists, redirecting to dashboard...");
                        window.location.href = "dashboard/dashboard.html";
                    } else {
                        console.log("New user, redirecting to complete profile...");
                        window.location.href = "google.html";
                    }
                }).catch((error) => {
                    console.error("Error getting user data from Firestore:", error);
                });
            } else {
                console.error("Firestore not initialized!");
            }
        })
        .catch((error) => {
            console.error("Google Login Error:", error.message);
            alert("Google Login Failed: " + error.message);
        });
}






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



