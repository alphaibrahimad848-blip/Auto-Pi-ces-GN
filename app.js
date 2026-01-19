// CONFIGURATION FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCuNdiMuuQVSFw3NKuL-s-IOSaqvTSllWI",
  authDomain: "auto-pieces-gn.firebaseapp.com",
  projectId: "auto-pieces-gn",
  storageBucket: "auto-pieces-gn.firebasestorage.app",
  messagingSenderId: "471872126095",
  appId: "1:471872126095:web:ad98357f526ac0a3d604fa"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let base64Image = "";

// PRÉVISUALISATION PHOTO
document.getElementById('imgInput').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        base64Image = reader.result;
        document.getElementById('preview').innerHTML = `<img src="${base64Image}">`;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// PUBLIER L'ANNONCE
document.getElementById('btnPublier').onclick = async () => {
    const nom = document.getElementById('nomPiece').value;
    const prix = document.getElementById('prixPiece').value;
    const cat = document.getElementById('catPiece').value;

    if(!nom || !prix || !base64Image) return alert("Complétez tous les champs !");

    try {
        await db.collection("annonces").add({
            nom, prix, cat, image: base64Image, date: new Date()
        });
        alert("Annonce publiée !");
        fermerModals();
    } catch(e) { alert("Erreur: " + e.message); }
};

// AFFICHER LES ANNONCES
db.collection("annonces").orderBy("date", "desc").onSnapshot(snap => {
    const container = document.getElementById('piecesContainer');
    container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `
            <div class="card">
                <img src="${p.image}" class="card-img">
                <div class="card-content">
                    <h3>${p.nom}</h3>
                    <p class="price">${p.prix} GNF</p>
                    <button class="btn-chat" onclick="window.open('https://wa.me/224XXXXXXXXX')">💬 WhatsApp</button>
                    <button class="btn-vendu" onclick="supprimer('${doc.id}')">MARQUER COMME VENDU</button>
                </div>
            </div>`;
    });
});

// MARQUER COMME VENDU (Suppression)
window.supprimer = async (id) => {
    if(confirm("Supprimer cette annonce ?")) {
        await db.collection("annonces").doc(id).delete();
    }
};

// UI FUNCTIONS
window.ouvrirModal = (id) => document.getElementById(id).style.display = 'flex';
window.fermerModals = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
