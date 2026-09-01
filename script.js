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
    
    let currentMeter = meterStart;
    let cumulativeUsage = 0;
    
    // We need to iterate hourly
    let numHours = Math.ceil(durationHours);
    
    for (let i = 0; i <= numHours; i++) {
        let hourOffset = i;
        let currentTime = new Date(0, 0, 0, sH, sM + (i * 60));
        let timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        let usageThisHour = 0;
        let meterReading = 0;
        
        if (i === 0) {
            usageThisHour = 0;
            meterReading = meterStart;
        } else if (i === numHours) {
            usageThisHour = totalUsage - cumulativeUsage;
            meterReading = meterEnd;
        } else {
            usageThisHour = avgUsagePerHour;
            cumulativeUsage += usageThisHour;
            meterReading = meterStart + cumulativeUsage;
        }
        
        tableData.push({ time: timeStr, meter: meterReading, usage: usageThisHour, cumulative: (meterReading - meterStart) });

        let row = `<tr>
            <td>${timeStr}</td>
            <td>${meterReading.toFixed(2)}</td>
            <td>${usageThisHour.toFixed(2)}</td>
            <td>${(meterReading - meterStart).toFixed(2)}</td>
        </tr>`;
        resultTable.innerHTML += row;
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
