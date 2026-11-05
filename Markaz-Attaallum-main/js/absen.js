let html5Qrcode;
let isScanning = false;

const actionBtn = document.getElementById('actionBtn');
const placeholder = document.getElementById('placeholder');
const boxWrapper = document.getElementById('boxWrapper');

// Fungsi Suara Kasir
function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(850, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) { console.log("Audio gak support bray"); }
}

actionBtn.addEventListener('click', async () => {
    if (!html5Qrcode) { html5Qrcode = new Html5Qrcode("reader"); }

    if (!isScanning) {
        // 1. MULAI SCANNING
        placeholder.style.display = 'none';
        boxWrapper.style.border = `2px solid var(--accent-blue)`;
        boxWrapper.style.boxShadow = `0 0 25px rgba(59, 130, 246, 0.4)`;

        const config = { 
            fps: 15, 
            qrbox: (width, height) => { return { width: width * 0.7, height: height * 0.7 } }
        };

        try {
            await html5Qrcode.start(
                { facingMode: "environment" }, config,
                (decodedText) => {
                    // PAS KODE TERTANGKAP!
                    isScanning = false;
                    html5Qrcode.stop(); 
                    playBeep();
                    
                    // UI Kosmetik: Berubah jadi Kuning (Loading State)
                    actionBtn.style.background = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
                    actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim ke Database...';
                    placeholder.style.display = 'block';
                    placeholder.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color: #F59E0B; font-size: 3rem; margin-bottom: 10px;"></i><p style="color: white; font-weight: 700;">MEMPROSES DATA...<br><span style="color: #3B82F6;">${decodedText}</span></p>`;
                    boxWrapper.style.border = `2px solid #F59E0B`;
                    boxWrapper.style.boxShadow = `0 0 25px rgba(245, 158, 11, 0.4)`;

                    // 🚀 EKSEKUSI PENGIRIMAN DATA KE GOOGLE SHEETS 🚀
                    SCRIPT_URL_KEAMANAN, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ qrText: decodedText }) // Data yang dilempar
                    })
                    .then(response => response.json())
                    .then(hasil => {
                        if(hasil.status === 'sukses') {
                            // UI Kosmetik: Berubah jadi Hijau (Sukses State)
                            actionBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                            actionBtn.innerHTML = '<i class="fa-solid fa-camera"></i> Scan QR Berikutnya';
                            placeholder.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-green); font-size: 3rem; margin-bottom: 10px;"></i><p style="color: white; font-weight: 700;">ABSEN TERCATAT!<br><span style="color: var(--text-muted); font-size: 0.8rem;">Data aman di server</span></p>`;
                            boxWrapper.style.border = `2px solid var(--accent-green)`;
                            boxWrapper.style.boxShadow = `0 0 25px rgba(16, 185, 129, 0.4)`;
                            
                            alert("BOOM! Absen atas nama: " + decodedText + " berhasil masuk Excel!");
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        actionBtn.style.background = 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)';
                        actionBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Gagal! Coba Lagi';
                        placeholder.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #EF4444; font-size: 3rem; margin-bottom: 10px;"></i><p style="color: white; font-weight: 700;">KONEKSI PUTUS!<br><span style="color: var(--text-muted); font-size: 0.8rem;">Cek internet lu bray</span></p>`;
                        boxWrapper.style.border = `2px solid #EF4444`;
                        boxWrapper.style.boxShadow = `0 0 25px rgba(239, 68, 68, 0.4)`;
                    });

                },
                (errorMessage) => { /* Abaikan error ringan kalau kamera lagi nyari fokus */ }
            );

            isScanning = true;
            actionBtn.style.background = 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)';
            actionBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Matikan Scanner';

        } catch (error) {
            console.error(error);
            alert("Izinin akses kamera bray!");
            placeholder.style.display = 'block';
            boxWrapper.style.border = `2px dashed #1E293B`;
            boxWrapper.style.boxShadow = `none`;
        }

    } else {
        // 2. MATIKAN SCANNER
        try {
            await html5Qrcode.stop();
            isScanning = false;
            actionBtn.style.background = 'linear-gradient(135deg, var(--accent-blue) 0%, #1D4ED8 100%)';
            actionBtn.innerHTML = '<i class="fa-solid fa-camera"></i> Aktifkan Kamera Scanner';
            placeholder.style.display = 'block';
            placeholder.innerHTML = `<i class="fa-solid fa-qrcode" style="font-size: 4.5rem; color: #1E293B; margin-bottom: 10px;"></i><p>Kamera belum aktif bray</p>`;
            boxWrapper.style.border = `2px dashed #1E293B`;
            boxWrapper.style.boxShadow = `none`;
        } catch (err) { console.error(err); }
    }
});
