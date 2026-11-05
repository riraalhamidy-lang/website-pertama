
// Variabel global untuk nyimpen memori notifikasi
let dataPengumumanAktif = "";

// --- 1. INIT KETIKA WEB DIBUKA ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 400);
        }
    }, 800);
    applyUniversalCapslock();
    muatIlanPusat();
    cekNotifikasiPusat(); 
    muatTemaTersimpan(); // 🔥 LOAD TEMA TERSIMPAN PAS BUKA WEB
});

// ==========================================
// 🔥 FUNGSI GANTI TEMA GLOBAL (SINKRON PORTAL)
// ==========================================
function gantiTemaGlobal(namaTema) {
    document.body.className = '';
    if (namaTema !== 'dark') {
        document.body.classList.add(`theme-${namaTema}`);
    }
    // Simpan ke memori HP biar sinkron sama portal murid!
    localStorage.setItem('temaPortal', namaTema);
}

function muatTemaTersimpan() {
    const savedTheme = localStorage.getItem('temaPortal') || 'dark';
    document.getElementById('themeSelectorIndex').value = savedTheme;
    gantiTemaGlobal(savedTheme);
}

// --- FUNGSI MATA-MATA NOTIFIKASI PENGUMUMAN ---
function cekNotifikasiPusat() {
    fetch(`${SCRIPT_URL_UTAMA}?action=getPengumuman`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "sukses" && data.data.length > 0) {
            const terbaru = data.data[0];
            document.getElementById('tglNotif').innerText = terbaru.tanggal + " - " + terbaru.judul;
            document.getElementById('isiNotif').innerText = terbaru.isi;
            
            dataPengumumanAktif = terbaru.judul + terbaru.isi;
            const terakhirDibaca = localStorage.getItem('notifTerakhir');
            
            if (terakhirDibaca !== dataPengumumanAktif) {
                document.getElementById('badgeMerah').style.display = 'block';
                setTimeout(() => { document.getElementById('boxNotif').classList.add('show'); }, 2500);
            }
        } else {
            document.getElementById('isiNotif').innerText = "Belum ada pengumuman saat ini.";
        }
    })
    .catch(err => console.log("Gagal ngecek notif:", err));
}

// FUNGSI BUKA TUTUP POP-UP NOTIFIKASI
function toggleNotif() {
    const box = document.getElementById('boxNotif');
    box.classList.toggle('show');
    
    if(box.classList.contains('show') && dataPengumumanAktif !== "") {
        document.getElementById('badgeMerah').style.display = 'none';
        localStorage.setItem('notifTerakhir', dataPengumumanAktif);
    }
}

// --- 2. AUDIO SFX SYSTEM ---
function playSuccessSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.log("Audio API issue"); }
}

// --- 3. TESTIMONI OTOMATIS ---
const testimoniData = [
    { text: '"Belajar di attaallum keren sekali!"', author: 'Luthfi Al-Fatih', badge: 'Lead Developer' },
    { text: '"Attaallum jaya jaya"', author: 'Radit Ganteng', badge: 'orang terganteng sedunia' },
    { text: '"Dulu saya kira Bahasa Arab itu susah, dengan Attaallum ternyata jadi mudah banget!"', author: 'Ahmad Isna Asari', badge: 'Lolos Kuliah Al-Azhar' },
    { text: '"attalum menjadi tempat belajar yang sangat membantu Penjelasanny jelas dan mudah diikuti."', author: 'Abdul Rahim Mufid', badge: 'Peraih 2 Idadi' },
    { text: '"Penyampaian guru sangat jelas dan detail serta mudah dipahami."', author: 'Noureen Qiana', badge: 'Peserta 2 Tsanawi' }
];
let testiIndex = 0;
setInterval(() => {
    testiIndex = (testiIndex + 1) % testimoniData.length;
    const tContent = document.getElementById('testiContent');
    const tAuthor = document.getElementById('testiAuthor');
    if(tContent && tAuthor) {
        tContent.style.opacity = 0; tAuthor.style.opacity = 0;
        setTimeout(() => {
            tContent.innerText = testimoniData[testiIndex].text;
            tAuthor.innerHTML = `${testimoniData[testiIndex].author} <span class="testi-badge">${testimoniData[testiIndex].badge}</span>`;
            tContent.style.opacity = 1; tAuthor.style.opacity = 1;
        }, 400);
    }
}, 4000);

