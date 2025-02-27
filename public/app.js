// Firebase configuration
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

// Initialize Firestore
var db = firebase.firestore();

// Initialize Realtime Database
var database = firebase.database();

// Function to handle user registration
function register(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form values
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const deviceId = document.getElementById('device-id').value;
    const vehicleType = document.getElementById('vehicle-type').value;
    const vehicleModel = document.getElementById('vehicle-model').value;
    const mileage = document.getElementById('mileage').value;

    // Validate password match
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Step 1: Register the user in Firebase Authentication
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User registered successfully in Firebase Authentication
            const user = userCredential.user;
            console.log("User registered in Firebase Auth:", user.uid);

            // Step 2: Save additional user data in Firestore
            const userData = {
                username: username,
                email: email,
                deviceId: deviceId,
                vehicleType: vehicleType,
                vehicleModel: vehicleModel,
                mileage: mileage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Add a timestamp
            };

            // Save user data to Firestore
            return db.collection('users').doc(user.uid).set(userData);
        })
        .then(() => {
            console.log("User data saved to Firestore.");
            alert("Registration successful!");
            // Redirect to the login page
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during registration:", error.message);
            alert("Registration failed: " + error.message);
        });
}

// Attach the register function to the button click event
document.getElementById('register-button').addEventListener('click', register);

// Function to handle user login
function loginUser(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Authenticate the user using Firebase Authentication
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            const user = userCredential.user;
            console.log("User logged in:", user.uid);

            alert("Login succesfuly..")
        })
        .catch((error) => {
            // Handle errors
            console.error("Login error:", error.message);
            alert("Login failed: " + error.message);
        });
}



// Attach the login function to the button click event
document.getElementById('login-button').addEventListener('click', loginUser);
