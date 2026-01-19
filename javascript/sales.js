/************************************
 * FIREBASE REFERENCE
 ************************************/
const salesRef = firebase.database().ref("sales");

/************************************
 * GLOBAL REFERENCES
 ************************************/
const tableBody = document.getElementById("salesTableBody");
const monthFilter = document.getElementById("monthFilter");

const tableSection = document.getElementById("tableSection");
const editSection = document.getElementById("editSection");

let allSalesData = [];
let selectedSaleId = null;

/************************************
 * CURRENT MONTH-YEAR
 ************************************/
const now = new Date();
const currentMonthYear = now.toLocaleString("en-US", {
  month: "long",
  year: "numeric"
});

/************************************
 * UTILITIES
 ************************************/
function formatDate(timestamp) {
  if (!timestamp || timestamp === "n/a") return "—";

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  const month = date.getMonth() + 1;   // 1–12
  const day = date.getDate();          // 1–31
  const year = date.getFullYear().toString().slice(-2); // last 2 digits

  return `${month}/${day}/${year}`;
}

function formatNumber(value) {
  if (value === undefined || value === null || value === "") return "0";
  return Number(value).toLocaleString();
}

/************************************
 * POPULATE MONTH DROPDOWN
 ************************************/
function populateMonthDropdown(months) {
  monthFilter.innerHTML = `<option value="all">All Months</option>`;

  months.sort((a, b) => new Date(b) - new Date(a));

  months.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}
// function showTableLoading() {
//   const text = "Gracious Line";

//   // split text into spans
//   const letters = text.split("").map((char, i) => {
//     if (char === " ") return `<span style="display:inline-block;width:6px;"></span>`; // space
//     return `<span class="wavy-letter" style="animation-delay:${i * 0.1}s">${char}</span>`;
//   }).join("");

//   tableBody.innerHTML = `
//     <tr id="table-loading">
//       <td colspan="12" style="height:350px; background:#f5f5f5;">
//         <div style="
//           display:flex;
//           align-items:center;
//           justify-content:center;
//           height:100%;
//         ">
//           <div style="
//             background:#ffffff;
//             padding:30px 40px;
//             border-radius:12px;
//             box-shadow:0 10px 25px rgba(0,0,0,0.15);
//             text-align:center;
//           ">
//             <img src="assets/logo.png"
//                  alt="Loading..."
//                  class="table-loading-spin"
//                  style="width:90px;height:90px;">

//             <div class="wavy-text" style="margin-top:20px; font-weight:bold; font-size:22px; color:#007bff;">
//               ${letters}
//             </div>
//           </div>
//         </div>
//       </td>
//     </tr>
//   `;
// }