// --- 4. STUDY TIMER POMODORO ---
let timerInterval;
let timeLeft = 25 * 60;
function updateTimerDisplay() {
    let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
    document.getElementById('time-display').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function mulaiTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(timeLeft > 0) { timeLeft--; updateTimerDisplay(); } 
        else { clearInterval(timerInterval); playSuccessSound(); alert("Waktu fokus selesai! Istirahat 5 menit ya."); }
    }, 1000);
}
function jedaTimer() { clearInterval(timerInterval); }
function resetTimer() { clearInterval(timerInterval); timeLeft = 25 * 60; updateTimerDisplay(); }

// --- 6. REGISTRASI NIA BARU ---
function kirimDataForm(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const teksAsli = submitBtn.innerText;
    submitBtn.disabled = true; submitBtn.innerText = 'MEMPROSES DATA... ⏳';

    const dataAlumni = {
        formType: 'Registrasi_NIA',
        email: document.getElementById('formEmail').value,
        namaLengkap: document.getElementById('formNama').value.toUpperCase(),
        ttl: document.getElementById('formTTL').value,
        domisili: document.querySelector('input[name="domisili"]:checked') ? document.querySelector('input[name="domisili"]:checked').value : "",
        kekeluargaan: document.getElementById('formKekeluargaan').value,
        tahunKedatangan: document.getElementById('formTahun').value,
        mediator: document.getElementById('formMediator').value,
        jenjang: document.querySelector('input[name="jenjang"]:checked') ? document.querySelector('input[name="jenjang"]:checked').value : "",
        tingkatDirosah: document.querySelector('input[name="tkDirosah"]:checked') ? document.querySelector('input[name="tkDirosah"]:checked').value : "-",
        tingkatMahad: document.querySelector('input[name="tkMahad"]:checked') ? document.querySelector('input[name="tkMahad"]:checked').value : "-",
        noHP: document.getElementById('formNoHP').value,
        password: document.getElementById('formPassword').value,
    };
    
    fetch(SCRIPT_URL_UTAMA, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dataAlumni) })
    .then(response => response.json())
    .then(hasil => {
        if (hasil.result === 'success') {
            document.getElementById('form-admin-modal').style.display = 'none';
            document.getElementById('success-admin-modal').style.display = 'flex';
            
            let cleanNia = hasil.nia.replace(/-/g, "").replace(/2026/g, "");
            document.getElementById('displayNIA').innerText = cleanNia; 
            
            playSuccessSound();
            const waMessage = encodeURIComponent(`Halo Admin,\nSaya sudah mengisi form NIA baru.\nNama: ${dataAlumni.namaLengkap}\nNIA: ${cleanNia}\nMohon diaktivasi!`);
            document.getElementById('waDirectBtn').href = "https://wa.me/201551018457?text=" + waMessage;
            document.getElementById('registrationForm').reset();
        } else { alert('Sistem mendeteksi malfungsi: ' + hasil.error); }
    })
    .catch(error => { console.error('Error!', error); alert('Gagal mengirimkan transmisi data!'); })
    .finally(() => { submitBtn.disabled = false; submitBtn.innerText = teksAsli; });
}

// --- 7. REVOLUSI SISTEM FORM PINTAR DINAMIS (5 PROGRAM) ---
let currentActiveProgram = '';

