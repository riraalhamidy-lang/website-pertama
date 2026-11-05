// Gembok berbasis Backend Google Sheet
function bukaKendali() {
    const inputPassword = document.getElementById('passAdmin').value;
    const tombol = document.querySelector('.btn-kunci');

    tombol.innerText = "MEMERIKSA...";
    tombol.disabled = true;

    // Bertanya ke Google Sheet: "Apakah password ini cocok dengan isi Sel B2?"
    fetch(`${SCRIPT_URL_KEAMANAN}?action=cekPasswordAdmin&password=${encodeURIComponent(inputPassword)}`)
    .then(res => res.json())
    .then(hasil => {
        if(hasil.status === "sukses") {
            document.getElementById('kunciAdmin').style.display = "none";
        } else {
            alert("Peringatan: " + hasil.pesan);
        }
    })
    .catch(err => alert("Hayo loh, siapa noh?"))
    .finally(() => { 
        tombol.innerText = "BUKA KENDALI"; 
        tombol.disabled = false; 
    });
}

// ... (Biarkan fungsi kirimPengumuman yang mengarah ke Sheet Utama tetap ada di bawah sini) ...