// 1. CEK OTORISASI SAAT HALAMAN DIBUKA
document.addEventListener('DOMContentLoaded', () => {
    const namaMurid = sessionStorage.getItem('namaMurid');
    if (namaMurid) {
        document.getElementById('login-overlay').style.display = 'none';
        muatDataDashboard();
        terapkanTemaTersimpan();
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
            terapkanTemaTersimpan();
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
    const urlInisial = fotoTersimpan ? fotoTersimpan : `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=random&color=fff&size=150&bold=true`;
    document.getElementById('portalAvatar').src = urlInisial;
    
    tarikDataNilai(nia);
    tarikDataAbsensi(nama); 
}

// =================================================================
// 🔥 FITUR DEWA V2: CROPPER.JS + CLOUDINARY 🔥
// =================================================================
let cropper; // Variabel nyimpen mesin pemotong

// A. Pas milih foto dari galeri
function siapkanCrop(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Maksimal 5MB biar HP gak ngelag pas nge-crop
    if (file.size > 5 * 1024 * 1024) {
        alert("Buset! Foto lu kegedean bray, maksimal 5MB aja yak!");
        event.target.value = ''; // Reset input
        return;
    }

    // Baca foto jadi preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageElement = document.getElementById('imageToCrop');
        imageElement.src = e.target.result;
        
        // Munculin Layar Modal Crop
        document.getElementById('cropModal').style.display = 'flex';

        // Bersihin cropper lama kalau ada
        if(cropper) { cropper.destroy(); }

        // Nyalain mesin pemotong dengan rasio 1:1 (Persegi/Kotak)
        cropper = new Cropper(imageElement, {
            aspectRatio: 1, 
            viewMode: 1, // Biar foto gak keluar batas
            dragMode: 'move',
            autoCropArea: 0.8, // Ukuran kotak potong 80% dari layar
            cropBoxMovable: true,
            cropBoxResizable: true,
            background: false
        });
    };
    reader.readAsDataURL(file);
}

// B. Kalau murid batalin crop
function tutupCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    if(cropper) cropper.destroy();
    document.getElementById('inputFoto').value = ''; // Reset file input
}

// C. Pas tombol "Crop & Upload" diklik!
function prosesCropDanUpload() {
    if (!cropper) return;

    const statusTeks = document.getElementById('statusUpload');
    statusTeks.innerText = "Lagi nge-crop & terbang ke Cloudinary... 🚀";
    statusTeks.style.color = "#f59e0b"; 

    // 1. Ambil hasil potongannya (Resolusi dipatok 400x400 biar ringan tapi HD)
    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    
    // Ubah potongan foto jadi kode Base64 (Format JPG biar enteng)
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    // 2. Tutup layar crop
    tutupCropModal();

    // 3. Kirim ke Cloudinary
    const CLOUD_NAME = "ddxq4gdpb"; 
    const UPLOAD_PRESET = "markaz_foto"; 
    const niaAktif = sessionStorage.getItem('niaMurid');

    const formData = new FormData();
    formData.append("file", base64Image); // Kirim hasil crop
    formData.append("upload_preset", UPLOAD_PRESET);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { 
        method: 'POST', 
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        if (data.secure_url) {
            const linkFotoBaru = data.secure_url; 
            document.getElementById('portalAvatar').src = linkFotoBaru; // Tampil di layar
            sessionStorage.setItem('fotoMurid', linkFotoBaru); // Simpan di memori
            
            statusTeks.innerText = "Cloudinary Sukses! Lapor admin... 📡";
            statusTeks.style.color = "#3b82f6"; 

            // 4. Lapor link foto baru ke GS
            const urlUpdateGS = `${SCRIPT_URL_UTAMA}?action=updateFoto&nia=${niaAktif}&urlFoto=${encodeURIComponent(linkFotoBaru)}`;
            fetch(urlUpdateGS)
            .then(res => res.json())
            .then(hasil => {
                if(hasil.status === "sukses") {
                    statusTeks.innerText = "Sempurna! Foto tersimpan permanen! ✅";
                    statusTeks.style.color = "#10b981"; 
                    setTimeout(() => { statusTeks.innerText = ""; }, 3000); 
                }
            })
            .catch(err => {
                console.error("Gagal lapor GS:", err);
                statusTeks.innerText = "Terganti, tapi gagal lapor admin! ⚠️";
                statusTeks.style.color = "#ef4444";
            });
            
        } else {
            statusTeks.innerText = "Gagal upload Cloudinary!";
            statusTeks.style.color = "#ef4444";
        }
    })
    .catch(error => {
        console.error("Error Cloudinary:", error);
        statusTeks.innerText = "Koneksi terputus bray!";
        statusTeks.style.color = "#ef4444";
    });
}

