const meterForm = document.getElementById('meterForm');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const resultsArea = document.getElementById('resultsArea');
const resultTable = document.getElementById('resultTable')?.querySelector('tbody');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');

if (!meterForm || !resultTable) {
    console.error('Essential DOM elements not found. Check index.html structure.');
}

// Supabase Initialization
const supabase = supabase.createClient('https://dpnerteilzewxvndziit.supabase.co', 'sb_publishable_ep14e6P_0pZNgIGmJ5ExYQ_ssPAduNW');

let tableData = [];
let usageChart = null;

// Automatic theme based on browser hour (6 AM - 6 PM = Light, otherwise = Dark)
function applyAutoTheme() {
    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 6 && currentHour < 18;
    const theme = isDayTime ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    const themeStatusText = document.getElementById('themeStatusText');
    if (themeIcon && themeStatusText) {
        themeIcon.textContent = isDayTime ? '☀️' : '🌙';
        themeStatusText.textContent = isDayTime ? 'MODE SIANG' : 'MODE MALAM';
    }
}

applyAutoTheme();
setInterval(applyAutoTheme, 5 * 60 * 1000);

function setShift(start, end) {
    document.getElementById('timeStart').value = start;
    document.getElementById('timeEnd').value = end;
}

particlesJS("particles-js", {
    "particles": {
        "number": { "value": 50, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#ff6600" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.3 },
        "size": { "value": 3 },
        "line_linked": { "enable": true, "distance": 150, "color": "#ff6600", "opacity": 0.2, "width": 1 }
    },
    "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } }
});

window.addEventListener('DOMContentLoaded', () => {
    const lastMeter = localStorage.getItem('lastMeterReadingGas');
    if (lastMeter !== null) {
        document.getElementById('meterStart').value = lastMeter;
        document.getElementById('autoFillBadge').style.display = 'inline-block';
    }
    
    const savedFormData = JSON.parse(localStorage.getItem('formDataGas') || '{}');
    for (const key in savedFormData) {
        const input = document.getElementById(key);
        if (input) input.value = savedFormData[key];
    }
    
    renderShiftHistory();
});

document.getElementById('meterForm').addEventListener('input', (e) => {
    const formData = JSON.parse(localStorage.getItem('formDataGas') || '{}');
    formData[e.target.id] = e.target.value;
    localStorage.setItem('formDataGas', JSON.stringify(formData));
});

// --- Helper: Calculation Logic ---
function calculateGasUsage(meterStart, meterEnd, timeStart, timeEnd, unitPrice) {
    if (meterEnd < meterStart) throw new Error("Angka meter gas akhir tidak boleh lebih kecil dari meter awal.");
    
    const [sH, sM] = timeStart.split(':').map(Number);
    const [eH, eM] = timeEnd.split(':').map(Number);
    let startTotalMinutes = sH * 60 + sM;
    let endTotalMinutes = eH * 60 + eM;
    if (endTotalMinutes <= startTotalMinutes) endTotalMinutes += 24 * 60;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    if (durationMinutes === 0) throw new Error("Waktu awal dan akhir tidak boleh sama.");
    
    const durationHours = durationMinutes / 60;
    const totalUsage = meterEnd - meterStart;
    const avgUsagePerHour = totalUsage / durationHours;
    const totalCost = totalUsage * unitPrice;

    const dataPoints = [];
    let cumulativeUsage = 0;
    let numFullHours = Math.floor(durationHours);
    
    dataPoints.push({ time: timeStart, meter: meterStart, usage: 0, cumulative: 0 });
    
    for (let i = 1; i <= numFullHours; i++) {
        let hour = (sH + i) % 24;
        let timeStr = `${hour.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`;
        cumulativeUsage += avgUsagePerHour;
        dataPoints.push({ time: timeStr, meter: meterStart + cumulativeUsage, usage: avgUsagePerHour, cumulative: cumulativeUsage });
    }
    
    if (durationHours > numFullHours) {
        let usageLastHour = totalUsage - cumulativeUsage;
        dataPoints.push({ time: timeEnd, meter: meterEnd, usage: usageLastHour, cumulative: totalUsage });
    }

    return { totalUsage, durationHours, avgUsagePerHour, totalCost, dataPoints };
}

meterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const meterStart = parseFloat(document.getElementById('meterStart').value);
    const meterEnd = parseFloat(document.getElementById('meterEnd').value);
    const timeStart = document.getElementById('timeStart').value;
    const timeEnd = document.getElementById('timeEnd').value;
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
    const shiftNote = document.getElementById('shiftNote').value;

    let calcResult;
    try {
        calcResult = calculateGasUsage(meterStart, meterEnd, timeStart, timeEnd, unitPrice);
    } catch (err) {
        alert(err.message);
        return;
    }

    // --- UPDATE UI FIRST ---
    localStorage.setItem('lastMeterReadingGas', meterEnd);
    localStorage.removeItem('formDataGas');
    meterForm.reset();

    document.getElementById('resTotal').innerText = calcResult.totalUsage.toFixed(2);
    document.getElementById('resDuration').innerText = calcResult.durationHours.toFixed(2);
    document.getElementById('resAvg').innerText = calcResult.avgUsagePerHour.toFixed(2);

    const costCard = document.getElementById('costCard');
    if (unitPrice > 0) {
        document.getElementById('resCost').innerText = `Rp ${calcResult.totalCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        costCard.style.display = 'block';
    } else {
        costCard.style.display = 'none';
    }

    const statusBadge = document.getElementById('shiftStatusBadge');
    if (calcResult.avgUsagePerHour > 25) {
        statusBadge.innerText = "⚠️ Aliran Gas Tinggi";
        statusBadge.style.background = "rgba(255, 193, 7, 0.2)";
        statusBadge.style.color = "#ffc107";
    } else {
        statusBadge.innerText = "🔥 Aliran Gas Normal / Optimal";
        statusBadge.style.background = "rgba(0, 255, 128, 0.2)";
        statusBadge.style.color = "#00ff80";
    }

    tableData = calcResult.dataPoints;
    resultTable.innerHTML = tableData.map(row => 
        `<tr><td>${row.time}</td><td>${row.meter.toFixed(2)}</td><td>${row.usage.toFixed(2)}</td><td>${row.cumulative.toFixed(2)}</td></tr>`
    ).join('');

    resultsArea.style.display = 'block';
    updateChart();

    // --- ATTEMPT DB SAVE (Background) ---
    const { error } = await supabase
        .from('shift_logs')
        .insert([{
            time_start: timeStart,
            time_end: timeEnd,
            meter_start: meterStart,
            meter_end: meterEnd,
            total_usage: calcResult.totalUsage,
            cost: calcResult.totalCost,
            note: shiftNote
        }]);

    if (error) {
        console.error('Supabase error:', error);
        showToast("⚠️ Data terhitung, tapi GAGAL simpan ke database (cek RLS).");
    } else {
        showToast("🔥 Kalkulasi & Data berhasil disimpan!");
        renderShiftHistory();
    }
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
                label: 'Meter Gas (m³)',
                data: tableData.map(row => row.meter),
                borderColor: '#ff6600',
                backgroundColor: 'rgba(255, 102, 0, 0.1)',
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

async function renderShiftHistory() {
    const historyCard = document.getElementById('historyLogCard');
    const tbody = document.getElementById('historyLogTable').querySelector('tbody');
    const loader = document.getElementById('loader');

    loader.style.display = 'block';
    
    const { data: historyLog, error } = await supabase
        .from('shift_logs')
        .select('*')
        .order('created_at', { ascending: false });

    loader.style.display = 'none';

    if (error || !historyLog || historyLog.length === 0) {
        historyCard.style.display = 'none';
        return;
    }
    
    historyCard.style.display = 'block';
    tbody.innerHTML = historyLog.map(log => `
        <tr>
            <td>${new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>${log.time_start} - ${log.time_end}</td>
            <td>${log.meter_start.toFixed(2)} → ${log.meter_end.toFixed(2)} m³</td>
            <td style="color: #ff9900; font-weight: bold;">${log.total_usage.toFixed(2)} m³</td>
            <td style="color: #10b981; font-weight: bold;">${log.cost > 0 ? 'Rp ' + log.cost.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}</td>
            <td>${log.note || '-'}</td>
        </tr>
    `).join('');
}

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm("Yakin ingin menghapus seluruh log riwayat shift gas dari database?")) {
        const { error } = await supabase
            .from('shift_logs')
            .delete()
            .neq('id', -1); 

        if (error) {
            console.error('Error clearing history:', error);
            alert("Gagal menghapus log.");
            return;
        }

        renderShiftHistory();
        showToast("🗑️ Log riwayat gas dibersihkan.");
    }
});

exportHistoryBtn.addEventListener('click', async () => {
    const { data: historyLog, error } = await supabase
        .from('shift_logs')
        .select('*');

    if (error) {
        alert("Gagal mengambil data untuk export.");
        return;
    }
    
    const blob = new Blob([JSON.stringify(historyLog)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gas_shift_history_log.json";
    a.click();
    showToast("📥 Riwayat Gas diexport ke JSON.");
});

downloadBtn.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Jam,Meter Gas (m3),Pemakaian per Jam (m3),Kumulatif (m3)\n";
    tableData.forEach(row => {
        csvContent += `${row.time},${row.meter.toFixed(2)},${row.usage.toFixed(2)},${row.cumulative.toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_pemakaian_gas.csv");
    document.body.appendChild(link);
    link.click();
    showToast("📥 CSV Gas Berhasil Didownload.");
});

printBtn.addEventListener('click', () => {
    window.print();
});

resetBtn.addEventListener('click', () => {
    meterForm.reset();
    localStorage.removeItem('formDataGas');
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
