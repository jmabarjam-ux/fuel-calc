const calcForm = document.getElementById('calcForm');
const historyTable = document.querySelector('#historyTable tbody');
let chart = null;

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'history') renderHistory();
    if (tabId === 'chart') renderChart();
}

calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const fuelStart = parseFloat(document.getElementById('fuelStart').value);
    const fuelEnd = parseFloat(document.getElementById('fuelEnd').value);

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let duration = (endH - startH) + (endM - startM) / 60;
    if (duration <= 0) duration += 24; 

    const consumption = (fuelStart - fuelEnd) / duration;
    
    document.getElementById('result').innerText = `Pemakaian: ${consumption.toFixed(2)} L/jam`;
    calcForm.reset();

    const entry = { time: `${startTime}-${endTime}`, consumption: consumption.toFixed(2) };
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    history.push(entry);
    localStorage.setItem('fuelHistory', JSON.stringify(history));
});

function clearHistory() {
    localStorage.removeItem('fuelHistory');
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    historyTable.innerHTML = history.map(h => `<tr><td>${h.time}</td><td>${h.consumption} L/jam</td></tr>`).join('');
    if(history.length > 0) {
        historyTable.innerHTML += `<tr><td colspan="2"><button onclick="clearHistory()" style="background:#dc3545">Hapus Riwayat</button></td></tr>`;
    }
}

function renderChart() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    const ctx = document.getElementById('fuelChart').getContext('2d');
    
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map((_, i) => i + 1),
            datasets: [{ 
                label: 'Pemakaian (L/jam)', 
                data: history.map(h => h.consumption),
                borderColor: '#007bff',
                tension: 0.1
            }]
        },
        options: { responsive: true }
    });
}