function bukaFormPintar(namaProgram) {
    currentActiveProgram = namaProgram;
    document.getElementById('program-pembelajaran-modal').style.display = 'none';
    document.getElementById('universalFormTitle').innerHTML = `<i class="fa-solid fa-file-signature" style="color: #10b981;"></i> Form ${namaProgram}`;
    
    const fieldsArea = document.getElementById('dynamic-fields-area');
    fieldsArea.innerHTML = ''; 
    
    let htmlContent = '';

    if(namaProgram === 'Private') {
        htmlContent = `
            <div class="form-group"><label class="title">Nomor NIA Anda *</label><input type="text" id="univNia" placeholder="Cth: NIA340" required style="text-transform: uppercase;"></div>
            <div class="form-group">
                <label class="title">Program Privat Yang Diambil *</label>
                <select id="univDetail_1" required>
                    <option value="" disabled selected>-- Pilih Opsi Kelas --</option>
                    <option value="Program Private Ma'had">Program Private Ma'had</option>
                    <option value="Program Private Dirasah Khassah">Program Private Dirasah Khassah</option>
                    <option value="Program Private Matan Al-Jurumiyyah">Program Private Matan Al-Jurumiyyah</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">No WhatsApp Aktif *</label>
                <span class="note">*Isi dengan nomor yang aktif. Gunakan kode negara (+20)/(+62). Contoh: +201013409312</span>
                <input type="text" id="univWA_Siswa" placeholder="+2010..." required>
            </div>
            <div class="form-group">
                <label class="title">No WhatsApp Orang Tua *</label>
                <span class="note">*Isi dengan nomor yang aktif. Gunakan kode negara (+62). Contoh: +62813409312</span>
                <input type="text" id="univWA_Ortu" placeholder="+6281..." required>
            </div>
            <div class="form-group">
                <label class="title">Sistem Pembayaran *</label>
                <select id="univPay" required>
                    <option value="" disabled selected>-- Pilih Metode --</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Nyicil">Nyicil</option>
                </select>
            </div>
        `;
    }
    else if(namaProgram === 'Imtihan Qobul') {
        htmlContent = `
            <div class="form-group"><label class="title">Nomor NIA Anda *</label><input type="text" id="univNia" placeholder="Cth: NIA340" required style="text-transform: uppercase;"></div>
            <div class="form-group">
                <label class="title">Kelas Di Dirosah Khossoh *</label>
                <select id="univDetail_1" required>
                    <option value="" disabled selected>-- Pilih Tingkat --</option>
                    <option value="Belum Terdaftar">Belum Terdaftar</option>
                    <option value="Mubtadi Awal">Mubtadi Awal</option>
                    <option value="Mubtadi Tsani">Mubtadi Tsani</option>
                    <option value="Mutawassit Awal">Mutawassit Awal</option>
                    <option value="Mutawassit Tsani">Mutawassit Tsani</option>
                    <option value="Mutaqoddim Awal">Mutaqoddim Awal</option>
                    <option value="Mutaqoddim Tsani">Mutaqoddim Tsani</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Sudah Ikut Program Unggulan Ke Berapa? *</label>
                <select id="univDetail_2" required>
                    <option value="" disabled selected>-- Pilih --</option>
                    <option value="Pertama">Pertama</option>
                    <option value="Kedua">Kedua</option>
                    <option value="Ketiga">Ketiga</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">No WhatsApp Aktif *</label>
                <span class="note">*Gunakan kode negara (+20)/(+62) tanpa spasi.</span>
                <input type="text" id="univWA_Siswa" placeholder="+2010..." required>
            </div>
            <div class="form-group">
                <label class="title">No WhatsApp Orang Tua *</label>
                <span class="note">*Gunakan kode negara (+62) tanpa spasi.</span>
                <input type="text" id="univWA_Ortu" placeholder="+6281..." required>
            </div>
            <div class="form-group">
                <label class="title">Pembayaran *</label>
                <select id="univPay" required>
                    <option value="" disabled selected>-- Pilih Metode --</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Nyicil 50%">Nyicil 50%</option>
                </select>
            </div>
        `;
    }
    else if(namaProgram === 'Musabaqoh 3 I\'dadi') {
        htmlContent = `
            <div class="form-group"><label class="title">Nomor NIA Anda *</label><input type="text" id="univNia" placeholder="Cth: NIA340" required style="text-transform: uppercase;"></div>
            <div class="form-group">
                <label class="title">Tingkat (Ma'had) *</label>
                <select id="univDetail_1" required>
                    <option value="2 I'dadi">2 I'dadi</option>
                    <option value="3 I'dadi" selected>3 I'dadi</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Program Yang Ingin Diambil *</label>
                <select id="univDetail_2" required>
                    <option value="" disabled selected>-- Pilih Opsi --</option>
                    <option value="Program Pre-Musabaqoh (2 I'dadi)">Program Pre-Musabaqoh (2 I'dadi)</option>
                    <option value="Program Musabaqoh (3 I'dadi)">Program Musabaqoh (3 I'dadi)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Paket Yang Ingin Diambil *</label>
                <select id="univDetail_3" required>
                    <option value="" disabled selected>-- Pilih Paket --</option>
                    <option value="Mukhtar (1 maddah - 5 maddah)">Mukhtar (1 maddah - 5 maddah)</option>
                    <option value="Mubsit (6 materi - wajib fiqh, nahwu, tauhid)">Mubsit (6 materi - wajib fiqh, nahwu, tauhid)</option>
                    <option value="Mutqin (semua maddah)">Mutqin (semua maddah)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Konfirmasi Maddah (Centang Yang Diikuti) *</label>
                <div class="checkbox-grid">
                    <label><input type="checkbox" name="maddah" value="Fiqh"> Fiqh</label>
                    <label><input type="checkbox" name="maddah" value="Nahwu"> Nahwu</label>
                    <label><input type="checkbox" name="maddah" value="Shorof"> Shorof</label>
                    <label><input type="checkbox" name="maddah" value="Tauhid"> Tauhid</label>
                    <label><input type="checkbox" name="maddah" value="Tafsir"> Tafsir</label>
                    <label><input type="checkbox" name="maddah" value="Hadist"> Hadist</label>
                    <label><input type="checkbox" name="maddah" value="Siroh"> Siroh</label>
                    <label><input type="checkbox" name="maddah" value="Riyadhi"> Riyadhi</label>
                    <label><input type="checkbox" name="maddah" value="Ulum"> Ulum</label>
                    <label><input type="checkbox" name="maddah" value="Geografi"> Geografi</label>
                    <label><input type="checkbox" name="maddah" value="Tsaqofah"> Tsaqofah</label>
                </div>
            </div>
            <div class="form-group"><label class="title">No WhatsApp *</label><input type="text" id="univWA_Siswa" placeholder="+2010..." required></div>
            <div class="form-group"><label class="title">No WhatsApp Orang Tua *</label><input type="text" id="univWA_Ortu" placeholder="+6281..." required></div>
            <div class="form-group">
                <label class="title">Pembayaran *</label>
                <select id="univPay" required>
                    <option value="Lunas">Lunas</option>
                    <option value="Nyicil 50%">Nyicil 50%</option>
                </select>
            </div>
        `;
    }
    else if(namaProgram === 'Musabaqoh 3 Tsanawi') {
        htmlContent = `
            <div class="form-group"><label class="title">Nomor NIA Anda *</label><input type="text" id="univNia" placeholder="Cth: NIA340" required style="text-transform: uppercase;"></div>
            <div class="form-group">
                <label class="title">Tingkat (Ma'had) *</label>
                <select id="univDetail_1" required>
                    <option value="1 Tsanawi">1 Tsanawi</option>
                    <option value="2 Tsanawi">2 Tsanawi</option>
                    <option value="3 Tsanawi" selected>3 Tsanawi</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Paket Yang Ingin Diambil *</label>
                <select id="univDetail_2" required>
                    <option value="" disabled selected>-- Pilih Paket --</option>
                    <option value="Mukhtar (1 maddah - 5 maddah)">Mukhtar (1 maddah - 5 maddah)</option>
                    <option value="Mubsit (6 materi)">Mubsit (6 materi)</option>
                    <option value="Mutqin (semua maddah)">Mutqin (semua maddah)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="title">Konfirmasi Maddah (Centang Yang Diikuti) *</label>
                <div class="checkbox-grid">
                    <label><input type="checkbox" name="maddah" value="Fiqh"> Fiqh</label>
                    <label><input type="checkbox" name="maddah" value="Nahwu"> Nahwu</label>
                    <label><input type="checkbox" name="maddah" value="Shorof"> Shorof</label>
                    <label><input type="checkbox" name="maddah" value="Tauhid"> Tauhid</label>
                    <label><input type="checkbox" name="maddah" value="Tafsir"> Tafsir</label>
                    <label><input type="checkbox" name="maddah" value="Hadist"> Hadist</label>
                </div>
            </div>
            <div class="form-group"><label class="title">No WhatsApp *</label><input type="text" id="univWA_Siswa" placeholder="+2010..." required></div>
            <div class="form-group"><label class="title">No WhatsApp Orang Tua *</label><input type="text" id="univWA_Ortu" placeholder="+6281..." required></div>
            <div class="form-group">
                <label class="title">Pembayaran *</label>
                <select id="univPay" required>
                    <option value="Lunas">Lunas</option>
                    <option value="Nyicil 50%">Nyicil 50%</option>
                </select>
            </div>
        `;
    }
    else if(namaProgram === 'Lughoh Azhary') {
        htmlContent = `
            <div class="form-group"><label class="title">Email *</label><input type="email" id="univEmail" required></div>
            <div class="form-group"><label class="title">Nama Lengkap *</label><input type="text" id="univNama" required></div>
            <div class="form-group"><label class="title">Tempat, Tanggal Lahir *</label><input type="text" id="univTTL" placeholder="Cth: KAIRO, 12 JANUARI 2005" required></div>
            <div class="form-group"><label class="title">No WhatsApp *</label><input type="text" id="univWA_Siswa" placeholder="+2010..." required></div>
            <div class="form-group"><label class="title">No WhatsApp Orang Tua *</label><input type="text" id="univWA_Ortu" placeholder="+6281..." required></div>
            <div class="form-group">
                <label class="title">Domisili *</label>
                <select id="univDetail_1" required>
                    <option value="" disabled selected>-- Pilih Domisili --</option>
                    <option value="Hayyu sabi'">Hayyu sabi'</option>
                    <option value="Hayyu asyir">Hayyu asyir</option>
                    <option value="Hayyu tsamin">Hayyu tsamin</option>
                    <option value="Darrasah">Darrasah</option>
                    <option value="Yang lain">Yang lain</option>
                </select>
            </div>
            <div class="form-group"><label class="title">Kekeluargaan *</label><input type="text" id="univDetail_2" placeholder="Cth: KKS" required></div>
            <div class="form-group"><label class="title">Tahun Kedatangan *</label><input type="number" id="univDetail_3" placeholder="Cth: 2024" required></div>
            <div class="form-group"><label class="title">Mediator *</label><input type="text" id="univDetail_4" required></div>
            <div class="form-group">
                <label class="title">Apakah siap untuk mengikuti seluruh program dengan serius? *</label>
                <select id="univDetail_5" required>
                    <option value="Siap">Siap</option>
                    <option value="Sangat siap">Sangat siap</option>
                    <option value="Tidak siap">Tidak siap</option>
                </select>
            </div>
        `;
    }

    fieldsArea.innerHTML = htmlContent;
    document.getElementById('universal-program-modal').style.display = 'flex';
    applyUniversalCapslock();
}

