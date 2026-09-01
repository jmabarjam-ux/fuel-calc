const meterForm = document.getElementById('meterForm');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resultsArea = document.getElementById('resultsArea');
const resultTable = document.getElementById('resultTable').querySelector('tbody');

let tableData = [];

meterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const meterStart = parseFloat(document.getElementById('meterStart').value);
    const meterEnd = parseFloat(document.getElementById('meterEnd').value);
    const timeStart = document.getElementById('timeStart').value;
    const timeEnd = document.getElementById('timeEnd').value;

    if (meterEnd < meterStart) {
        alert("Angka meter akhir tidak boleh lebih kecil dari meter awal.");
        return;
    }

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

    const totalUsage = meterEnd - meterStart;
    const avgUsagePerHour = totalUsage / durationHours;

    // Update summary
    document.getElementById('resTotal').innerText = totalUsage.toFixed(2);
    document.getElementById('resDuration').innerText = durationHours.toFixed(2);
    document.getElementById('resAvg').innerText = avgUsagePerHour.toFixed(2);

    // Generate Table
    tableData = [];
    resultTable.innerHTML = '';
    
    let cumulativeUsage = 0;
    let numFullHours = Math.floor(durationHours);
    
    // Row 0: Start
    tableData.push({ time: timeStart, meter: meterStart, usage: 0, cumulative: 0 });
    resultTable.innerHTML += `<tr><td>${timeStart}</td><td>${meterStart.toFixed(2)}</td><td>0.00</td><td>0.00</td></tr>`;
    
    // Intermediate hours
    for (let i = 1; i <= numFullHours; i++) {
        let currentTime = new Date(0, 0, 0, sH + i, sM);
        let timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        let usageThisHour = avgUsagePerHour; 
        cumulativeUsage += usageThisHour;
        let meterReading = meterStart + cumulativeUsage;
        
        tableData.push({ time: timeStr, meter: meterReading, usage: usageThisHour, cumulative: cumulativeUsage });
        resultTable.innerHTML += `<tr><td>${timeStr}</td><td>${meterReading.toFixed(2)}</td><td>${usageThisHour.toFixed(2)}</td><td>${cumulativeUsage.toFixed(2)}</td></tr>`;
    }
    
    // Last row (End) if not already added
    if (durationHours > numFullHours) {
        let usageLastHour = totalUsage - cumulativeUsage;
        cumulativeUsage += usageLastHour;
        tableData.push({ time: timeEnd, meter: meterEnd, usage: usageLastHour, cumulative: totalUsage });
        resultTable.innerHTML += `<tr><td>${timeEnd}</td><td>${meterEnd.toFixed(2)}</td><td>${usageLastHour.toFixed(2)}</td><td>${totalUsage.toFixed(2)}</td></tr>`;
    }

    resultsArea.style.display = 'block';
});

resetBtn.addEventListener('click', () => {
    meterForm.reset();
    resultsArea.style.display = 'none';
});

downloadBtn.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Jam,Angka Meter,Pemakaian Jam,Kumulatif\n";
    tableData.forEach(row => {
        csvContent += `${row.time},${row.meter.toFixed(2)},${row.usage.toFixed(2)},${row.cumulative.toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_pemakaian.csv");
    document.body.appendChild(link);
    link.click();
});
