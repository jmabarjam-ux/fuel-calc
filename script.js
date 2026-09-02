// Supabase Initialization
var supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) ? supabase.createClient(
    'https://dpnerteilzewxvndziit.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmVydGVpbHpld3h2bmR6aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDM0NjYsImV4cCI6MjEwMzkxOTQ2Nn0.Id4rkDHuOJAT479UsNSgif2J1l38nkOm9oGQ8RJbf6I'
) : null;
var supabase = supabaseClient;

let dbReady = !!supabase;

const logContent = document.getElementById('logContent');
function log(msg) {
    const time = new Date().toLocaleTimeString();
    if(logContent) logContent.innerHTML += `<div>[${time}] ${msg}</div>`;
    console.log(msg);
}

if (dbReady) {
    log('✅ Supabase ready');
    document.getElementById('dbStatus').innerHTML = '<div class="status success">✅ Database connected</div>';
    loadHistory();
} else {
    log('❌ Supabase not loaded');
    document.getElementById('dbStatus').innerHTML = '<div class="status warning">⚠️ Offline mode - data tidak tersimpan</div>';
}

function setShift(start, end) {
    document.getElementById('timeStart').value = start;
    document.getElementById('timeEnd').value = end;
    log(`⏰ Shift: ${start}-${end}`);
}

function resetForm() {
    document.getElementById('calcForm').reset();
    document.getElementById('results').classList.remove('show');
    log('🔄 Reset');
}

async function loadHistory() {
    if (!dbReady) return;
    try {
        const { data, error } = await supabase
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
                    <td>${row.total_usage.toFixed(2)} m³</td>
                </tr>
            `).join('');
            document.getElementById('history').style.display = 'block';
            log(`📊 Loaded ${data.length} history records`);
        }
    } catch (e) {
        log('⚠️ History load failed: ' + e.message);
    }
}

async function clearHistory() {
    if (!dbReady) return;
    if (!confirm('Hapus semua riwayat?')) return;
    try {
        const { error } = await supabase
            .from('shift_logs')
            .delete()
            .neq('id', -1);
        if (error) throw error;
        document.getElementById('history').style.display = 'none';
        log('🗑️ History cleared');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

document.getElementById('calcForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    log('🔵 Submit');
    
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
        
        log(`💰 ${totalUsage} m³, ${durationHours.toFixed(2)}h, ${avgPerHour.toFixed(2)} m³/h`);
        
        if (dbReady) {
            supabase.from('shift_logs').insert([{
                time_start: timeStart,
                time_end: timeEnd,
                meter_start: meterStart,
                meter_end: meterEnd,
                total_usage: totalUsage,
                cost: 0,
                note: ''
            }]).then(({error}) => {
                if (error) {
                    log('❌ DB save failed: ' + error.message);
                } else {
                    log('✅ Saved to DB');
                    loadHistory();
                }
            });
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
        log('✅ DONE');
        
        this.reset();
    } catch (error) {
        log('❌ ERROR: ' + error.message);
        alert('ERROR: ' + error.message);
    }
});