// --- 8. PROSES HANDLER POST DATA & PEMBAYARAN DEMO ---
let tempPayloadData = {};

function handleUniversalSubmit(event) {
    event.preventDefault();
    
    let d1 = document.getElementById('univDetail_1') ? document.getElementById('univDetail_1').value : '';
    let d2 = document.getElementById('univDetail_2') ? document.getElementById('univDetail_2').value : '';
    let d3 = document.getElementById('univDetail_3') ? document.getElementById('univDetail_3').value : '';
    let d4 = document.getElementById('univDetail_4') ? document.getElementById('univDetail_4').value : '';
    let d5 = document.getElementById('univDetail_5') ? document.getElementById('univDetail_5').value : '';
    
    let checkedMaddah = [];
    document.querySelectorAll('input[name="maddah"]:checked').forEach(cb => checkedMaddah.push(cb.value));
    let maddahString = checkedMaddah.join(', ');
    
    tempPayloadData = {
        formType: currentActiveProgram === 'Lughoh Azhary' ? 'Lughoh_Azhari' : 'Pendaftaran_Umum',
        programName: currentActiveProgram,
        email: document.getElementById('univEmail') ? document.getElementById('univEmail').value : '',
        namaLengkap: document.getElementById('univNama') ? document.getElementById('univNama').value.toUpperCase() : '',
        ttl: document.getElementById('univTTL') ? document.getElementById('univTTL').value : '',
        niaUser: document.getElementById('univNia') ? document.getElementById('univNia').value.toUpperCase() : 'JALUR_LUGHOH',
        waSiswa: document.getElementById('univWA_Siswa').value,
        waOrtu: document.getElementById('univWA_Ortu') ? document.getElementById('univWA_Ortu').value : '',
        payment: document.getElementById('univPay') ? document.getElementById('univPay').value : 'KONFIRMASI_ADMIN',
        fileName: "Tanpa_Foto", 
        fileData: "",
        detail1: d1,
        detail2: d2,
        detail3: d3,
        detail4: d4,
        detail5: d5,
        maddah: maddahString
    };

    tempPayloadData.details = `Detail1: ${d1} | Detail2: ${d2} | Detail3: ${d3} | Detail4: ${d4} | Detail5: ${d5} | Maddah: ${maddahString || '-'}`;
    document.getElementById('demoProgName').innerText = currentActiveProgram;
    document.getElementById('universal-program-modal').style.display = 'none';
    document.getElementById('payment-demo-modal').style.display = 'flex';
}

