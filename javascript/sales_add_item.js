document.getElementById("salesForm").addEventListener("submit", function (e) {
  e.preventDefault(); // prevent reload

  const productName = document.getElementById("productName").value;
  const productImei = document.getElementById("productImei").value;
  const productImei2 = document.getElementById("productImei2").value;
  const productCapital = document.getElementById("productCapital").value;
  const saleDateInput = document.getElementById("saleDate").value;

  // kung may piniling date → gamitin
  // kung wala → server timestamp
  const createdAt = saleDateInput
    ? new Date(saleDateInput).getTime()
    : firebase.database.ServerValue.TIMESTAMP;

  const salesRef = firebase.database().ref("sales").push();

  salesRef.set({
    productName: productName,
    productImei: productImei,
    productImei2: productImei2,
    productCapital: Number(productCapital),

    // ✅ DEFAULT VALUES
    status: "Available",
    expenses: 0,
    profit: 0,
    sellingPrice: 0,
    dateSold: "n/a",
    datePurchase: createdAt,
    productBuyerName: ""
  })
  .then(() => {
    alert("Saved successfully!");
    document.getElementById("salesForm").reset();
    // bumalik sa previous page
    window.history.back();
  })
  .catch((error) => {
    alert("Error: " + error.message);
  });
});
/**********************************
 * GLOBAL VARIABLES
 **********************************/
let totalBusinessCapital = 0;

/**********************************
 * LOAD BUSINESS CAPITAL FROM FIREBASE
 **********************************/
function loadBusinessCapital() {
  firebase.database().ref("business").once("value")
    .then(snapshot => {
      let total = 0;
      snapshot.forEach(child => {
        total += Number(child.val().amount) || 0;
      });
      totalBusinessCapital = total;

      document.getElementById("businessCapital").value =
        totalBusinessCapital.toLocaleString();
    })
    .catch(err => console.error("Firebase load error:", err));
}

// Load on page load
loadBusinessCapital();

/**********************************
 * REAL-TIME CAPITAL CHECKER
 **********************************/
document.getElementById("productCapital").addEventListener("input", function () {
  const productCapital = Number(this.value) || 0;
  const warning = document.getElementById("capitalWarning");

  if (productCapital <= 0) {
    warning.classList.add("d-none");
    warning.innerText = "";
    return;
  }

  if (totalBusinessCapital === 0) {
    warning.classList.remove("d-none");
    warning.classList.add("text-danger");
    warning.innerText = "Loading business capital...";
    return;
  }

  if (productCapital > totalBusinessCapital) {
    const shortBy = productCapital - totalBusinessCapital;
    warning.classList.remove("d-none");
    warning.classList.remove("text-success");
    warning.classList.add("text-danger");
    warning.innerText = `❌ Cannot cover. Short by ${shortBy.toLocaleString()}`;
  } else {
    const remaining = totalBusinessCapital - productCapital;
    warning.classList.remove("d-none");
    warning.classList.remove("text-danger");
    warning.classList.add("text-success");
    warning.innerText = `✅ Can be covered. Remaining: ${remaining.toLocaleString()}`;
  }
});

/**********************************
 * SALES FORM SUBMIT
 **********************************/
document.getElementById("salesForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const productName = document.getElementById("productName").value.trim() || "Unnamed Product";
  const productImei = document.getElementById("productImei").value;
  const productImei2 = document.getElementById("productImei2").value;
  const productCapital = Number(document.getElementById("productCapital").value) || 0;
  const saleDateInput = document.getElementById("saleDate").value;

  if (productCapital <= 0) {
    alert("Enter a valid product capital");
    return;
  }

  const createdAt = saleDateInput
    ? new Date(saleDateInput).getTime()
    : firebase.database.ServerValue.TIMESTAMP;

  const salesRef = firebase.database().ref("sales").push();
  const saleKey = salesRef.key;

  // Determine if business can cover
  let fromBusiness = false;

  if (productCapital <= totalBusinessCapital) {
    fromBusiness = true;
    const newKey = firebase.database().ref("business").push().key;

    const capitalRecord = {
      amount: -Math.abs(productCapital), // negative
      dateSold: Date.now(),
      description: `Capital for ${productName}`,
      profit: 0,
      saleId: saleKey,
      updatedAt: Date.now()
    };

    // Save deduction sa business
    firebase.database().ref("business/" + newKey).set(capitalRecord)
      .then(() => {
        // refresh total
        loadBusinessCapital();
      })
      .catch(err => console.error("Firebase business save error:", err));
  }

  // Save sale record
  salesRef.set({
    productName: productName,
    productImei: productImei,
    productImei2: productImei2,
    productCapital: productCapital,
    dateSold: "n/a",
    datePurchase: createdAt,
    status: "Available",
    expenses: 0,
    profit: 0,
    sellingPrice: 0,
    productBuyerName: "",
    fromBusiness: fromBusiness // 🔹 new attribute
  })
  .then(() => {
    alert("Saved successfully!");
    document.getElementById("salesForm").reset();
    document.getElementById("capitalWarning").classList.add("d-none");

    // bumalik sa previous page
    window.history.back();
  })
  .catch(err => console.error("Firebase sales save error:", err));
});

