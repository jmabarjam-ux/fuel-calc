const meterForm = document.getElementById('meterForm');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const resultsArea = document.getElementById('resultsArea');
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');

// Mobile debug helper - simple version to avoid circular reference
function mlog(msg) {
    console.log(msg);
    // Defer to avoid blocking
    setTimeout(() => {
        try {
            if (window.mlog && typeof window.mlog === 'function') {
                window.mlog(msg);
            }
        } catch (e) {
            // Silent fail - don't block execution
        }
    }, 0);
}

// Supabase Initialization (with error handling)
const supabaseUrl = 'https://dpnerteilzewxvndziit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmVydGVpbHpld3h2bmR6aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDM0NjYsImV4cCI6MjEwMzkxOTQ2Nn0.Id4rkDHuOJAT479UsNSgif2J1l38nkOm9oGQ8RJbf6I';

let supabaseClient = null;

// Initialize Supabase AFTER a delay to avoid blocking
setTimeout(() => {
    try {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase client initialized');
            mlog('✅ Supabase ready');
        } else {
            console.error('❌ Supabase library not loaded!');
            mlog('❌ Supabase lib not loaded');
        }
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        mlog('❌ Supabase init error: ' + error.message);
    }
}, 100);

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
// Re-check theme every 5 minutes
setInterval(applyAutoTheme, 5 * 60 * 1000);

function setShift(start, end) {
    document.getElementById('timeStart').value = start;
    document.getElementById('timeEnd').value = end;
}

// Initialize particles (with error handling)
if (typeof particlesJS !== 'undefined') {
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
} else {
    console.warn('ParticlesJS library not loaded');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    mlog('🚀 App initialized');
    mlog(`📱 User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    mlog(`🖥️ Screen: ${window.innerWidth}x${window.innerHeight}`);
    
    // Render history with delay to allow Supabase init
    setTimeout(() => {
        renderShiftHistory().catch(err => {
            console.error('History load failed:', err);
        });
    }, 500);
});

meterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('🔵 Form submitted');
    mlog('🔵 Form submitted - START');
    
    try {
        // Ambil elemen input
        const meterStartEl = document.getElementById('meterStart');
        const meterEndEl = document.getElementById('meterEnd');
        const timeStartEl = document.getElementById('timeStart');
        const timeEndEl = document.getElementById('timeEnd');
        
        mlog(`📋 Elements found: ${meterStartEl ? 'Y' : 'N'}, ${meterEndEl ? 'Y' : 'N'}, ${timeStartEl ? 'Y' : 'N'}, ${timeEndEl ? 'Y' : 'N'}`);
        
        const meterStart = parseFloat(meterStartEl.value);
        const meterEnd = parseFloat(meterEndEl.value);
        const timeStart = timeStartEl.value;
        const timeEnd = timeEndEl.value;

        console.log('📊 Data:', { meterStart, meterEnd, timeStart, timeEnd });
        mlog(`📊 Data: Meter ${meterStart}->${meterEnd}, Time ${timeStart}->${timeEnd}`);

        if (meterEnd < meterStart) {
            mlog('❌ Validation fail: meter akhir < awal');
            alert("Angka meter gas akhir tidak boleh lebih kecil dari meter awal.");
            return;
        }
        
        mlog('✅ Validation passed');

        const totalUsage = meterEnd - meterStart;

        console.log('💰 Kalkulasi:', { totalUsage });
        mlog(`💰 Total usage: ${totalUsage}`);

        // Save to Supabase (NON-BLOCKING - jangan sampai menghentikan kalkulasi)
        if (supabaseClient) {
            console.log('💾 Saving to Supabase...');
            mlog('💾 Saving to Supabase...');
            supabaseClient
                .from('shift_logs')
                .insert([{
                    time_start: timeStart,
                    time_end: timeEnd,
                    meter_start: meterStart,
                    meter_end: meterEnd,
                    total_usage: totalUsage,
                    cost: 0,
                    note: ''
                }])
                .select()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('❌ Error saving data:', error);
                        mlog('❌ DB save failed: ' + error.message);
                    } else {
                        console.log('✅ Saved to database:', data);
                        mlog('✅ Saved to database');
                        renderShiftHistory();
                    }
                })
                .catch(dbError => {
                    console.error('❌ Database exception:', dbError);
                    mlog('❌ DB exception: ' + dbError.message);
                });
        } else {
            console.warn('⚠️ Supabase not initialized');
            mlog('⚠️ Offline mode - no DB save');
        }

        // LANJUTKAN KALKULASI (tidak tunggu database)
        console.log('🧮 Mulai kalkulasi...');
        mlog('🧮 Mulai kalkulasi...');

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

        console.log('📈 Results:', { durationHours, avgUsagePerHour });
        mlog(`📈 Duration: ${durationHours.toFixed(2)}h, Avg: ${avgUsagePerHour.toFixed(2)} m³/h`);

        // Update summary
        mlog('📺 Updating UI summary...');
        document.getElementById('resTotal').innerText = totalUsage.toFixed(2);
        document.getElementById('resDuration').innerText = durationHours.toFixed(2);
        document.getElementById('resAvg').innerText = avgUsagePerHour.toFixed(2);

        // Smart Status Tag
        const statusBadge = document.getElementById('shiftStatusBadge');
        if (avgUsagePerHour > 25) {
            statusBadge.innerText = "⚠️ Aliran Gas Tinggi";
            statusBadge.style.background = "rgba(255, 193, 7, 0.2)";
            statusBadge.style.color = "#ffc107";
        } else {
            statusBadge.innerText = "🔥 Aliran Gas Normal / Optimal";
            statusBadge.style.background = "rgba(0, 255, 128, 0.2)";
            statusBadge.style.color = "#00ff80";
        }

        console.log('📊 Generating table...');
        mlog('📊 Generating table...');

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

        console.log('📺 Displaying results...');
        mlog('📺 Displaying results...');
        resultsArea.style.display = 'block';
        
        console.log('📉 Updating chart...');
        mlog('📉 Updating chart...');
        updateChart();
        
        showToast("🔥 Kalkulasi Pemakaian Gas berhasil dicatat!");

        // Reset form
        meterForm.reset();
        
        console.log('✅ Done!');
        mlog('✅ Done!');
        
    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
        mlog('❌ FATAL ERROR: ' + error.message);
        alert('ERROR: ' + error.message + '\n\nCek console untuk detail.');
    }
});

function updateChart() {
    try {
        const canvas = document.getElementById('usageChart');
        if (!canvas) {
            console.warn('Chart canvas not found');
            return;
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (usageChart) {
            try {
                usageChart.destroy();
            } catch (e) {
                console.warn('Error destroying chart:', e);
            }
        }
        
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
        
        console.log('✅ Chart updated');
        mlog('✅ Chart ready');
    } catch (error) {
        console.error('❌ Chart error:', error);
        mlog('❌ Chart error: ' + error.message);
        // Don't throw - chart is optional
    }
}

async function renderShiftHistory() {
    try {
        const historyCard = document.getElementById('historyLogCard');
        const tbody = document.getElementById('historyLogTable').querySelector('tbody');
        const loader = document.getElementById('loader');

        // Skip if Supabase not ready yet
        if (!supabaseClient) {
            console.warn('⚠️ Supabase not initialized, skipping history load');
            if (historyCard) historyCard.style.display = 'none';
            return;
        }

        if (loader) loader.style.display = 'block';
        
        const { data: historyLog, error } = await supabaseClient
            .from('shift_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (loader) loader.style.display = 'none';

        if (error) {
            console.error('Error loading history:', error);
            if (historyCard) historyCard.style.display = 'none';
            return;
        }

        if (!historyLog || historyLog.length === 0) {
            if (historyCard) historyCard.style.display = 'none';
            return;
        }
        
        if (historyCard) historyCard.style.display = 'block';
        if (tbody) {
            tbody.innerHTML = historyLog.map(log => `
                <tr>
                    <td>${new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>${log.time_start} - ${log.time_end}</td>
                    <td>${log.meter_start.toFixed(2)} → ${log.meter_end.toFixed(2)} m³</td>
                    <td style="color: #ff9900; font-weight: bold;">${log.total_usage.toFixed(2)} m³</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('❌ renderShiftHistory error:', err);
        // Silent fail - don't block app
    }
}

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (!supabaseClient) {
        alert('Supabase tidak terkoneksi!');
        return;
    }
    
    if (confirm("Yakin ingin menghapus seluruh log riwayat shift gas dari database?")) {
        const { error } = await supabaseClient
            .from('shift_logs')
            .delete()
            .gte('id', 0); // Delete all records where id >= 0

        if (error) {
            console.error('Error clearing history:', error);
            alert("Gagal menghapus log: " + error.message);
            return;
        }

        renderShiftHistory();
        showToast("🗑️ Log riwayat gas dibersihkan.");
    }
});

