// File: js/direktur.js

// Data Default 5 Program Markaz (Digunakan sebagai cadangan otomatis jika Sheet belum siap)
const DEFAULT_PROGRAMS = [
    { id: 'prog-1', nama: 'Private', status: 'BUKA', pendaftar: 0, terlaksana: 0, target: 12 },
    { id: 'prog-2', nama: 'Imtihan Qobul', status: 'BUKA', pendaftar: 0, terlaksana: 0, target: 12 },
    { id: 'prog-3', nama: "Musabaqoh 3 I'dadi", status: 'BUKA', pendaftar: 0, terlaksana: 0, target: 16 },
    { id: 'prog-4', nama: 'Musabaqoh 3 Tsanawi', status: 'BUKA', pendaftar: 0, terlaksana: 0, target: 16 },
    { id: 'prog-5', nama: 'Lughoh Azhary', status: 'BUKA', pendaftar: 0, terlaksana: 0, target: 20 }
];

let daftarProgram = [];

// 1. CEK PIN KEAMANAN DIREKTUR (MENGARAH KE SCRIPT_URL_KEAMANAN)
function cekKunciDirektur(event) {
    event.preventDefault();
    const inputPin = document.getElementById('pinDirektur').value;
    const btn = document.getElementById('btnLoginDir');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMERIKSA OTORISASI...';
    btn.disabled = true;

    fetch(`${SCRIPT_URL_KEAMANAN}?action=cekPinDirektur&pin=${encodeURIComponent(inputPin)}`)
    .then(res => res.json())
    .then(hasil => {
        if (hasil.status === "sukses") {
            sessionStorage.setItem('aksesDirektur', 'aktif');
            bukaDashboard();
        } else {
            alert("Akses Ditolak! " + (hasil.pesan || "PIN Direktur Salah."));
        }
    })
    .catch(err => {
        console.error(err);
        alert("Gagal menghubungi Server Keamanan. Pastikan action=cekPinDirektur sudah ada di Google Sheet Keamanan.");
    })
    .finally(() => {
        btn.innerHTML = 'BUKA MENARA PENGAWAS <i class="fa-solid fa-unlock-keyhole"></i>';
        btn.disabled = false;
    });
}

function bukaDashboard() {
    document.getElementById('login-gate').style.display = 'none';
    document.getElementById('direktur-panel').style.display = 'block';
    muatDataDirektur();
}

// Otomatis masuk jika Direktur belum tutup tab browser
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('aksesDirektur') === 'aktif') {
        bukaDashboard();
    }
});

// 2. MUAT DATA DARI SERVER UTAMA (SCRIPT_URL_UTAMA)
function muatDataDirektur() {
    const iconRefresh = document.getElementById('iconRefresh');
    const statusTeks = document.getElementById('statusSinkron');
    
    iconRefresh.classList.add('fa-spin');
    statusTeks.innerText = "Menarik data terbaru dari Google Sheet Utama...";

    fetch(`${SCRIPT_URL_UTAMA}?action=getDataDirektur`, { method: 'GET', redirect: 'follow' })
    .then(res => res.json())
    .then(hasil => {
        if (hasil.status === "sukses" && Array.isArray(hasil.programs)) {
            daftarProgram = hasil.programs;
            localStorage.setItem('cacheProgramMarkaz', JSON.stringify(daftarProgram));
            statusTeks.innerText = "Terhubung ke Server Pusat (Live)";
        } else {
            gunakanDataLokal();
        }
        renderUI();
    })
    .catch(err => {
        console.log("Menggunakan penyimpanan lokal sementara:", err);
        gunakanDataLokal();
        renderUI();
    })
    .finally(() => {
        iconRefresh.classList.remove('fa-spin');
    });
}

function gunakanDataLokal() {
    const tersimpan = localStorage.getItem('cacheProgramMarkaz');
    daftarProgram = tersimpan ? JSON.parse(tersimpan) : DEFAULT_PROGRAMS;
    document.getElementById('statusSinkron').innerText = "Mode Tersimpan Lokal (Siap Sinkron)";
}

