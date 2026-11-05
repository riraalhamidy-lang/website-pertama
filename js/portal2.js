// 1. CEK OTORISASI SAAT HALAMAN DIBUKA
document.addEventListener('DOMContentLoaded', () => {
    const namaMurid = sessionStorage.getItem('namaMurid');
    if (namaMurid) {
        document.getElementById('login-overlay').style.display = 'none';
        muatDataDashboard();
        muatTemaTersimpan();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
});

// 2. FUNGSI LOGIN DARI PORTAL
function prosesLoginDiPortal(event) {
    event.preventDefault();
    const btn = document.getElementById('btnProsesLogin');
    btn.innerText = 'MEMVERIFIKASI...'; btn.disabled = true;

    const inputNia = document.getElementById('portalNiaLogin').value.toUpperCase();
    const inputPass = document.getElementById('portalPassLogin').value;

    fetch(`${SCRIPT_URL_UTAMA}?action=loginMurid&nia=${encodeURIComponent(inputNia)}&password=${encodeURIComponent(inputPass)}`)
    .then(res => res.json())
    .then(hasil => {
        if (hasil.status === "sukses") {
            sessionStorage.setItem('namaMurid', hasil.nama);
            sessionStorage.setItem('niaMurid', inputNia);
            sessionStorage.setItem('programMurid', hasil.program);
            
            const temaDB = hasil.tema || 'dark';
            localStorage.setItem('temaPortal', temaDB);

            if(hasil.foto && hasil.foto !== "") {
                sessionStorage.setItem('fotoMurid', hasil.foto);
            } else {
                sessionStorage.removeItem('fotoMurid'); 
            }

            document.getElementById('login-overlay').style.display = 'none';
            muatDataDashboard();
            muatTemaTersimpan();
        } else { alert("Gagal: " + hasil.pesan); }
    })
    .catch(err => { alert("Koneksi server gagal."); })
    .finally(() => { btn.innerText = 'BUKA PORTAL'; btn.disabled = false; });
}

// 3. MUAT DATA UI
function muatDataDashboard() {
    const nama = sessionStorage.getItem('namaMurid');
    const nia = sessionStorage.getItem('niaMurid');
    
    document.getElementById('portalNama').innerText = nama;
    document.getElementById('portalNiaUi').innerText = nia;
    document.getElementById('portalProgramUi').innerText = sessionStorage.getItem('programMurid');
    
    const fotoTersimpan = sessionStorage.getItem('fotoMurid');
    const urlInisial = fotoTersimpan ? fotoTersimpan : `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=D4AF37&color=0A2540&size=150&bold=true`;
    document.getElementById('portalAvatar').src = urlInisial;
    
    tarikDataNilai(nia);
    tarikDataAbsensi(nama); 
}

// =================================================================
// 🔥 LOGIKA CELESTIAL THEME BARU 🔥
// =================================================================
function toggleCelestialTheme() {
    const isLight = document.body.classList.contains('theme-light');
    const newTheme = isLight ? 'dark' : 'light';
    
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.setValueAtTime(isLight ? 400 : 800, ctx.currentTime);
        osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}

    terapkanTema(newTheme);
}

function terapkanTema(namaTema) {
    if (namaTema === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
    localStorage.setItem('temaPortal', namaTema);

    // Simpan otomatis ke Google Sheets biar nempel di akun!
    const nia = sessionStorage.getItem('niaMurid');
    if (nia) {
        fetch(`${SCRIPT_URL_UTAMA}?action=updateTema&nia=${encodeURIComponent(nia)}&tema=${encodeURIComponent(namaTema)}`)
        .catch(error => console.log("Delay simpan tema ke server."));
    }
}

function muatTemaTersimpan() {
    const savedTheme = localStorage.getItem('temaPortal') || 'dark';
    terapkanTema(savedTheme);
}

// =================================================================
// SISA FUNGSI CROPPER, KALENDER, & GAME TIC-TAC-TOE
// =================================================================
let cropper; 

function siapkanCrop(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Maksimal 5MB komandan!"); event.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageElement = document.getElementById('imageToCrop');
        imageElement.src = e.target.result;
        document.getElementById('cropModal').style.display = 'flex';
        if(cropper) { cropper.destroy(); }
        cropper = new Cropper(imageElement, { aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 0.8, cropBoxMovable: true, cropBoxResizable: true, background: false });
    };
    reader.readAsDataURL(file);
}

function tutupCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    if(cropper) cropper.destroy();
    document.getElementById('inputFoto').value = '';
}