exportHistoryBtn.addEventListener('click', async () => {
    if (!supabaseClient) {
        alert('Supabase tidak terkoneksi!');
        return;
    }
    
    const { data: historyLog, error } = await supabaseClient
        .from('shift_logs')
        .select('*');

    if (error) {
        alert("Gagal mengambil data untuk export: " + error.message);
        return;
    }
    
    const blob = new Blob([JSON.stringify(historyLog, null, 2)], { type: "application/json" });
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

// WhatsApp Share Button
document.getElementById('shareWABtn').addEventListener('click', () => {
    if (tableData.length === 0) {
        alert('Belum ada data untuk di-share. Lakukan kalkulasi terlebih dahulu.');
        return;
    }
    
    // Ambil data summary
    const totalUsage = document.getElementById('resTotal').innerText;
    const duration = document.getElementById('resDuration').innerText;
    const avgUsage = document.getElementById('resAvg').innerText;
    const status = document.getElementById('shiftStatusBadge').innerText;
    
    // Get time range
    const timeStart = tableData[0].time;
    const timeEnd = tableData[tableData.length - 1].time;
    
    // Format message dengan peningkatan per jam
    let message = `🔥 *LAPORAN PEMAKAIAN GAS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 *Periode:* ${timeStart} - ${timeEnd}\n`;
    message += `⏱️ *Durasi:* ${duration} Jam\n`;
    message += `📊 *Total:* ${totalUsage} m³\n`;
    message += `📈 *Rata-rata:* ${avgUsage} m³/jam\n`;
    message += `⚡ *Status:* ${status}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *PEMAKAIAN PER JAM:*\n\n`;
    
    // Loop data, skip row pertama (jam awal = 0)
    for (let i = 1; i < tableData.length; i++) {
        const row = tableData[i];
        const prevMeter = tableData[i-1].meter;
        const increase = row.meter - prevMeter; // Peningkatan dari jam sebelumnya
        
        message += `🕐 *${row.time}*\n`;
        message += `   Meter: ${row.meter.toFixed(2)} m³\n`;
        message += `   Naik: +${increase.toFixed(2)} m³\n\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📱 _Gas Meter Calculator Pro_`;
    
    // Encode untuk WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const waURL = `https://wa.me/?text=${encodedMessage}`;
    
    // Buka WhatsApp
    window.open(waURL, '_blank');
    
    showToast("📱 Membuka WhatsApp...");
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
