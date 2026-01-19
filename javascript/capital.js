/************************************
 * GLOBAL REFERENCES
 ************************************/
const capitalTableBody = document.getElementById("capitalTableBody");
function forceScrollToBottom() {
  const container = document.querySelector(".capital-scroll");
  if (!container) return;

  container.scrollTop = container.scrollHeight;
}

// Observe changes sa table body
const tableBody = document.getElementById("capitalTableBody");

const observer = new MutationObserver(() => {
  forceScrollToBottom();
});

observer.observe(tableBody, {
  childList: true,
  subtree: true
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
 * RENDER CAPITAL TABLE
 ************************************/
function renderCapitalTable(dataList) {
  capitalTableBody.innerHTML = "";

  if (!dataList || dataList.length === 0) {
    capitalTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-muted">No records found</td>
      </tr>
    `;
    return;
  }

  // 🔹 Sort by date ascending (latest at bottom)
  dataList.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB; // ascending
  });

  let total = 0;

  dataList.forEach(item => {
    const amount = Number(item.amount) || 0;
    total += amount;

    const amountBgColor = amount >= 0 ? "#d4edda" : "#f8d7da"; // light green or light red
    const amountTextColor = amount >= 0 ? "green" : "red";

    const row = `
      <tr>
        <td>${formatDate(item.date || item.dateSold, true)}</td>
        <td style="background-color:${amountBgColor}; color:${amountTextColor}; font-weight:bold;">
          ${formatNumber(amount)}
        </td>
        <td style="max-width:300px; overflow-y:auto; white-space:pre-wrap;">
          ${item.description || ""}
        </td>
      </tr>
    `;
    capitalTableBody.insertAdjacentHTML("beforeend", row);
  });

  // 🔹 Add total row
  const totalBgColor = total >= 0 ? "#d4edda" : "#f8d7da";
  const totalTextColor = total >= 0 ? "green" : "red";
  capitalTableBody.insertAdjacentHTML("beforeend", `
    <tr>
      <td class="text-end"><strong>Total:</strong></td>
      <td style="background-color:${totalBgColor}; color:${totalTextColor}; font-weight:bold;">
        <strong>${formatNumber(total)}</strong>
      </td>
      <td></td>
    </tr>
  `);

}

/************************************
 * REALTIME FETCH CAPITAL DATA
 ************************************/
const businessRef = firebase.database().ref("business");

businessRef.on("value", snapshot => {
  const dataList = [];

  snapshot.forEach(child => {
    const data = child.val();
    dataList.push({
      date: data.dateSold || data.date,
      amount: data.amount,
      description: data.description
    });
  });

  renderCapitalTable(dataList);
}, err => {
  console.error("Failed to fetch capital data:", err);
});


// OPEN MODAL
document.getElementById("addExpenseBtn").addEventListener("click", function () {
  const modal = new bootstrap.Modal(document.getElementById("expenseModal"));
  modal.show();
});

// SAVE EXPENSE
document.getElementById("saveExpenseBtn").addEventListener("click", function () {
  const amountInput = document.getElementById("expenseAmount").value;
  const descriptionInput = document.getElementById("expenseDescription").value.trim();

  const amount = Number(amountInput);

  if (amount <= 0 || descriptionInput === "") {
    alert("Please enter valid amount and description");
    return;
  }

  const now = Date.now();
  const newKey = firebase.database().ref("capital").push().key;

  const capitalRecord = {
    amount: -Math.abs(amount), // NEGATIVE
    dateSold: now,
    description: descriptionInput,
    profit: 0,
    updatedAt: now
  };

  firebase.database()
    .ref("business/" + newKey)
    .set(capitalRecord)
    .then(() => {
      alert("Expense saved");

      // reset fields
      document.getElementById("expenseAmount").value = "";
      document.getElementById("expenseDescription").value = "";

      // close modal
      bootstrap.Modal.getInstance(
        document.getElementById("expenseModal")
      ).hide();
    })
    .catch(err => console.error(err));
});
