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

// --- NOTIFICATIONS MODERNES ---
function showToast(text) {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerText = text;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// --- AFFICHAGE EN GRILLE ---
db.collection("annonces").orderBy("date", "desc").onSnapshot(snap => {
    const cont = document.getElementById('piecesContainer');
    cont.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        cont.innerHTML += `
            <div class="card">
                <img src="${p.image}" class="card-img">
                <div class="card-info">
                    <span class="card-price">${p.prix} GNF</span>
                    <h3>${p.nom}</h3>
                    <button class="btn-chat-card" onclick="ouvrirChat('${doc.id}','${p.sellerId}','${p.nom}')">Discuter</button>
                </div>
            </div>`;
    });
});

// --- ACTIONS AVEC TOAST ---
document.getElementById('btnPublier').onclick = async () => {
    const user = auth.currentUser;
    if(!user) return showToast("Connectez-vous pour vendre !");
    
    const nom = document.getElementById('nomPiece').value;
    const prix = document.getElementById('prixPiece').value;
    if(!nom || !prix || !base64Image) return showToast("Veuillez remplir tous les champs.");

    await db.collection("annonces").add({
        nom, prix, image: base64Image, sellerId: user.uid, sellerEmail: user.email, date: new Date()
    });
    showToast("✅ Votre annonce est en ligne !");
    fermerModals();
};

// ... (Garder les fonctions basculerAuth, ouvrirChat, etc. du message précédent)
