const wallets = {
  blox: [],
  bitvavo: []
};

let coinList = []; // van CoinGecko

// Helper: sla op
function save() {
  localStorage.setItem('cryptoWallets', JSON.stringify(wallets));
}

// Helper: laad opstart
function load() {
  const saved = localStorage.getItem('cryptoWallets');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      wallets.blox = parsed.blox || [];
      wallets.bitvavo = parsed.bitvavo || [];
    } catch {
      console.warn('Ongeldige opgeslagen data, leeg maken');
      localStorage.removeItem('cryptoWallets');
    }
  }
}

// Haal munten op van CoinGecko en vul dropdown
async function loadCoins() {
  const coinSelect = document.getElementById('coin');
  coinSelect.innerHTML = `<option value="">Laden...</option>`;

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
    if (!res.ok) throw new Error('Kan munten niet laden');
    coinList = await res.json();

    // Sorteer alfabetisch op naam
    coinList.sort((a, b) => a.name.localeCompare(b.name));

    coinSelect.innerHTML = `<option value="">-- Kies munt --</option>`;
    for (const coin of coinList) {
      // toon volledige naam met symbool erbij
      coinSelect.innerHTML += `<option value="${coin.id}">${coin.name} (${coin.symbol.toUpperCase()})</option>`;
    }
  } catch (err) {
    alert('Kon munten niet laden, controleer je internetverbinding.');
    coinSelect.innerHTML = `<option value="">Fout bij laden</option>`;
  }
}

// Haal actuele prijs per coin id
async function fetchPrice(id) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
    if (!res.ok) throw new Error('Kon prijs niet laden');
    const data = await res.json();
    return data[id]?.eur || 0;
  } catch {
    return 0;
  }
}

// Toon aankopen en berekeningen per wallet
async function render() {
  // Per wallet
  for (const platform of ['blox', 'bitvavo']) {
    const listEl = document.getElementById(`${platform}-list`);
    const sumEl = document.getElementById(`${platform}-summary`);

    listEl.innerHTML = 'Laden...';
    sumEl.innerHTML = '';

    let totalInvested = 0;
    let totalCurrentValue = 0;

    // Voor actuele prijzen alle coin id's ophalen
    const pricePromises = wallets[platform].map(purchase => fetchPrice(purchase.coinId));
    const prices = await Promise.all(pricePromises);

    listEl.innerHTML = '';

    wallets[platform].forEach((purchase, idx) => {
      const currentPrice = prices[idx] || 0;
      const currentValue = purchase.amount * currentPrice;
      const profit = currentValue - purchase.totalInvested;

      totalInvested += purchase.totalInvested;
      totalCurrentValue += currentValue;

      const div = document.createElement('div');
      div.className = 'purchase-item';
      div.innerHTML = `
        <strong>${purchase.coinName} (${purchase.symbol.toUpperCase()})</strong><br/>
        Hoeveelheid gekocht: ${purchase.amount}<br/>
        Totale aankoopwaarde: €${purchase.totalInvested.toFixed(2)}<br/>
        Aankoopprijs per stuk: €${(purchase.totalInvested / purchase.amount).toFixed(2)}<br/>
        Huidige waarde: €${currentValue.toFixed(2)}<br/>
        Winst / Verlies: <strong style="color:${profit >= 0 ? 'lime' : 'red'}">€${profit.toFixed(2)}</strong><br/>
        <button class="remove-btn" onclick="removePurchase('${platform}', ${idx})">Verwijderen</button>
      `;
      listEl.appendChild(div);
    });

    const totalProfit = totalCurrentValue - totalInvested;
    sumEl.innerHTML = `
      Totale investering: €${totalInvested.toFixed(2)}<br/>
      Totale waarde nu: €${totalCurrentValue.toFixed(2)}<br/>
      Totale winst / verlies: <strong style="color:${totalProfit >= 0 ? 'lime' : 'red'}">€${totalProfit.toFixed(2)}</strong>
    `;
  }
}

// Verwijder aankoop
function removePurchase(platform, index) {
  wallets[platform].splice(index, 1);
  save();
  render();
}

// Formulier verwerking
document.getElementById('addPurchaseForm').addEventListener('submit', async e => {
  e.preventDefault();

  const wallet = document.getElementById('wallet').value;
  const coinId = document.getElementById('coin').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const totalInvested = parseFloat(document.getElementById('totalInvested').value);

  if (!wallet || !coinId || isNaN(amount) || amount <= 0 || isNaN(totalInvested) || totalInvested <= 0) {
    alert('Vul alle velden correct in.');
    return;
  }

  // Zoek naam en symbool uit coinList
  const coinData = coinList.find(c => c.id === coinId);
  if (!coinData) {
    alert('Munt niet gevonden, kies een munt uit de lijst.');
    return;
  }

  wallets[wallet].push({
    coinId,
    coinName: coinData.name,
    symbol: coinData.symbol,
    amount,
    totalInvested
  });

  save();
  e.target.reset();

  render();
});

// Init
(async function init() {
  load();
  await loadCoins();
  await render();
})();
