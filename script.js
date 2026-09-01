const calcForm = document.getElementById('calcForm');
const historyTable = document.querySelector('#historyTable tbody');
let chart = null;

// Initialize particles.js
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80 },
        "color": { "value": "#ffffff" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5 },
        "size": { "value": 3 },
        "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }
    },
    "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } }
});

function populateTimeSelects() {
    const selects = ['startTime', 'endTime'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = ''; // Clear existing options
        
        // Add placeholder
        const placeholder = document.createElement('option');
        placeholder.text = "Pilih Jam";
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
        
        // Add hours
        for (let i = 0; i < 24; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = i.toString().padStart(2, '0') + ':00';
            select.appendChild(opt);
        }
    });
}

calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const startVal = document.getElementById('startTime').value;
    const endVal = document.getElementById('endTime').value;

    if (startVal === "" || endVal === "") {
        alert("Silakan pilih Jam Mulai dan Jam Selesai!");
        return;
    }

    const startH = parseInt(startVal);
    const endH = parseInt(endVal);
    const fuelStart = parseFloat(document.getElementById('fuelStart').value);
    const fuelEnd = parseFloat(document.getElementById('fuelEnd').value);
    
    if (isNaN(fuelStart) || isNaN(fuelEnd)) {
        alert("Silakan masukkan nilai bahan bakar yang valid!");
        return;
    }

    let duration = endH - startH;
    if (duration <= 0) duration += 24; 

    const rate = (fuelEnd - fuelStart) / duration;
    
    let resultText = "";
    if (rate < 0) {
        resultText = `Pemakaian: ${Math.abs(rate).toFixed(2)} L/jam`;
    } else if (rate > 0) {
        resultText = `Peningkatan: ${rate.toFixed(2)} L/jam`;
    } else {
        resultText = "Tidak ada perubahan";
    }
    
    document.getElementById('result').innerText = resultText;
    document.getElementById('startTime').value = "";
    document.getElementById('endTime').value = "";
    document.getElementById('fuelStart').value = "";
    document.getElementById('fuelEnd').value = "";

    const entry = { time: `${startH}:00-${endH}:00`, rate: rate.toFixed(2) };
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    history.push(entry);
    localStorage.setItem('fuelHistory', JSON.stringify(history));
    renderHistory();
    renderChart();
});

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    historyTable.innerHTML = history.map(h => {
        const val = parseFloat(h.rate);
        const type = val < 0 ? 'Pemakaian' : (val > 0 ? 'Peningkatan' : 'Stabil');
        return `<tr><td>${h.time}</td><td>${Math.abs(val).toFixed(2)} L/jam (${type})</td></tr>`;
    }).join('');
    if(history.length > 0) {
        historyTable.innerHTML += `<tr><td colspan="2"><button onclick="clearHistory()" style="background:#dc3545">Hapus Riwayat</button></td></tr>`;
    }
}

function clearHistory() {
    localStorage.removeItem('fuelHistory');
    renderHistory();
    renderChart();
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
                label: 'Laju Perubahan (L/jam)', 
                data: history.map(h => h.rate),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                tension: 0.1
            }]
        },
        options: { 
            responsive: true,
            scales: { 
                y: { 
                    ticks: { color: 'white' },
                    beginAtZero: false 
                }, 
                x: { ticks: { color: 'white' } } 
            }
        }
    });
}

// Initialization
window.onload = () => {
    populateTimeSelects();
    renderHistory();
    renderChart();
};
