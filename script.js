// Supabase Initialization
const mySupabase = (typeof supabase !== 'undefined' && supabase.createClient) ? supabase.createClient(
    'https://dpnerteilzewxvndziit.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmVydGVpbHpld3h2bmR6aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDM0NjYsImV4cCI6MjEwMzkxOTQ2Nn0.Id4rkDHuOJAT479UsNSgif2J1l38nkOm9oGQ8RJbf6I'
) : null;

const dbReady = !!mySupabase;
const logContent = document.getElementById('logContent');

let trendChart = null;

function log(msg) {
    const time = new Date().toLocaleTimeString();
    if(logContent) logContent.innerHTML += `<div>[${time}] ${msg}</div>`;
    console.log(msg);
}

// Expose functions to window for onclick handlers
window.setShift = function(start, end) {
    document.getElementById('timeStart').value = start;
    document.getElementById('timeEnd').value = end;
    log(`[SHIFT] ${start}-${end}`);
};

window.toggleLog = function() {
    const panel = document.getElementById('logPanel');
    const btn = panel.querySelector('button');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        btn.textContent = 'Tutup';
    } else {
        panel.style.display = 'none';
        btn.textContent = 'Buka Log';
    }
};

window.resetForm = function() {
    document.getElementById('calcForm').reset();
    document.getElementById('results').classList.remove('show');
    log('[RESET]');
};

async function loadHistory() {
    if (!dbReady) return;
    try {
        const { data, error } = await mySupabase
            .from('shift_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const historyBody = document.getElementById('historyBody');
            historyBody.innerHTML = data.map(row => `
                <tr>
                    <td>${new Date(row.created_at).toLocaleString('id-ID', {dateStyle:'short',timeStyle:'short'})}</td>
                    <td>${row.time_start}-${row.time_end}</td>
                    <td>${row.total_usage.toFixed(2)} m3</td>
                </tr>
            `).join('');
            document.getElementById('history').style.display = 'block';
            log(`[HISTORY] Loaded ${data.length} records`);
        }
        await renderCharts();
    } catch (e) {
        log('[ERROR] History load failed: ' + e.message);
    }
}

window.clearHistory = async function() {
    if (!dbReady) return;
    if (!confirm('Hapus semua riwayat?')) return;
    try {
        const { error } = await mySupabase
            .from('shift_logs')
            .delete()
            .neq('id', -1);
        if (error) throw error;
        document.getElementById('history').style.display = 'none';
        log('[HISTORY] Cleared');
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

async function renderCharts() {
    if (!dbReady) return;
    try {
        const { data, error } = await mySupabase
            .from('shift_logs')
            .select('created_at, total_usage, time_start')
            .order('created_at', { ascending: true })
            .limit(30);
        
        if (error) throw error;
        log('[CHART] Query data: ' + JSON.stringify(data));
        if (!data?.length) {
            log('[WARN] No data for charts');
            return;
        }

        const daily = {};

        data.forEach(row => {
            const date = new Date(row.created_at).toISOString().split('T')[0];
            if (!daily[date]) daily[date] = { total: 0, count: 0 };
            daily[date].total += row.total_usage;
            daily[date].count++;
        });

        log('[CHART] Daily aggregated: ' + JSON.stringify(daily));

        const labels = Object.keys(daily).slice(-7);
        const trendData = labels.map(d => (daily[d].total / daily[d].count).toFixed(2));

        const canvas1 = document.getElementById('trendChart');
        if (!canvas1) return;

        const ctx1 = canvas1.getContext('2d');
        if (trendChart) {
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = trendData;
            trendChart.update();
        } else {
            trendChart = new Chart(ctx1, {
                type: 'line',
                data: { labels, datasets: [{
                    label: 'm3/jam',
                    data: trendData,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0,242,255,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    pointBackgroundColor: '#00f2ff'
                }]},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        x: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.05)' }},
                        y: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
                    }
                }
            });
        }
        log('[CHART] Trend chart created');

        document.getElementById('charts').style.display = 'block';

    } catch (e) {
        log('[ERROR] Chart render failed: ' + e.message);
    }
}

if (dbReady) {
    log('[SYSTEM] Supabase ready');
    document.getElementById('dbStatus').innerHTML = '<div class="status success">Database connected</div>';
    loadHistory();
} else {
    log('[ERROR] Supabase not loaded');
    document.getElementById('dbStatus').innerHTML = '<div class="status warning">Offline mode - data tidak tersimpan</div>';
}

document.getElementById('calcForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    log('[SUBMIT]');
    
    try {
        const meterStart = parseFloat(document.getElementById('meterStart').value);
        const meterEnd = parseFloat(document.getElementById('meterEnd').value);
        const timeStart = document.getElementById('timeStart').value;
        const timeEnd = document.getElementById('timeEnd').value;
        
        if (meterEnd <= meterStart) {
            alert('Meter akhir harus lebih besar!');
            return;
        }
        
        const totalUsage = meterEnd - meterStart;
        const [sH, sM] = timeStart.split(':').map(Number);
        const [eH, eM] = timeEnd.split(':').map(Number);
        let startMin = sH * 60 + sM;
        let endMin = eH * 60 + eM;
        if (endMin <= startMin) endMin += 24 * 60;
        const durationHours = (endMin - startMin) / 60;
        const avgPerHour = totalUsage / durationHours;
        
        log(`[CALC] ${totalUsage} m3, ${durationHours.toFixed(2)}h, ${avgPerHour.toFixed(2)} m3/h`);
        
        if (dbReady) {
            try {
                const { error } = await mySupabase.from('shift_logs').insert([{
                    time_start: timeStart,
                    time_end: timeEnd,
                    meter_start: meterStart,
                    meter_end: meterEnd,
                    total_usage: totalUsage,
                    cost: 0,
                    note: ''
                }]);
                if (error) throw error;
                log('[DB] Saved');
                loadHistory();
            } catch (err) {
                log('[ERROR] DB save failed: ' + err.message);
            }
        }
        
        document.getElementById('resTotal').textContent = totalUsage.toFixed(2);
        document.getElementById('resDuration').textContent = durationHours.toFixed(2);
        document.getElementById('resAvg').textContent = avgPerHour.toFixed(2);
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        let cumulative = 0;
        const numHours = Math.floor(durationHours);
        
        tbody.innerHTML += `<tr><td>${timeStart}</td><td>${meterStart.toFixed(2)}</td><td>0.00</td><td>0.00</td></tr>`;
        
        for (let i = 1; i <= numHours; i++) {
            const hourTime = ((sH + i) % 24).toString().padStart(2, '0') + ':' + sM.toString().padStart(2, '0');
            cumulative += avgPerHour;
            const currentMeter = meterStart + cumulative;
            tbody.innerHTML += `<tr><td>${hourTime}</td><td>${currentMeter.toFixed(2)}</td><td>${avgPerHour.toFixed(2)}</td><td>${cumulative.toFixed(2)}</td></tr>`;
        }
        
        if (durationHours > numHours) {
            const lastUsage = totalUsage - cumulative;
            tbody.innerHTML += `<tr><td>${timeEnd}</td><td>${meterEnd.toFixed(2)}</td><td>${lastUsage.toFixed(2)}</td><td>${totalUsage.toFixed(2)}</td></tr>`;
        }
        
        document.getElementById('results').classList.add('show');
        log('[DONE]');
        
        this.reset();
    } catch (error) {
        log('[ERROR] ' + error.message);
        alert('ERROR: ' + error.message);
    }
});