// function hideTableLoading() {
//   const loadingRow = document.getElementById("table-loading");
//   if (loadingRow) loadingRow.remove();
// }
function showLoader() {
  document.getElementById("table-loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("table-loader").style.display = "none";
}
/************************************
 * RENDER TABLE
 ************************************/
function renderTable(dataList) {
  // 👉 show loading first
  // showLoader();

  setTimeout(() => {  
  tableBody.innerHTML = "";

  if (!dataList || dataList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">No records found</td>
      </tr>
    `;
    // hideLoader();
    return;
  }
  dataList.sort((a, b) => {
  const isAvailableA = a.status === "AVAILABLE" || a.sellingPrice === 0 || !a.sellingPrice;
  const isAvailableB = b.status === "AVAILABLE" || b.sellingPrice === 0 || !b.sellingPrice;

    // 🔹 Una ay AVAILABLE
    if (isAvailableA && !isAvailableB) return -1;
    if (!isAvailableA && isAvailableB) return 1;

    // 🔹 Pareho ng availability → sort by date descending
    const dateA = a.datePurchase ? new Date(a.datePurchase).getTime() : 0;
    const dateB = b.datePurchase ? new Date(b.datePurchase).getTime() : 0;
    return dateB - dateA;
  });
  // 🔹 TOTAL ACCUMULATORS
  let totalExpenses = 0;
  let totalProfit = 0;
  dataList.forEach(item => {
    const profit = Number(item.profit) || 0;
    const expenses = Number(item.expenses) || 0;

    totalExpenses += expenses;
    totalProfit += profit;
    // 🔹 PERCENTAGE LOGIC
    const businessPercent = profit >= 700 ? 0.5 : 0.3;
    const johndelPercent = profit >= 700 ? 0.2 : 0.3;
    const geremiePercent = profit >= 700 ? 0.2 : 0.3;
    const clickyPercent = profit >= 700 ? 0.1 : 0.1;

    // 🔹 COMPUTED VALUES
    const business = profit * businessPercent;
    const johndel = profit * johndelPercent;
    const geremie = profit * geremiePercent;
    const clicky = profit * clickyPercent;

    // 🔹 BUTTON LOGIC
    const isSold = item.status === "SOLD" || item.sellingPrice > 0;

    const actionButton = isSold
      ? `<button class="btn btn-secondary btn-sm " disabled style="font-size:11px">SOLD</button>`
      : `<button class="btn btn-success btn-sm " style="font-size:11px" onclick="openSellModal('${item.id}')">
          AVAIL
        </button>`;

    const row = `
      <tr data-id="${item.id}">
        <td>${formatDate(item.datePurchase)}</td>
        <td class="narrow">${item.productName}</td>
        <td class="narrow">${formatNumber(item.productCapital)}</td>
        <td class="narrow">${formatNumber(item.sellingPrice)}</td>
        <td class="narrow">${formatNumber(item.expenses)}</td>
        <td class="narrow">${formatNumber(profit)}</td>
        <td class="narrow">${item.dateSold === "n/a" ? "—" : formatDate(item.dateSold)}</td>
        <td class="narrow">${formatNumber(business)}</td>
        <td class="narrow">${formatNumber(johndel)}</td>
        <td class="narrow">${formatNumber(geremie)}</td>
        <td class="narrow">${formatNumber(clicky)}</td>
        <td>${actionButton}</td>
      </tr>
    `;

    tableBody.insertAdjacentHTML("beforeend", row);
  });
  // 🔹 SUMMARY ROWS
  const netTotal = totalProfit - totalExpenses;

  const summaryRows = `
    <!-- TOTAL EXPENSES -->
    <tr class="fw-bold bg-light">
      <td colspan="4" class="text-end">TOTAL EXPENSES</td>
      <td class="narrow">${formatNumber(totalExpenses)}</td>
      <td colspan="7"></td>
    </tr>

    <!-- TOTAL PROFIT -->
    <tr class="fw-bold bg-light">
      <td colspan="5" class="text-end">TOTAL PROFIT</td>
      <td class="narrow">${formatNumber(totalProfit)}</td>
      <td colspan="6"></td>
    </tr>

    <!-- NET TOTAL -->
    <tr class="fw-bold ${netTotal < 0 ? "bg-danger text-white" : "bg-success text-white"}">
      <td colspan="5" class="text-end">NET TOTAL</td>
      <td class="narrow">${formatNumber(netTotal)}</td>
      <td colspan="6"></td>
    </tr>
  `;


  tableBody.insertAdjacentHTML("beforeend", summaryRows);
  attachContextMenu();
  // hideLoader();
  }, 3000);
}
function confirmSell() {
  const id = document.getElementById("sellSaleId").value;
  const sellingPrice = Number(document.getElementById("sellSellingPrice").value);
  const expenses = Number(document.getElementById("sellExpenses").value);
  const buyer = document.getElementById("sellBuyer").value;
  const soldDate = new Date(document.getElementById("sellDate").value).getTime();

  if (!sellingPrice || sellingPrice <= 0) {
    alert("Selling price is required");
    return;
  }

  firebase.database().ref("sales/" + id).once("value")
    .then(snapshot => {
      const data = snapshot.val();
      if (!data) throw "Sale not found";

      const capital = Number(data.productCapital) || 0;
      const profit = sellingPrice - capital - expenses;

      const updates = {};

      // 🔹 SALES (FIELD-LEVEL UPDATE — SAFE)
      updates[`sales/${id}/sellingPrice`] = sellingPrice;
      updates[`sales/${id}/expenses`] = expenses;
      updates[`sales/${id}/productBuyerName`] = buyer;
      updates[`sales/${id}/profit`] = profit;
      updates[`sales/${id}/status`] = "Sold";
      updates[`sales/${id}/dateSold`] = soldDate;

      // 🔹 BUSINESS (UPSERT)
      updates[`business/${id}/saleId`] = id;
      updates[`business/${id}/amount`] = profit >= 700 ? profit * 0.5 : profit * 0.3;
      updates[`business/${id}/profit`] = profit;
      updates[`business/${id}/dateSold`] = soldDate;
      updates[`business/${id}/description`] =
  `Profit for ${document.getElementById("sellProductName").value} sold to ${buyer}`;
      updates[`business/${id}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

      return firebase.database().ref().update(updates);
    })
    .then(() => {
      bootstrap.Modal
        .getInstance(document.getElementById("sellModal"))
        .hide();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to mark as sold");
    });
}


function openSellModal(id) {
  const modal = new bootstrap.Modal(document.getElementById("sellModal"));
  const sale = allSalesData.find(s => s.id === id);
  if (!sale) return;

  // set hidden sale id
  document.getElementById("sellSaleId").value = id;

  // prefill modal fields
  document.getElementById("sellSellingPrice").value = sale.sellingPrice || "";
  document.getElementById("sellExpenses").value = sale.expenses || "";
  document.getElementById("sellDate").value = sale.dateSold && sale.dateSold !== "n/a"
    ? new Date(sale.dateSold).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  document.getElementById("sellBuyer").value = sale.productBuyerName || "";

  // 🔹 store product name in hidden field inside modal
  document.getElementById("sellProductName").value = sale.productName || "";

  modal.show();
}


/************************************
 * ATTACH RIGHT CLICK / LONG PRESS
 ************************************/
function attachContextMenu() {
  document.querySelectorAll("#salesTableBody tr").forEach(row => {

    // PC
    row.addEventListener("contextmenu", e => {
      e.preventDefault();
      selectedSaleId = row.dataset.id;
      showContextMenu(e.pageX, e.pageY);
    });

    // Mobile
    let pressTimer;
    row.addEventListener("touchstart", e => {
      pressTimer = setTimeout(() => {
        selectedSaleId = row.dataset.id;
        showContextMenu(e.touches[0].pageX, e.touches[0].pageY);
      }, 600);
    });

    row.addEventListener("touchend", () => clearTimeout(pressTimer));
  });
}

/************************************
 * CONTEXT MENU
 ************************************/
function showContextMenu(x, y) {
  const menu = document.getElementById("contextMenu");
  menu.style.display = "block";

  const w = menu.offsetWidth;
  const h = menu.offsetHeight;

  menu.style.left = (x - w / 2) + "px";
  menu.style.top = (y - h / 2) + "px";
}

document.addEventListener("click", () => {
  document.getElementById("contextMenu").style.display = "none";
});

/************************************
 * EDIT SALE (SHOW FORM & POPULATE)
 ************************************/
function editSale() {
  if (!selectedSaleId) return;

  document.getElementById("contextMenu").style.display = "none";
  tableSection.style.display = "none"; // hide table
  editSection.style.display = "block"; // show edit form

  firebase.database()
    .ref("sales/" + selectedSaleId)
    .once("value")
    .then(snapshot => {
      const data = snapshot.val();

      // Populate original values
      document.getElementById("editSaleId").value = selectedSaleId;
      document.getElementById("saleDate").value = data.datePurchase ? new Date(data.datePurchase).toISOString().split("T")[0] : "";
      document.getElementById("soldDate").value = data.dateSold && data.dateSold !== "n/a" ? new Date(data.dateSold).toISOString().split("T")[0] : "";
      document.getElementById("editProductName").value = data.productName || "";
      document.getElementById("productBuyerName").value = data.productBuyerName || "";
      document.getElementById("editCapital").value = data.productCapital || 0;
      document.getElementById("editSellingPrice").value = data.sellingPrice || 0;
      document.getElementById("editExpenses").value = data.expenses || 0;
      document.getElementById("productImei").value = data.productImei || "";
      document.getElementById("productImei2").value = data.productImei2 || "";

      // Calculate derived fields
      calculateDerivedFields();
    });
}

/************************************
 * CALCULATE DERIVED FIELDS
 ************************************/
function calculateDerivedFields() {
  const capital = Number(document.getElementById("editCapital").value) || 0;
  const sellingPrice = Number(document.getElementById("editSellingPrice").value) || 0;
  const expenses = Number(document.getElementById("editExpenses").value) || 0;

  const profit = sellingPrice > 0 ? sellingPrice - capital - expenses : 0;

  document.getElementById("profit").value = profit;
  // 🔹 Percentage logic
  let businessPercent, johndelPercent, geremiePercent, clickyPercent;

  if (profit >= 700) {
    businessPercent = 0.5;
    johndelPercent = 0.2;
    geremiePercent = 0.2;
    clickyPercent = 0.1;
  } else {
    businessPercent = 0.3;
    johndelPercent = 0.3;
    geremiePercent = 0.3;
    clickyPercent = 0.1; // clicky remains 10%
  }

  document.getElementById("business").value = (profit * businessPercent).toFixed(2);
  document.getElementById("johndel").value = (profit * johndelPercent).toFixed(2);
  document.getElementById("geremie").value = (profit * geremiePercent).toFixed(2);
  document.getElementById("clicky").value = (profit * clickyPercent).toFixed(2);

  // Availability logic
  const status = sellingPrice > 0 ? "Sold" : "Available";
  document.getElementById("editStatus").value = status; // optional hidden field
}

/************************************
 * AUTO CALCULATE WHEN SELLING PRICE OR EXPENSES CHANGES
 ************************************/
["editSellingPrice", "editExpenses", "editCapital"].forEach(id => {
  document.getElementById(id).addEventListener("input", calculateDerivedFields);
});

function updateSale() {
  const id = document.getElementById("editSaleId").value;

  const capital = Number(document.getElementById("editCapital").value) || 0;
  const sellingPrice = Number(document.getElementById("editSellingPrice").value) || 0;
  const expenses = Number(document.getElementById("editExpenses").value) || 0;
  const buyer = document.getElementById("productBuyerName").value || "";

  const profit = sellingPrice > 0 ? sellingPrice - capital - expenses : 0;
  const status = sellingPrice > 0 ? "Sold" : "Available";

  const dateSold = sellingPrice > 0
    ? new Date(document.getElementById("soldDate").value).getTime()
    : "n/a";
  const purchaseDateInput = document.getElementById("saleDate").value;
  const datePurchase = purchaseDateInput
    ? new Date(purchaseDateInput).getTime()
    : null;
  const updates = {};

  // 🔹 SALES (ADD / UPDATE)
  updates["sales/" + id] = {
    productName: document.getElementById("editProductName").value,
    productCapital: capital,
    sellingPrice: sellingPrice,
    expenses: expenses,
    productBuyerName: buyer,
    profit: profit,
    status: status,
    productImei: document.getElementById("productImei").value,
    productImei2: document.getElementById("productImei2").value,
    dateSold: dateSold,
    datePurchase: datePurchase 
  };

  // 🔹 BUSINESS (AUTO ADD OR UPDATE)
  updates["business/" + id] = {
    saleId: id,
    amount: profit >= 700 ? profit * 0.5 : profit * 0.3,
    profit: profit,
    dateSold: dateSold,
    description: `Profit for ${document.getElementById("editProductName").value} sold to ${buyer}`,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  firebase.database().ref().update(updates)
    .then(() => {
      console.log("Sales & Business upsert success");
      backToTable();
    })
    .catch(err => console.error(err));
}

/************************************
 * BACK TO TABLE
 ************************************/
function backToTable() {
  editSection.style.display = "none";
  tableSection.style.display = "block";
}
/************************************
 * MARK AS AVAILABLE
 ************************************/
function markAsAvailable() {
  if (!selectedSaleId) return;

  if (!confirm("Mark this unit as AVAILABLE again?")) return;

  const id = selectedSaleId;
  const updates = {};

  // 🔹 SALES RESET (PARTIAL UPDATE)
  updates[`sales/${id}/sellingPrice`] = 0;
  updates[`sales/${id}/expenses`] = 0;
  updates[`sales/${id}/productBuyerName`] = "";
  updates[`sales/${id}/profit`] = 0;
  updates[`sales/${id}/dateSold`] = "";
  updates[`sales/${id}/status`] = "Available";

  // 🔹 REMOVE BUSINESS RECORD (IF EXISTS)
  updates[`business/${id}`] = null;

  firebase.database().ref().update(updates)
    .then(() => {
      console.log("Marked as AVAILABLE");
      document.getElementById("contextMenu").style.display = "none";
    })
    .catch(err => {
      console.error(err);
      alert("Failed to update status");
    });
}

/************************************
 * DELETE SALE
 ************************************/
function deleteSale() {
  if (!selectedSaleId) return;

  if (!confirm("Are you sure you want to DELETE this sale?")) return;

  const id = selectedSaleId;
  const updates = {};

  updates[`sales/${id}`] = null;
  updates[`business/${id}`] = null; // 🔥 important

  firebase.database().ref().update(updates)
    .then(() => {
      console.log("Sale & business deleted");
      document.getElementById("contextMenu").style.display = "none";
    })
    .catch(err => {
      console.error(err);
      alert("Delete failed");
    });
}


/************************************
 * FIREBASE REALTIME LISTENER
 ************************************/
// salesRef.on("value", snapshot => {
//   allSalesData = [];
//   const monthsSet = new Set();

//   snapshot.forEach(child => {
//     const data = child.val();
//     if (!data.datePurchase) return;

//     const date = new Date(data.datePurchase);
//     const monthYear = date.toLocaleString("en-US", {
//       month: "long",
//       year: "numeric"
//     });

//     monthsSet.add(monthYear);

//     allSalesData.push({
//       id: child.key,
//       productName: data.productName || "N/A",
//       datePurchase: date,
//       dateSold: data.dateSold || "n/a",
//       productCapital: data.productCapital || 0,
//       sellingPrice: data.sellingPrice || 0,
//       expenses: data.expenses || 0,
//       profit: data.profit || 0,
//       field1: data.field1 || 0,
//       field2: data.field2 || 0,
//       field3: data.field3 || 0,
//       monthYear
//     });
//   });

//   populateMonthDropdown([...monthsSet]);

//   const currentMonthData = allSalesData.filter(
//     item => item.monthYear === currentMonthYear
//   );

//   monthFilter.value = currentMonthData.length ? currentMonthYear : "all";
//   renderTable(currentMonthData.length ? currentMonthData : allSalesData);
// });
salesRef.on("value", snapshot => {
  const selectedMonth = monthFilter.value || "all"; // 🔹 tandaan selection
  allSalesData = [];
  const monthsSet = new Set();

  snapshot.forEach(child => {
    const data = child.val();
    if (!data.datePurchase) return;

    const date = new Date(data.datePurchase);
    if (isNaN(date)) return;

    const monthYear = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric"
    });

    monthsSet.add(monthYear);

    allSalesData.push({
      id: child.key,
      productName: data.productName || "N/A",
      datePurchase: date,
      dateSold: data.dateSold || "n/a",
      productCapital: Number(data.productCapital) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      expenses: Number(data.expenses) || 0,
      profit: Number(data.profit) || 0,
      field1: Number(data.field1) || 0,
      field2: Number(data.field2) || 0,
      field3: Number(data.field3) || 0,
      monthYear
    });
  });

  // 🔹 populate dropdown ONCE per change
  populateMonthDropdown([...monthsSet].sort());

  // 🔹 ibalik ang dating selection kung meron
  if (selectedMonth !== "all" && monthsSet.has(selectedMonth)) {
    monthFilter.value = selectedMonth;
  } else {
    monthFilter.value = "all";
  }

  // 🔹 filter based on selected month
  const filteredData =
    monthFilter.value === "all"
      ? allSalesData
      : allSalesData.filter(item => item.monthYear === monthFilter.value);

  renderTable(filteredData);
});

/************************************
 * MONTH FILTER
 ************************************/
monthFilter.addEventListener("change", function () {
  renderTable(
    this.value === "all"
      ? allSalesData
      : allSalesData.filter(i => i.monthYear === this.value)
  );
});


/************************************
 * IN EDIT, UPDATE BUTTON IS ONLY CLICKABLE IF ALL THE FILEDS HAS A VALUE
 ************************************/
// 🔹 GET REFERENCES
const updateButton = document.querySelector(".btn-success");
const requiredFields = [
  "editProductName",
  "editCapital",
  "editSellingPrice",
  "editExpenses",
  "soldDate",
  "productBuyerName",
  "productImei",
  "productImei2"
];

// 🔹 CHECK IF FORM IS COMPLETE
function checkFormValidity() {
  let allFilled = true;

  requiredFields.forEach(id => {
    const value = document.getElementById(id).value;

    // ❌ Empty string or null = invalid
    // ✅ 0 is valid
    if (value === "" || value === null) {
      allFilled = false;
    }
  });

  updateButton.disabled = !allFilled; // enable if all filled
}


// 🔹 ATTACH LISTENERS
requiredFields.forEach(id => {
  document.getElementById(id).addEventListener("input", checkFormValidity);
});

// 🔹 INITIAL CHECK
checkFormValidity();