function eksekusiPembayaranDanKirim() {
    const btn = document.getElementById('btnProsesBayar');
    btn.innerHTML = 'MEMVERIFIKASI SALDO QRIS... ⏳';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = 'MENGIRIM DATA KE DATABASE... 🚀';
        
        fetch(SCRIPT_URL_UTAMA, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(tempPayloadData)
        })
        .then(res => res.json())
        .then(hasil => {
            if(hasil.result === 'success') {
                document.getElementById('payment-demo-modal').style.display = 'none';
                document.getElementById('tiket-pendaftaran-modal').style.display = 'flex';
                playSuccessSound();

                if (tempPayloadData.niaUser === 'JALUR_LUGHOH') {
                    document.getElementById('tktNiaRow').style.display = 'none';
                } else {
                    document.getElementById('tktNiaRow').style.display = 'block';
                    document.getElementById('tktNiaValue').innerText = tempPayloadData.niaUser;
                }
                
                document.getElementById('tktProgValue').innerText = tempPayloadData.programName;
                let detail1 = document.getElementById('univDetail_1') ? document.getElementById('univDetail_1').value : '-';
                document.getElementById('tktDetailValue').innerText = (detail1 !== '-') ? detail1 : 'Biodata Penuh Tersimpan';

                const waText = encodeURIComponent(`Halo Admin Markaz,\nSaya telah mendaftar program pembelajaran baru & LUNAS melalui portal QRIS Demo.\n\nProgram: ${tempPayloadData.programName}\nNIA/Nama: ${tempPayloadData.niaUser} / ${tempPayloadData.namaLengkap}\nNo WA Aktif: ${tempPayloadData.waSiswa}\nStatus Foto: Menyusul.\n\nMohon dicek berkas pendaftaran saya, Syukron!`);
                document.getElementById('waTiketBtn').href = "https://wa.me/201551018457?text=" + waText;
                
                document.getElementById('universalDynamicForm').reset();
            } else { alert("Gagal verifikasi berkas server: " + hasil.error); }
        })
        .catch(err => { console.error(err); alert("Koneksi transmisi database terputus!"); })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = 'SAYA SUDAH BAYAR (SIMULASI) 🚀';
        });
    }, 1500); 
}