function prosesCropDanUpload() {
    if (!cropper) return;
    const statusTeks = document.getElementById('statusUpload');
    statusTeks.innerText = "Mengolah foto... 🚀"; statusTeks.style.color = "var(--accent-glow)"; 

    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    tutupCropModal();

    const CLOUD_NAME = "ddxq4gdpb"; 
    const UPLOAD_PRESET = "markaz_foto"; 
    const niaAktif = sessionStorage.getItem('niaMurid');

    const formData = new FormData();
    formData.append("file", base64Image); 
    formData.append("upload_preset", UPLOAD_PRESET);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.secure_url) {
            const linkFotoBaru = data.secure_url; 
            document.getElementById('portalAvatar').src = linkFotoBaru;
            sessionStorage.setItem('fotoMurid', linkFotoBaru); 
            statusTeks.innerText = "Selesai! Update ke sistem... 📡";
            
            fetch(`${SCRIPT_URL_UTAMA}?action=updateFoto&nia=${niaAktif}&urlFoto=${encodeURIComponent(linkFotoBaru)}`)
            .then(res => res.json())
            .then(hasil => {
                if(hasil.status === "sukses") {
                    statusTeks.innerText = "Foto tersimpan permanen! ✅"; statusTeks.style.color = "var(--success)"; 
                    setTimeout(() => { statusTeks.innerText = ""; }, 3000); 
                }
            }).catch(err => { statusTeks.innerText = "Terganti, gagal lapor server! ⚠️"; statusTeks.style.color = "#ef4444"; });
        } else { statusTeks.innerText = "Gagal upload Cloudinary!"; statusTeks.style.color = "#ef4444"; }
    }).catch(error => { statusTeks.innerText = "Koneksi terputus bray!"; statusTeks.style.color = "#ef4444"; });
}

function tarikDataAbsensi(namaMurid) {
    const grid = document.getElementById('calendarGrid');
    const icon = document.getElementById('iconStatusAbsen');
    grid.innerHTML = '<div style="grid-column: span 7; text-align: center; font-size: 12px; padding: 20px 0; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Kalender...</div>';
    
    fetch(`${SCRIPT_URL_UTAMA}?action=getAbsensi&nama=${encodeURIComponent(namaMurid)}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "sukses") {
            grid.innerHTML = ''; 
            const totalHari = 30; 
            let tglHadir = data.dates || []; 
            
            for(let i = 1; i <= totalHari; i++) {
                let box = document.createElement('div');
                box.className = 'day-box'; box.innerText = i;
                if(tglHadir.includes(i)) box.classList.add('hadir');
                grid.appendChild(box);
            }
            document.getElementById('absentPresent').innerText = data.hadir;
            let alfa = totalHari - data.hadir;
            document.getElementById('absentBad').innerText = alfa < 0 ? 0 : alfa;
            icon.style.color = 'var(--accent-glow)';
        }
    })
    .catch(err => { grid.innerHTML = '<div style="grid-column: span 7; text-align: center; color: #ef4444; font-size: 12px;">Gagal memuat kalender</div>'; icon.style.color = '#ef4444'; });
}

function tarikDataNilai(niaMurid) {
    fetch(`${SCRIPT_URL_UTAMA}?action=getNilai&nia=${encodeURIComponent(niaMurid)}`)
    .then(response => response.json())
    .then(data => {
        const iconStatus = document.getElementById('iconStatusRapor');
        if (data.status === "sukses") {
            document.getElementById('nilaiFiqih').innerText = data.fiqih !== "" ? data.fiqih : "-";
            document.getElementById('nilaiTauhid').innerText = data.tauhid !== "" ? data.tauhid : "-";
            document.getElementById('nilaiTafsir').innerText = data.tafsir !== "" ? data.tafsir : "-";
            document.getElementById('nilaiHadist').innerText = data.hadist !== "" ? data.hadist : "-";
            document.getElementById('nilaiSiroh').innerText = data.siroh !== "" ? data.siroh : "-";
            document.getElementById('nilaiNahwu').innerText = data.nahwu !== "" ? data.nahwu : "-";
            iconStatus.style.color = 'var(--accent-glow)'; iconStatus.className = 'fa-solid fa-check-double';
        } else {
            document.querySelectorAll('.score').forEach(el => el.innerText = "-");
            iconStatus.style.color = 'var(--text-dim)'; iconStatus.className = 'fa-solid fa-clock-rotate-left';
        }
    })
    .catch(error => { document.querySelectorAll('.score').forEach(el => el.innerText = "Err"); document.getElementById('iconStatusRapor').style.color = '#ef4444'; document.getElementById('iconStatusRapor').className = 'fa-solid fa-triangle-exclamation'; });
}

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; let gameActive = true;

function makeMove(index) {
    if (board[index] !== '' || !gameActive) return;
    board[index] = currentPlayer;
    document.querySelectorAll('.game-cell')[index].innerText = currentPlayer;
    
    if (checkWin()) {
        document.getElementById('gameStatus').innerText = `Pemenang: ${currentPlayer}! 🎉`; gameActive = false;
    } else if (!board.includes('')) {
        document.getElementById('gameStatus').innerText = "Seri! 🤝"; gameActive = false;
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('gameStatus').innerText = `Giliran: ${currentPlayer}`;
    }
}

function checkWin() {
    const winCond = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    return winCond.some(c => board[c[0]] && board[c[0]] === board[c[1]] && board[c[0]] === board[c[2]]);
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', '']; currentPlayer = 'X'; gameActive = true;
    document.getElementById('gameStatus').innerText = `Giliran: X`;
    document.querySelectorAll('.game-cell').forEach(c => c.innerText = '');
}

function logOutMurid() { sessionStorage.clear(); window.location.reload(); }
