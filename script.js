const meterForm = document.getElementById('meterForm');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const resultsArea = document.getElementById('resultsArea');
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const themeToggle = document.getElementById('themeToggle');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');

let tableData = [];
let usageChart = null;

// Theme handling
const currentTheme = localStorage.getItem('fuelCalcTheme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('fuelCalcTheme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function setShift(start, end) {
    document.getElementById('timeStart').value = start;
    document.getElementById('timeEnd').value = end;
}

particlesJS("particles-js", {
    "particles": {
        "number": { "value": 50, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#00d4ff" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.3 },
        "size": { "value": 3 },
        "line_linked": { "enable": true, "distance": 150, "color": "#00d4ff", "opacity": 0.2, "width": 1 }
    },
    "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } }
});

// Initialize localStorage check on load
window.addEventListener('DOMContentLoaded', () => {
    const lastMeter = localStorage.getItem('lastMeterReadingFuel');
    if (lastMeter !== null) {
        document.getElementById('meterStart').value = lastMeter;
        document.getElementById('autoFillBadge').style.display = 'inline-block';
    }
    renderShiftHistory();
});

document.getElementById('meterStart').addEventListener('input', () => {
    document.getElementById('autoFillBadge').style.display = 'none';
});

meterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const meterStart = parseFloat(document.getElementById('meterStart').value);
    const meterEnd = parseFloat(document.getElementById('meterEnd').value);
    const timeStart = document.getElementById('timeStart').value;
    const timeEnd = document.getElementById('timeEnd').value;
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;

    if (meterEnd < meterStart) {
        alert("Angka meter akhir tidak boleh lebih kecil dari meter awal.");
        return;
    }

    localStorage.setItem('lastMeterReadingFuel', meterEnd);

    const totalUsage = meterEnd - meterStart;
    const totalCost = totalUsage * unitPrice;

    // Save to shift history log
    const shiftNote = document.getElementById('shiftNote').value;
    const historyLog = JSON.parse(localStorage.getItem('shiftHistoryLogFuel') || '[]');
    historyLog.unshift({
        submitTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        range: `${timeStart} - ${timeEnd}`,
        meterRange: `${meterStart} → ${meterEnd}`,
        total: totalUsage.toFixed(2),
        cost: unitPrice > 0 ? `Rp ${totalCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
        note: shiftNote || '-'
    });
    if (historyLog.length > 25) historyLog.pop();
    localStorage.setItem('shiftHistoryLogFuel', JSON.stringify(historyLog));
    renderShiftHistory();

    // Parse times
    const [sH, sM] = timeStart.split(':').map(Number);
    const [eH, eM] = timeEnd.split(':').map(Number);

    let startTotalMinutes = sH * 60 + sM;
    let endTotalMinutes = eH * 60 + eM;

    if (endTotalMinutes <= startTotalMinutes) endTotalMinutes += 24 * 60;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;

    if (durationMinutes === 0) {
        alert("Waktu awal dan akhir tidak boleh sama jika angka meter berbeda.");
        return;
    }

    const avgUsagePerHour = totalUsage / durationHours;

    // Update summary
    document.getElementById('resTotal').innerText = totalUsage.toFixed(2);
    document.getElementById('resDuration').innerText = durationHours.toFixed(2);
    document.getElementById('resAvg').innerText = avgUsagePerHour.toFixed(2);

    const costCard = document.getElementById('costCard');
    if (unitPrice > 0) {
        document.getElementById('resCost').innerText = `Rp ${totalCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        costCard.style.display = 'block';
    } else {
        costCard.style.display = 'none';
    }

    // Smart Status Tag
    const statusBadge = document.getElementById('shiftStatusBadge');
    if (avgUsagePerHour > 50) {
        statusBadge.innerText = "⚠️ Penggunaan Tinggi";
        statusBadge.style.background = "rgba(255, 193, 7, 0.2)";
        statusBadge.style.color = "#ffc107";
    } else {
        statusBadge.innerText = "⚡ Optimal / Normal";
        statusBadge.style.background = "rgba(0, 255, 128, 0.2)";
        statusBadge.style.color = "#00ff80";
    }

    // Generate Table
    tableData = [];
    resultTable.innerHTML = '';
    
    let cumulativeUsage = 0;
    let numFullHours = Math.floor(durationHours);
    
    tableData.push({ time: timeStart, meter: meterStart, usage: 0, cumulative: 0 });
    resultTable.innerHTML += `<tr><td>${timeStart}</td><td>${meterStart.toFixed(2)}</td><td>0.00</td><td>0.00</td></tr>`;
    
    for (let i = 1; i <= numFullHours; i++) {
        let totalHoursFromStart = sH + i;
        let hour = totalHoursFromStart % 24;
        let timeStr = `${hour.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`;
        
        let usageThisHour = avgUsagePerHour; 
        cumulativeUsage += usageThisHour;
        let meterReading = meterStart + cumulativeUsage;
        
        tableData.push({ time: timeStr, meter: meterReading, usage: usageThisHour, cumulative: cumulativeUsage });
        resultTable.innerHTML += `<tr><td>${timeStr}</td><td>${meterReading.toFixed(2)}</td><td>${usageThisHour.toFixed(2)}</td><td>${cumulativeUsage.toFixed(2)}</td></tr>`;
    }
    
    if (durationHours > numFullHours) {
        let usageLastHour = totalUsage - cumulativeUsage;
        cumulativeUsage += usageLastHour;
        tableData.push({ time: timeEnd, meter: meterEnd, usage: usageLastHour, cumulative: totalUsage });
        resultTable.innerHTML += `<tr><td>${timeEnd}</td><td>${meterEnd.toFixed(2)}</td><td>${usageLastHour.toFixed(2)}</td><td>${totalUsage.toFixed(2)}</td></tr>`;
    }

    resultsArea.style.display = 'block';
    updateChart();
    showToast("⚡ Kalkulasi & Biaya berhasil disimpan!");
});

function updateChart() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    if (usageChart) usageChart.destroy();
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    usageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tableData.map(row => row.time),
            datasets: [{
                label: 'Angka Meter',
                data: tableData.map(row => row.meter),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { ticks: { color: textColor }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
}

function renderShiftHistory() {
    const historyLog = JSON.parse(localStorage.getItem('shiftHistoryLogFuel') || '[]');
    const historyCard = document.getElementById('historyLogCard');
    const tbody = document.getElementById('historyLogTable').querySelector('tbody');
    
    if (historyLog.length === 0) {
        historyCard.style.display = 'none';
        return;
    }
    
    historyCard.style.display = 'block';
    tbody.innerHTML = historyLog.map(log => `
        <tr>
            <td>${log.submitTime}</td>
            <td>${log.range}</td>
            <td>${log.meterRange}</td>
            <td style="color: var(--accent); font-weight: bold;">${log.total}</td>
            <td style="color: #10b981; font-weight: bold;">${log.cost}</td>
            <td>${log.note}</td>
        </tr>
    `).join('');
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm("Yakin ingin menghapus seluruh log riwayat shift?")) {
        localStorage.removeItem('shiftHistoryLogFuel');
        renderShiftHistory();
        showToast("🗑️ Log riwayat dibersihkan.");
    }
});

exportHistoryBtn.addEventListener('click', () => {
    const historyLog = localStorage.getItem('shiftHistoryLogFuel') || '[]';
    const blob = new Blob([historyLog], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shift_history_log.json";
    a.click();
    showToast("📥 Riwayat diexport ke JSON.");
});

downloadBtn.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Jam,Angka Meter,Pemakaian Jam,Kumulatif\n";
    tableData.forEach(row => {
        csvContent += `${row.time},${row.meter.toFixed(2)},${row.usage.toFixed(2)},${row.cumulative.toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_pemakaian_fuel.csv");
    document.body.appendChild(link);
    link.click();
    showToast("📥 CSV Berhasil Didownload.");
});

printBtn.addEventListener('click', () => {
    window.print();
});

resetBtn.addEventListener('click', () => {
    meterForm.reset();
    resultsArea.style.display = 'none';
});

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