// =================================================================
// SISA FUNGSI (ABSENSI, NILAI, TEMA, GAME) TETAP SAMA KAYA SEBELUMNYA
// =================================================================
function tarikDataAbsensi(namaMurid) {
    const grid = document.getElementById('calendarGrid');
    const icon = document.getElementById('iconStatusAbsen');
    grid.innerHTML = '<div style="grid-column: span 7; text-align: center; font-size: 12px; padding: 20px 0; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin"></i> Menyinkronkan kalender...</div>';
    
    fetch(`${SCRIPT_URL_UTAMA}?action=getAbsensi&nama=${encodeURIComponent(namaMurid)}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "sukses") {
            grid.innerHTML = ''; 
            const totalHari = 30; 
            let tglHadir = data.dates || []; 
            
            for(let i = 1; i <= totalHari; i++) {
                let box = document.createElement('div');
                box.className = 'day-box';
                box.innerText = i;
                if(tglHadir.includes(i)) box.classList.add('hadir');
                grid.appendChild(box);
            }

            document.getElementById('absentPresent').innerText = data.hadir;
            let alfa = totalHari - data.hadir;
            document.getElementById('absentBad').innerText = alfa < 0 ? 0 : alfa;
            icon.style.color = '#10b981';
        }
    })
    .catch(err => {
        grid.innerHTML = '<div style="grid-column: span 7; text-align: center; color: #ef4444; font-size: 12px;">Gagal memuat data</div>';
        icon.style.color = '#ef4444';
    });
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
            iconStatus.style.color = '#10b981'; iconStatus.className = 'fa-solid fa-check-double';
        } else {
            document.querySelectorAll('.score').forEach(el => el.innerText = "-");
            iconStatus.style.color = '#f59e0b'; iconStatus.className = 'fa-solid fa-clock-rotate-left';
        }
    })
    .catch(error => {
        document.querySelectorAll('.score').forEach(el => el.innerText = "Err");
        document.getElementById('iconStatusRapor').style.color = '#ef4444'; 
        document.getElementById('iconStatusRapor').className = 'fa-solid fa-triangle-exclamation';
    });
}

function terapkanTemaTersimpan() {
    const savedTheme = localStorage.getItem('temaPortal') || 'dark';
    document.getElementById('themeSelector').value = savedTheme;
    ubahTema(savedTheme, false);
}

function ubahTema(namaTema, isSimpanKeServer = true) {
    document.body.className = '';
    if (namaTema !== 'dark') document.body.classList.add(`theme-${namaTema}`);
    localStorage.setItem('temaPortal', namaTema);

    if (isSimpanKeServer && sessionStorage.getItem('niaMurid')) {
        const nia = sessionStorage.getItem('niaMurid');
        fetch(`${SCRIPT_URL_UTAMA}?action=updateTema&nia=${encodeURIComponent(nia)}&tema=${encodeURIComponent(namaTema)}`)
        .then(response => response.json()).catch(error => console.log("Koneksi save tema delay."));
    }
}

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

function makeMove(index) {
    if (board[index] !== '' || !gameActive) return;
    board[index] = currentPlayer;
    document.querySelectorAll('.game-cell')[index].innerText = currentPlayer;
    
    if (checkWin()) {
        document.getElementById('gameStatus').innerText = `Pemenang: ${currentPlayer}! 🎉`;
        gameActive = false;
    } else if (!board.includes('')) {
        document.getElementById('gameStatus').innerText = "Seri! 🤝";
        gameActive = false;
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
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X'; gameActive = true;
    document.getElementById('gameStatus').innerText = `Giliran: X`;
    document.querySelectorAll('.game-cell').forEach(c => c.innerText = '');
}

function logOutMurid() {
    sessionStorage.clear();
    window.location.reload();
}
