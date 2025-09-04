<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyB7kwDSTeMNGCTwug2vZHhWmGlQkVJ9Wwc",
    authDomain: "jobtracking-94a69.firebaseapp.com",
    projectId: "jobtracking-94a69",
    storageBucket: "jobtracking-94a69.firebasestorage.app",
    messagingSenderId: "346597803292",
    appId: "1:346597803292:web:8e0f928e820656756f66d9",
    measurementId: "G-K7T0WZTNEN"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>