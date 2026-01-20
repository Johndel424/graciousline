firebase.initializeApp({
  apiKey: "AIzaSyA0oSa7eucY_12j4xemIVEMk_kRGVS3CXo",
  authDomain: "gracious-line.firebaseapp.com",
  databaseURL: "https://gracious-line-default-rtdb.firebaseio.com",
  projectId: "gracious-line",
  storageBucket: "gracious-line.firebasestorage.app",
  messagingSenderId: "417727395652",
  appId: "1:417727395652:web:ab7766fa3233c6e4708911"
});

const db = firebase.database();
let rawData = [];
let chart = null;

/* ===============================
   📦 LOAD BUSINESS DATA
   👉 PROFIT ANG BASE
================================ */
db.ref("sales").once("value").then(snapshot => {
  snapshot.forEach(child => {
    const d = child.val();

    // PROFIT ONLY
    if (d.dateSold && Number(d.profit) > 0) {
      rawData.push({
        dateSold: d.dateSold,
        profit: Number(d.profit)
      });
    }
  });

  buildMonthDropdown();
});

/* ===============================
   🔽 MONTH DROPDOWN
================================ */
function buildMonthDropdown() {
  const select = document.getElementById("monthSelect");
  select.innerHTML = "";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentKey = `${currentYear}-${currentMonth}`;

  const monthMap = new Map();

  // collect months from data
  rawData.forEach(d => {
    const dt = new Date(d.dateSold);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    monthMap.set(key, { year: dt.getFullYear(), month: dt.getMonth() });
  });

  // 🔹 ADD CURRENT MONTH ALWAYS
  monthMap.set(currentKey, { year: currentYear, month: currentMonth });

  const sortedKeys = [...monthMap.keys()].sort((a, b) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    return ay === by ? am - bm : ay - by;
  });

  sortedKeys.forEach(key => {
    const [y, m] = key.split("-").map(Number);
    const label = new Date(y, m)
      .toLocaleString("en-US", { month: "long", year: "numeric" });

    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    select.appendChild(opt);
  });

  // 🔹 DEFAULT = CURRENT MONTH
  select.value = currentKey;

  select.onchange = () => {
    const [y, m] = select.value.split("-").map(Number);
    renderChart(y, m);
  };

  // render current month even if empty
  renderChart(currentYear, currentMonth);
}


/* ===============================
   📊 RENDER PROFIT GRAPH
================================ */
function renderChart(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyProfit = Array(daysInMonth).fill(0);

  rawData.forEach(d => {
    const dt = new Date(d.dateSold);
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      dailyProfit[dt.getDate() - 1] += d.profit;
    }
  });

  const labels = [];
  const values = [];

  let i = 0;
  while (i < dailyProfit.length) {
    if (dailyProfit[i] > 0) {
      // ✅ DAY WITH PROFIT
      labels.push(`Day ${i + 1}`);
      values.push(dailyProfit[i]);
      i++;
    } else {
      // ❌ COMPRESS ZERO DAYS
      let start = i;
      while (i < dailyProfit.length && dailyProfit[i] === 0) {
        i++;
      }
      let end = i - 1;

      if (start === end) {
        labels.push(`Day ${start + 1}`);
      } else {
        labels.push(`Day ${start + 1}–${end + 1}`);
      }
      values.push(0);
    }
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("profitChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily Profit",
        data: values,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => "₱" + ctx.raw.toLocaleString()
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: v => "₱" + v.toLocaleString()
          }
        }
      }
    }
  });
}

// document.addEventListener("DOMContentLoaded", ()=>initFastSellChart());

// function initFastSellChart(){
//   let fastSellChart = null;
//   let allProducts = [];
//   const modeSelect = document.getElementById("fastSellMode");
//   const canvas = document.getElementById("fastSellChart");

//   if(!modeSelect || !canvas) return;

//   modeSelect.value = "fast";

//   firebase.database().ref("sales").once("value").then(snapshot=>{
//     const productMap = {};

