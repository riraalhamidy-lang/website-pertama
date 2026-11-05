// FUNGSI 1: CEK PIN PORTAL ADMIN (MENGGUNAKAN URL KEAMANAN)
function cekKunci() {
    const inputPin = document.getElementById('pinAdmin').value;
    const tombol = document.querySelector('#login-gate .btn-glow');

    tombol.innerHTML = 'MEMERIKSA...';
    tombol.disabled = true;

    // Bertanya ke Google Sheet Keamanan: "Apakah PIN ini benar?"
    fetch(`${SCRIPT_URL_KEAMANAN}?action=cekPinPortal&pin=${encodeURIComponent(inputPin)}`)
    .then(res => res.json())
    .then(hasil => {
        if(hasil.status === "sukses") {
            document.getElementById('login-gate').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
        } else {
            alert("Akses Ditolak! " + hasil.pesan);
        }
    })
    .catch(err => alert("Jaringan error, gagal menghubungi server keamanan!"))
    .finally(() => { 
        tombol.innerHTML = 'LOGIN KE SISTEM <i class="fa-solid fa-arrow-right"></i>'; 
        tombol.disabled = false; 
    });
}

// FUNGSI 2: CARI DATA SANTRI (MENGGUNAKAN URL UTAMA)
function cariData() {
    const keyword = document.getElementById('searchKeyword').value.trim();
    if(keyword === "") return;

    const btn = document.getElementById('btnCari');
    const box = document.getElementById('boxHasil');
    const area = document.getElementById('areaDaftarData');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    box.style.display = "none";

    // WAJIB PAKE redirect: 'follow' BIAR GAK ERROR CORS / TERPUTUS
    // Menggunakan SCRIPT_URL_UTAMA karena mencari data di database santri
    fetch(`${SCRIPT_URL_UTAMA}?action=cariSantri&nia=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        redirect: 'follow'
    })
    .then(res => res.json())
    .then(hasil => {
        if(hasil.status === "sukses") {
            document.getElementById('txtSumberTab').innerText = `DATA DARI: TAB ${hasil.tab}`;
            area.innerHTML = "";
            
            for (let key in hasil.data) {
                area.innerHTML += `
                    <div class="ticket-field">
                        <div class="ticket-label">${key}</div>
                        <div class="ticket-value">${hasil.data[key]}</div>
                    </div>
                `;
            }
            box.style.display = "block";
        } else {
            alert("Waduh: " + hasil.pesan);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Sistem Error: Koneksi ke server terputus.");
    })
    .finally(() => {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
        btn.disabled = false;
    });
}