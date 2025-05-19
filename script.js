const fallbackCoins = [
  { id: "bitcoin", name: "Bitcoin", price: 67000 },
  { id: "ripple", name: "XRP", price: 0.50 },
  { id: "ethereum", name: "Ethereum", price: 3100 },
  { id: "cardano", name: "Cardano", price: 0.44 },
  { id: "solana", name: "Solana", price: 160 },
  { id: "livepeer", name: "Livepeer", price: 19.50 }
];

function populateCoinSelects(coins) {
  document.querySelectorAll(".coin-select").forEach(select => {
    select.innerHTML = "";
    coins.forEach(coin => {
      const option = document.createElement("option");
      option.value = coin.id;
      option.textContent = coin.name;
      select.appendChild(option);
    });
  });
}

function getPrice(coinId) {
  const coin = fallbackCoins.find(c => c.id === coinId);
  return coin ? coin.price : 0;
}

function saveData(exchange, data) {
  localStorage.setItem(exchange, JSON.stringify(data));
}

function loadData(exchange) {
  return JSON.parse(localStorage.getItem(exchange) || "[]");
}

function renderHoldings(exchange) {
  const container = document.querySelector(`#${exchange} .holdings`);
  const data = loadData(exchange);
  container.innerHTML = "";

  let totalValue = 0;
  let totalCost = 0;

  data.forEach(entry => {
    const coinPrice = getPrice(entry.id);
    const currentValue = coinPrice * entry.amount;
    const gain = currentValue - entry.totalPrice;
    totalValue += currentValue;
    totalCost += entry.totalPrice;

    const div = document.createElement("div");
    div.className = "coin-entry";
    div.innerHTML = `
      <strong>${entry.name}</strong><br/>
      Aantal: ${entry.amount}<br/>
      Aankoopprijs totaal: €${entry.totalPrice.toFixed(2)}<br/>
      Huidige waarde: €${currentValue.toFixed(2)}<br/>
      <span class="${gain >= 0 ? "gain" : "loss"}">
        Winst/Verlies: €${gain.toFixed(2)}
      </span>
    `;
    container.appendChild(div);
  });

  const totalDiv = document.createElement("div");
  totalDiv.innerHTML = `<hr/><strong>Totaalwaarde: €${totalValue.toFixed(2)}<br/>Totaal geïnvesteerd: €${totalCost.toFixed(2)}<br/>Winst/Verlies: <span class="${(totalValue - totalCost) >= 0 ? "gain" : "loss"}">€${(totalValue - totalCost).toFixed(2)}</span></strong>`;
  container.appendChild(totalDiv);
}

function setup(exchange) {
  const parent = document.getElementById(exchange);
  const btn = parent.querySelector(".add-btn");
  btn.onclick = () => {
    const select = parent.querySelector(".coin-select");
    const amountInput = parent.querySelector(".amount");
    const priceInput = parent.querySelector(".total-price");
    const amount = parseFloat(amountInput.value);
    const totalPrice = parseFloat(priceInput.value);
    if (isNaN(amount) || isNaN(totalPrice)) {
      alert("Voer geldige getallen in.");
      return;
    }
    const id = select.value;
    const name = select.options[select.selectedIndex].textContent;

    const data = loadData(exchange);
    data.push({ id, name, amount, totalPrice });
    saveData(exchange, data);
    renderHoldings(exchange);
    amountInput.value = "";
    priceInput.value = "";
  };
  renderHoldings(exchange);
}

window.onload = () => {
  populateCoinSelects(fallbackCoins);
  setup("blox");
  setup("bitvavo");
};