// --- 9. AUTO CAPSLOCK SAKTI UNIVERSAL ---
function applyUniversalCapslock() {
    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.removeEventListener('input', forceUpperAction);
        input.addEventListener('input', forceUpperAction);
    });
}
function forceUpperAction() { this.value = this.value.toUpperCase(); }

// --- 10. KRITIK SARAN KE WA ---
function kirimKritikWA() {
    const pesan = document.getElementById('pesanKritik').value;
    if(pesan.trim() === "") { alert("Isi pesannya dulu ya!"); return; }
    const waURL = "https://wa.me/201551018457?text=" + encodeURIComponent("HALO ADMIN, ada Masukan dari Website:\n\n\"" + pesan + "\"");
    window.open(waURL, '_blank');
    document.getElementById('pesanKritik').value = "";
}

// ... 11. TAALO AI SYSTEM ...
function sendTaaloV2Msg() {
    const inputField = document.getElementById('taaloV2Input');
    const userText = inputField.value.trim();
    if (userText === '') return;

    const chatBody = document.getElementById('taaloV2Body');
    chatBody.innerHTML += `<div style="align-self: flex-end; background: var(--accent-glow); padding: 10px 15px; border-radius: 12px 12px 0 12px; margin-bottom: 10px; color: white;">${userText}</div>`;
    inputField.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    const loadingId = 'taalo-mikir-' + Date.now();
    chatBody.innerHTML += `<div id="${loadingId}" style="align-self: flex-start; background: var(--bg-input); padding: 10px 15px; border-radius: 12px 12px 12px 0; margin-bottom: 10px; color: var(--text-dim); font-style: italic; border: 1px solid var(--border-line);">Memproses memori...</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;

    const scriptWebappURL = "https://script.google.com/macros/s/AKfycbyAANj0622a-tg0tGUqB_qhOIaFEhk9ORLyC3k4_lyKh3HNbO0WOfGVIPjZ8ZZZRQmlrQ/exec";

    fetch(`${scriptWebappURL}?action=chatTaalo&pesan=${encodeURIComponent(userText)}`, { method: 'GET', redirect: 'follow' })
    .then(res => res.json())
    .then(data => {
        document.getElementById(loadingId).remove(); 
        chatBody.innerHTML += `<div style="align-self: flex-start; background: var(--bg-input); padding: 10px 15px; border-radius: 12px 12px 12px 0; margin-bottom: 10px; color: var(--text-main); border: 1px solid var(--border-line);">${data.balasan}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    })
    .catch(err => {
        document.getElementById(loadingId).remove();
        chatBody.innerHTML += `<div style="align-self: flex-start; background: #7f1d1d; padding: 10px 15px; border-radius: 12px 12px 12px 0; margin-bottom: 10px; color: #fca5a5;">Waduh, koneksi otak Taalo lagi terputus nih cuy.</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}
     
// --- 12. EASTER EGG FLAPPY TAALO GAME SYSTEM ---
let logoClickCount = 0;
function triggerEasterEgg() {
    logoClickCount++;
    if(logoClickCount === 5) { logoClickCount = 0; document.getElementById('gameOverlay').style.display = 'flex'; initFlappyGame(); }
}
function closeGame() { document.getElementById('gameOverlay').style.display = 'none'; cancelAnimationFrame(gameLoopRef); }

let canvas, ctx, taaloY, taaloV, gravity, pipes, score, isGameOver, gameLoopRef;
let imgTerbang = new Image(); imgTerbang.src = 'aset/taalo-terbang.png';
let imgKejedot = new Image(); imgKejedot.src = 'aset/taalo-kejedot.png';

function initFlappyGame() {
    canvas = document.getElementById('flappyCanvas'); ctx = canvas.getContext('2d');
    taaloY = 200; taaloV = 0; gravity = 0.4; pipes = []; score = 0; isGameOver = false;
    window.addEventListener('keydown', (e) => { if(e.code === 'Space') jump(); });
    canvas.addEventListener('touchstart', jump); canvas.addEventListener('mousedown', jump);
    gameLoop();
}
function jump() { if(isGameOver) { initFlappyGame(); return; } taaloV = -6; }
function gameLoop() {
    if(isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "white"; ctx.font = "20px Poppins"; ctx.fillText("GAME OVER! Skor: " + score, 60, 240);
        return;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    taaloV += gravity; taaloY += taaloV;
    let currentImg = (taaloV > 5) ? imgKejedot : imgTerbang; 
    ctx.drawImage(currentImg, 50, taaloY, 35, 35);

    if(pipes.length === 0 || pipes[pipes.length-1].x < 150) {
        let pipeY = Math.random() * (canvas.height - 150) + 50; pipes.push({x: canvas.width, y: pipeY});
    }
    for(let i=0; i<pipes.length; i++) {
        let p = pipes[i]; p.x -= 3;
        ctx.fillStyle = "#0ea5e9"; 
        ctx.fillRect(p.x, 0, 40, p.y - 60); ctx.fillRect(p.x, p.y + 60, 40, canvas.height - p.y - 60);
        if(50+30 > p.x && 50 < p.x+40 && (taaloY < p.y-60 || taaloY+30 > p.y+60)) { isGameOver = true; playSuccessSound(); }
        if(p.x === 50) score++;
    }
    if(taaloY > canvas.height || taaloY < 0) isGameOver = true; 
    ctx.fillStyle = "white"; ctx.font = "20px Poppins"; ctx.fillText(score, 10, 30);
    gameLoopRef = requestAnimationFrame(gameLoop);
}

// --- 13. SYSTEM ONBOARDING TUTORIAL ---
let currentSlide = 1;
const totalSlides = 4;
function openTutorial() { document.getElementById('tutorial-modal').style.display = 'flex'; currentSlide = 1; updateTutorialUI(); }
function closeTutorial() { document.getElementById('tutorial-modal').style.display = 'none'; }
function changeSlide(direction) { currentSlide += direction; if(currentSlide > totalSlides) { closeTutorial(); return; } updateTutorialUI(); }
function updateTutorialUI() {
    for(let i=1; i<=totalSlides; i++) {
        document.getElementById('slide-'+i).classList.remove('active');
        document.getElementById('dot-'+i).classList.remove('active');
    }
    document.getElementById('slide-'+currentSlide).classList.add('active');
    document.getElementById('dot-'+currentSlide).classList.add('active');
    document.getElementById('btnPrevTutor').style.visibility = (currentSlide === 1) ? 'hidden' : 'visible';
    document.getElementById('btnNextTutor').innerText = (currentSlide === totalSlides) ? 'Selesai & Paham' : 'Lanjut';
}

// ==========================================
// FUNGSI LOGIN MURID MENUJU PORTAL
// ==========================================
function prosesLoginMurid(event) {
    event.preventDefault(); 
    const inputNia = document.getElementById('formNiaLogin').value; 
    const inputPassword = document.getElementById('formPasswordLogin').value; 
    
    // Pake SCRIPT_URL_UTAMA yang di atas buat manggil doGet
    const urlLogin = `${SCRIPT_URL_UTAMA}?action=loginMurid&nia=${encodeURIComponent(inputNia)}&password=${encodeURIComponent(inputPassword)}`;

    console.log("Sedang memverifikasi data...");

    fetch(urlLogin)
        .then(response => response.json())
        .then(hasil => {
            if (hasil.status === "sukses") {
                sessionStorage.setItem('namaMurid', hasil.nama);
                sessionStorage.setItem('niaMurid', inputNia);
                sessionStorage.setItem('programMurid', hasil.program);

                alert("Login Berhasil! Mengalihkan ke Ruang Murid...");
                window.location.href = 'portal.html';
            } else {
                alert("Login Gagal: " + hasil.pesan);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error jaringan. Server lagi sibuk atau URL Script salah!");
        });
} 

// ==========================================
// FUNGSI LOAD DATA UNTUK PAPAN I'LAN MUHIM
// ==========================================
function muatIlanPusat() {
    const containerIlan = document.getElementById('papan-ilan-pusat');
    
    fetch(`${SCRIPT_URL_UTAMA}?action=getPengumuman`)
    .then(res => res.json())
    .then(hasil => {
        if (hasil.status === "sukses" && hasil.data.length > 0) {
            containerIlan.innerHTML = ''; 
            hasil.data.forEach(ilan => {
                containerIlan.innerHTML += `
                    <div style="background-color: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-line); box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: 0.3s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px dashed var(--border-line); padding-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                            <h3 style="font-size: 15px; font-weight: 600; color: var(--text-main); letter-spacing: 0.5px;">${ilan.judul}</h3>
                            <span style="font-size: 11px; color: var(--text-main); background: var(--bg-input); padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border-line);">
                                <i class="fa-solid fa-calendar-day" style="color: var(--accent-glow);"></i> ${ilan.tanggal}
                            </span>
                        </div>
                        <p style="color: var(--text-dim); font-size: 13px; line-height: 1.6; white-space: pre-line;">${ilan.isi}</p>
                    </div>
                `;
            });
        } else {
            containerIlan.innerHTML = `<p style="color: var(--text-dim); font-size: 12px; font-style: italic;">Belum ada maklumat resmi atau pengumuman terbaru.</p>`;
        }
    })
    .catch(err => {
        console.error(err);
        containerIlan.innerHTML = `<p style="color: #ef4444; font-size: 12px;">Gagal menyinkronkan data I'lan Muhim.</p>`;
    });
}
 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then((reg) => console.log('Aplikasi At-Ta\'allum Berhasil Didaftarkan!', reg.scope))
        .catch((err) => console.log('Aplikasi Gagal Didaftarkan:', err));
    });
}

