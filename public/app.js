document.addEventListener("DOMContentLoaded", function () {
    // Get buttons after page loads
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');

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
    const vehicleModel = document.getElementById('vehicle-model').value.trim();
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
                vehicleModel,
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
            window.location.href = "dashboard.html"; // Redirect after login
        })
        .catch((error) => {
            console.error("Login error:", error.message);
            alert("Login failed: " + error.message);
        });
}
   // Load sensor data
   function loadSensorData(deviceId) {
    const sensorRef = database.ref(deviceId);  // Reference to Firebase Realtime Database path for this device

    // Listen for data changes in real-time
    sensorRef.on("value", (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("ultrasonic-value").innerText = `Distance: ${data.ultrasonic.value} cm`;
        document.getElementById("led-status").innerText = `LED Status: ${data.led_status.value}`;
      } else {
        document.getElementById("ultrasonic-value").innerText = "No data available";
        document.getElementById("led-status").innerText = "LED Status: --";
      }
    });
  }

  // Logout function
  function logout() {
    auth.signOut().then(() => {
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('login-container').classList.remove('hidden');
    });
  }