//     snapshot.forEach(child=>{
//       const s = child.val();
//       if(s.status!=="Sold") return;

//       const daysToSell = s.datePurchase && s.dateSold
//         ? Math.ceil((s.dateSold - s.datePurchase)/(1000*60*60*24))
//         : null;

//       if(!productMap[s.productName]){
//         productMap[s.productName] = {sold:0,totalDays:0,daysCount:0,capitals:[]};
//       }

//       productMap[s.productName].sold++;
//       if(daysToSell!==null){
//         productMap[s.productName].totalDays += daysToSell;
//         productMap[s.productName].daysCount++;
//       }
//       if(s.capital) productMap[s.productName].capitals.push(Number(s.capital));
//     });

//     allProducts = Object.keys(productMap).map(name=>{
//       const p = productMap[name];
//       return {
//         name,
//         sold:p.sold,
//         avgDays:p.daysCount?p.totalDays/p.daysCount:0,
//         avgCapital:p.capitals.length?p.capitals.reduce((a,b)=>a+b,0)/p.capitals.length:0
//       };
//     });

//     renderByMode("fast"); // default
//   });

//   modeSelect.addEventListener("change", e=>renderByMode(e.target.value));

//   function renderByMode(mode){
//     let products = [...allProducts];

//     if(mode==="fast") products.sort((a,b)=>a.avgDays-b.avgDays);
//     else if(mode==="sold") products.sort((a,b)=>b.sold-a.sold);
//     else if(mode==="capital") products.sort((a,b)=>a.avgCapital-a.avgCapital);

//     renderChart(products, mode);
//   }

//   function renderChart(products, mode){
//     if(fastSellChart) fastSellChart.destroy();

//     const labels = products.map(p=>p.name);
//     let data=[];
//     let chartType="doughnut";

//     if(mode==="fast"){
//       const maxDays=Math.max(...products.map(p=>p.avgDays));
//       data = products.map(p=>maxDays-p.avgDays+1); // faster = bigger slice
//     } else if(mode==="sold"){
//       data = products.map(p=>p.sold);
//     } else if(mode==="capital"){
//       chartType="bar";
//       data = products.map(p=>p.avgCapital);
//     }

//     const colors = products.map((_,i)=>`hsl(${(i*45)%360},70%,55%)`);

//     fastSellChart = new Chart(canvas,{
//       type: chartType,
//       data:{labels,datasets:[{label: mode==="capital"?"Avg Capital (₱)":"",data,backgroundColor:colors,borderWidth:1}]},
//       options:{
//         indexAxis: mode==="capital"?'y':undefined,
//         responsive:true,
//         maintainAspectRatio:false,
//         plugins:{
//           tooltip:{callbacks:{
//             label: ctx=>{
//               const p=products[ctx.dataIndex];
//               return `${p.name}\nSold: ${p.sold}\nAvg Days: ${p.avgDays.toFixed(1)}\nAvg Capital: ₱${p.avgCapital.toFixed(0)}`;
//             }
//           }},
//           legend:{display: mode==="capital"?false:true, position:"bottom"}
//         },
//         scales: mode==="capital"?{x:{title:{display:true,text:"Capital per Unit (₱)"}}}:undefined
//       }
//     });
//   }
// }
document.addEventListener("DOMContentLoaded", ()=>initFastSellChart());