// /**********************************
//  * GLOBAL VARIABLES
//  **********************************/
// let totalBusinessCapital = 0;

// /**********************************
//  * LOAD BUSINESS CAPITAL FROM FIREBASE
//  **********************************/
// function loadBusinessCapital() {
//   firebase.database().ref("business").once("value")
//     .then(snapshot => {
//       let total = 0;
//       snapshot.forEach(child => {
//         total += Number(child.val().amount) || 0;
//       });
//       totalBusinessCapital = total;

//       // ALWAYS show TOTAL business capital
//       document.getElementById("businessCapital").value =
//         totalBusinessCapital.toLocaleString();
//     })
//     .catch(err => console.error("Firebase load error:", err));
// }

// // Load on page load
// loadBusinessCapital();

// /**********************************
//  * REAL-TIME CHECKER (INPUT EVENT)
//  **********************************/
// document.getElementById("productCapital").addEventListener("input", function () {
//   const productCapital = Number(this.value) || 0;
//   const warning = document.getElementById("capitalWarning");

//   if (productCapital <= 0) {
//     warning.classList.add("d-none");
//     warning.innerText = "";
//     return;
//   }

//   // ensure total business capital is loaded
//   if (totalBusinessCapital === 0) {
//     warning.classList.remove("d-none");
//     warning.classList.add("text-danger");
//     warning.innerText = "Loading business capital...";
//     return;
//   }

//   if (productCapital > totalBusinessCapital) {
//     const shortBy = productCapital - totalBusinessCapital;
//     warning.classList.remove("d-none");
//     warning.classList.remove("text-success");
//     warning.classList.add("text-danger");
//     warning.innerText = `❌ Cannot cover. Short by ${shortBy.toLocaleString()}`;
//   } else {
//     const remaining = totalBusinessCapital - productCapital;
//     warning.classList.remove("d-none");
//     warning.classList.remove("text-danger");
//     warning.classList.add("text-success");
//     warning.innerText = `✅ Can be covered. Remaining: ${remaining.toLocaleString()}`;
//   }
// });

// /**********************************
//  * SAVE ON FORM SUBMIT
//  **********************************/
// document.getElementById("salesForm").addEventListener("submit", function (e) {
//   e.preventDefault(); // prevent default submit

//   const productName = document.getElementById("productName").value.trim() || "Unnamed Product";
//   const productCapital = Number(document.getElementById("productCapital").value) || 0;

//   if (productCapital <= 0) {
//     alert("Enter a valid product capital");
//     return;
//   }

//   if (productCapital > totalBusinessCapital) {
//     alert("Not enough business capital");
//     return;
//   }

//   const now = Date.now();
//   const newKey = firebase.database().ref("business").push().key;

//   const capitalRecord = {
//     amount: -Math.abs(productCapital), // negative
//     dateSold: now,
//     description: `Capital for ${productName}`,
//     profit: 0,
//     saleId: newKey,
//     updatedAt: now
//   };

//   firebase.database().ref("business/" + newKey)
//     .set(capitalRecord)
//     .then(() => {
//       alert("Capital saved successfully");
//       loadBusinessCapital(); // refresh total
//        // bumalik sa previous page
//       window.history.back();
//       document.getElementById("productForm").reset();
//       document.getElementById("capitalWarning").classList.add("d-none");
//     })
//     .catch(err => console.error("Firebase save error:", err));
// });