// SINKRONISASI PROGRAM DENGAN RUANG DIREKTUR
function muatDaftarProgramAktif() {
    const wadah = document.getElementById('wadahDaftarProgramMurid');
    if (!wadah) return;

    // Cek data dari server atau memori
    fetch(`${SCRIPT_URL_UTAMA}?action=getDataDirektur`)
    .then(res => res.json())
    .then(hasil => {
        if (hasil.status === "sukses" && Array.isArray(hasil.programs)) {
            localStorage.setItem('cacheProgramMarkaz', JSON.stringify(hasil.programs));
            renderProgramDiBeranda(hasil.programs);
        }
    })
    .catch(() => {
        const lokal = localStorage.getItem('cacheProgramMarkaz');
        if (lokal) renderProgramDiBeranda(JSON.parse(lokal));
    });
}

function renderProgramDiBeranda(listProgram) {
    const wadah = document.getElementById('wadahDaftarProgramMurid');
    if (!wadah) return;
    wadah.innerHTML = '';

    listProgram.forEach(prog => {
        if (prog.status === 'BUKA') {
            wadah.innerHTML += `
                <div class="program-item-row">
                    <div class="program-info"><span class="program-name">Program ${prog.nama}</span></div>
                    <button class="btn-daftar-prog" onclick="bukaFormPintar('${prog.nama.replace(/'/g, "\\'")}')">Daftar</button>
                </div>
            `;
        } else {
            wadah.innerHTML += `
                <div class="program-item-row" style="opacity: 0.5;">
                    <div class="program-info"><span class="program-name">Program ${prog.nama} (Ditutup)</span></div>
                    <button class="btn-daftar-prog" disabled style="background:#ef4444; color:white; cursor:not-allowed;">Tutup</button>
                </div>
            `;
        }
    });
}

// Panggil otomatis saat web dibuka
document.addEventListener('DOMContentLoaded', muatDaftarProgramAktif);