// 3. TAMPILKAN KE LAYAR (RENDER KARTU & HITUNG RUMUS)
function renderUI() {
    const grid = document.getElementById('daftarProgramGrid');
    grid.innerHTML = '';

    let totalMuridGlobal = 0;
    let totalAktif = 0;
    let totalPersen = 0;

    daftarProgram.forEach((prog, index) => {
        const jmlPendaftar = parseInt(prog.pendaftar) || 0;
        const terlaksana = parseInt(prog.terlaksana) || 0;
        const target = parseInt(prog.target) || 12;
        
        // Rumus Persentase Progres (Maksimal 100%)
        let persen = Math.round((terlaksana / target) * 100);
        if (persen > 100) persen = 100;
        if (persen < 0) persen = 0;

        totalMuridGlobal += jmlPendaftar;
        if (prog.status === 'BUKA') totalAktif++;
        totalPersen += persen;

        const isBuka = prog.status === 'BUKA';

        grid.innerHTML += `
            <div class="prog-card ${isBuka ? '' : 'closed'}">
                <div>
                    <div class="prog-top">
                        <div class="prog-title">${prog.nama}</div>
                        <span class="badge-status ${isBuka ? 'buka' : 'tutup'}">
                            ${isBuka ? '● PENDAFTARAN BUKA' : '🔒 DITUTUP'}
                        </span>
                    </div>

                    <div class="prog-stats-box">
                        <span class="stat-label"><i class="fa-solid fa-user-check"></i> Murid Mendaftar</span>
                        <span class="stat-number">${jmlPendaftar} <small style="font-size:12px; font-weight:500;">Murid</small></span>
                    </div>

                    <div class="prog-progress-area">
                        <div class="progress-header">
                            <span>Progres Berjalan (${terlaksana}/${target} Pertemuan)</span>
                            <span style="color: var(--accent-glow);">${persen}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${persen}%;"></div>
                        </div>
                        <div class="progress-controls">
                            <button class="btn-step" onclick="ubahProgres(${index}, -1)">-1 Pertemuan</button>
                            <button class="btn-step" onclick="aturTargetManual(${index})">Ubah Target</button>
                            <button class="btn-step" onclick="ubahProgres(${index}, 1)">+1 Pertemuan</button>
                        </div>
                    </div>
                </div>

                <div class="prog-actions">
                    <button class="btn-toggle-status ${isBuka ? 'tutup-aksi' : 'buka-aksi'}" onclick="toggleStatusProgram(${index})">
                        <i class="fa-solid ${isBuka ? 'fa-lock' : 'fa-lock-open'}"></i> 
                        ${isBuka ? 'TUTUP PROGRAM' : 'BUKA KEMBALI'}
                    </button>
                    <button class="btn-delete-prog" onclick="hapusProgram(${index})" title="Hapus Program Permanen">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Update 3 Kotak KPI Atas
    document.getElementById('kpiTotalMurid').innerText = totalMuridGlobal;
    document.getElementById('kpiProgramAktif').innerText = `${totalAktif} / ${daftarProgram.length}`;
    const rataRata = daftarProgram.length > 0 ? Math.round(totalPersen / daftarProgram.length) : 0;
    document.getElementById('kpiRataProgres').innerText = `${rataRata}%`;
}

// 4. AKSI DIREKTUR: BUKA / TUTUP PROGRAM
function toggleStatusProgram(index) {
    const prog = daftarProgram[index];
    prog.status = (prog.status === 'BUKA') ? 'TUTUP' : 'BUKA';
    simpanPerubahanKeServer();
}

// 5. AKSI DIREKTUR: UPDATE PROGRES PERTEMUAN
function ubahProgres(index, perubahan) {
    const prog = daftarProgram[index];
    let nilaiBaru = (parseInt(prog.terlaksana) || 0) + perubahan;
    if (nilaiBaru < 0) nilaiBaru = 0;
    prog.terlaksana = nilaiBaru;
    simpanPerubahanKeServer();
}

function aturTargetManual(index) {
    const prog = daftarProgram[index];
    const input = prompt(`Masukkan target total pertemuan untuk ${prog.nama}:`, prog.target);
    if (input !== null && !isNaN(input) && parseInt(input) > 0) {
        prog.target = parseInt(input);
        simpanPerubahanKeServer();
    }
}

// 6. AKSI DIREKTUR: HAPUS PROGRAM
function hapusProgram(index) {
    const nama = daftarProgram[index].nama;
    if (confirm(`PERINGATAN DIREKTUR:\nApakah Anda yakin ingin MENGHAPUS program "${nama}" dari sistem?`)) {
        daftarProgram.splice(index, 1);
        simpanPerubahanKeServer();
    }
}

// 7. AKSI DIREKTUR: BUAT PROGRAM BARU
function bukaModalTambah() {
    document.getElementById('modalTambahProgram').style.display = 'flex';
}

function tutupModalTambah() {
    document.getElementById('modalTambahProgram').style.display = 'none';
}

function simpanProgramBaru(event) {
    event.preventDefault();
    const namaBaru = document.getElementById('inputNamaProg').value.trim();
    const targetBaru = parseInt(document.getElementById('inputTargetProg').value) || 12;
    const statusBaru = document.getElementById('inputStatusProg').value;

    daftarProgram.push({
        id: 'prog-' + Date.now(),
        nama: namaBaru,
        status: statusBaru,
        pendaftar: 0,
        terlaksana: 0,
        target: targetBaru
    });

    document.getElementById('inputNamaProg').value = '';
    tutupModalTambah();
    simpanPerubahanKeServer();
}

// 8. SINKRONKAN SEMUA PERUBAHAN KE SERVER & LOCALSTORAGE
function simpanPerubahanKeServer() {
    // Simpan lokal agar instan
    localStorage.setItem('cacheProgramMarkaz', JSON.stringify(daftarProgram));
    renderUI();

    const statusTeks = document.getElementById('statusSinkron');
    statusTeks.innerText = "Menyimpan perubahan ke Google Sheet...";

    fetch(SCRIPT_URL_UTAMA, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            formType: 'Update_Direktur',
            programs: daftarProgram
        })
    })
    .then(res => res.json())
    .then(hasil => {
        statusTeks.innerText = "Perubahan berhasil disimpan di Server Pusat ✅";
    })
    .catch(err => {
        statusTeks.innerText = "Tersimpan di perangkat (Menunggu koneksi server)";
    });
}
