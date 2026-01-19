const firebaseConfig = {
  apiKey: "AIzaSyA0oSa7eucY_12j4xemIVEMk_kRGVS3CXo",
  authDomain: "gracious-line.firebaseapp.com",
  databaseURL: "https://gracious-line-default-rtdb.firebaseio.com",
  projectId: "gracious-line",
  storageBucket: "gracious-line.firebasestorage.app",
  messagingSenderId: "417727395652",
  appId: "1:417727395652:web:ab7766fa3233c6e4708911"
};
firebase.initializeApp(firebaseConfig);

function loginUser(event) {
  event.preventDefault();
  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      console.log("Login successful:", user);
      // Show success message using SweetAlert
      Swal.fire({
        title: "Login Successful",
        text: "Click OK to continue...",
        icon: "success",
        showConfirmButton: true, // Show OK button
        allowOutsideClick: false // Prevent dismissing modal by clicking outside
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to home.html after clicking OK
          window.location.href = "home.html";
        }
      }); 
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error("Login error:", errorMessage);
      // Show error message using SweetAlert
      Swal.fire({
        title: "Login Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK"
      });
    });
}

// Check if user is already logged in or not on page load
document.addEventListener("DOMContentLoaded", function() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, redirect to home.html
      window.location = 'home.html';
    } else {
      // No user is signed in, stay on index.html for login or registration
      // Optionally, you can add logic here if you need to show or hide elements based on login status
    }
  });
});
document.getElementById('login').addEventListener('click', GoogleLogin)
let provider = new firebase.auth.GoogleAuthProvider()

      function GoogleLogin(){
        console.log('Login Btn Call')
        firebase.auth().signInWithPopup(provider).then(res=>{
          console.log(res.user)
          document.getElementById('LoginScreen').style.display="none"
          document.getElementById('dashboard').style.display="block"
          showUserDetails(res.user)
        }).catch(e=>{
          console.log(e)
        })
      }


// document.getElementById("loginForm").addEventListener("submit", function(e) {
//   e.preventDefault();
//   var email = document.getElementById("loginEmail").value;
//   var password = document.getElementById("loginPassword").value;
//   loginUser(email, password);
// });