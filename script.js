const fallbackCoins = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ripple", name: "XRP", symbol: "XRP" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "cardano", name: "Cardano", symbol: "ADA" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "livepeer", name: "Livepeer", symbol: "LPT" }
];

let prices = {};

async function loadCoins() {
    try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
        const allCoins = await res.json();
        populateCoinSelects(fallbackCoins);
        loadPrices();
    } catch (e) {
        console.warn("API mislukt, fallback gebruikt.");
        populateCoinSelects(fallbackCoins);
        loadPrices();
    }
}

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

async function loadPrices() {
    const ids = fallbackCoins.map(c => c.id).join(",");
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
        const data = await res.json();
        prices = data;
    } catch (e) {
        prices = {};
    }
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
        const coinPrice = prices[entry.id]?.eur || 0;
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
            <span class="${gain >= 0 ? "gain" : "loss"}">Winst/Verlies: €${gain.toFixed(2)}</span>
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

window.onload = async () => {
    await loadCoins();
    setup("blox");
    setup("bitvavo");
};