function initFastSellChart(){
  let fastSellChart = null;
  let allProducts = [];
  const modeSelect = document.getElementById("fastSellMode");
  const canvas = document.getElementById("fastSellChart");
  const suggestionList = document.getElementById("suggestionsList");

  if(!modeSelect || !canvas || !suggestionList) return;

  modeSelect.value = "fast"; // default

  // 🔹 Load sales data
  firebase.database().ref("sales").once("value").then(snapshot=>{
    const productMap = {};

    snapshot.forEach(child=>{
      const s = child.val();
      if(s.status!=="Sold") return;

      const daysToSell = s.datePurchase && s.dateSold
        ? Math.ceil((s.dateSold - s.datePurchase)/(1000*60*60*24))
        : null;

      if(!productMap[s.productName]){
        productMap[s.productName] = {sold:0,totalDays:0,daysCount:0,capitals:[],stock: s.stock || 0};
      }

      productMap[s.productName].sold++;
      productMap[s.productName].stock = s.stock || productMap[s.productName].stock;

      if(daysToSell!==null){
        productMap[s.productName].totalDays += daysToSell;
        productMap[s.productName].daysCount++;
      }
      if(s.productCapital) productMap[s.productName].capitals.push(Number(s.productCapital));
    });

    allProducts = Object.keys(productMap).map(name=>{
      const p = productMap[name];
      return {
        name,
        sold: p.sold,
        avgDays: p.daysCount?p.totalDays/p.daysCount:0,
        avgCapital: p.capitals.length?p.capitals.reduce((a,b)=>a+b,0)/p.capitals.length:0,
        stock: p.stock
      };
    });

    renderByMode("fast");
    renderSuggestions();
  });

  // 🔹 Dropdown change
  modeSelect.addEventListener("change", e=>renderByMode(e.target.value));

  // 🔹 Render chart per mode
  function renderByMode(mode){
    let products = [...allProducts];

    if(mode==="fast") products.sort((a,b)=>a.avgDays-b.avgDays);
    else if(mode==="sold") products.sort((a,b)=>b.sold-a.sold);
    else if(mode==="capital") products.sort((a,b)=>a.avgCapital-b.avgCapital);

    renderChart(products, mode);
  }

  // 🔹 Render chart
  function renderChart(products, mode){
    if(fastSellChart) fastSellChart.destroy();

    const labels = products.map(p=>p.name);
    let data=[];
    let chartType="doughnut";
    let indexAxis = undefined;

    if(mode==="fast"){
      const maxDays=Math.max(...products.map(p=>p.avgDays));
      data = products.map(p=>maxDays-p.avgDays+1); // faster = bigger slice
    } else if(mode==="sold"){
      data = products.map(p=>p.sold);
    } else if(mode==="capital"){
      chartType="bar";
      indexAxis='y';
      data = products.map(p=>p.avgCapital);
    }

    const colors = products.map((_,i)=>`hsl(${(i*45)%360},70%,55%)`);
    const borderColors = products.map((_,i)=>{
      // highlight top 3 fast moving
      if(mode==="fast" && i<3) return "#000";
      return "#fff";
    });
    const borderWidths = products.map((_,i)=> mode==="fast" && i<3 ? 4 : 1);

    fastSellChart = new Chart(canvas,{
      type: chartType,
      data:{
        labels,
        datasets:[{
          label: mode==="capital"?"Avg Capital (₱)":"",
          data,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: borderWidths
        }]
      },
      options:{
        indexAxis: indexAxis,
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          tooltip:{
            callbacks:{
              label: ctx=>{
                const p = products[ctx.dataIndex];
                return `${p.name}\nSold: ${p.sold}\nAvg Days: ${p.avgDays.toFixed(1)}\nStock: ${p.stock}`;
              }
            }
          },
          legend:{
            display: mode==="capital"?false:true,
            position:"bottom"
          }
        },
        scales: mode==="capital"?{x:{title:{display:true,text:"Capital per Unit (₱)"}}}:undefined
      }
    });
  }

  // 🔹 Suggest top 5 fast-break units (stock = 0)
  function renderSuggestions(){
    const outOfStock = allProducts.filter(p=>p.stock===0);
    outOfStock.sort((a,b)=>a.avgDays-b.avgDays); // fastest first
    const top5 = outOfStock.slice(0,5);
    suggestionList.innerHTML = top5.map(p=>`<li>${p.name} (Sold: ${p.sold}, AvgDays: ${p.avgDays.toFixed(1)})</li>`).join("");
  }
}
