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
let isSignUpMode = false;

// --- GESTION DES NOTIFICATIONS ---
function showToast(text) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = text;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// --- OUVERTURE / FERMETURE MODALS (BRANCHEMENT DES CLICS) ---
const ouvrirModal = (id) => document.getElementById(id).style.display = 'flex';
const fermerModals = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

document.getElementById('btnOuvrirCompte').onclick = () => ouvrirModal('authModal');
document.getElementById('btnOuvrirVendre').onclick = () => ouvrirModal('modalForm');
document.getElementById('btnMessagerie').onclick = () => ouvrirModal('listChatsModal');
document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = fermerModals);

// --- GESTION PHOTO ---
document.getElementById('btnChoisirPhoto').onclick = () => document.getElementById('imgInput').click();
document.getElementById('imgInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        base64Image = reader.result;
        document.getElementById('preview').innerHTML = `<img src="${base64Image}" style="width:80px; margin-top:10px; border-radius:10px">`;
    };
    reader.readAsDataURL(e.target.files[0]);
};

// --- AUTHENTIFICATION ---
document.getElementById('btnSwitchAuth').onclick = () => {
    isSignUpMode = !isSignUpMode;
    document.getElementById('modalTitle').innerText = isSignUpMode ? "Inscription" : "Connexion";
    document.getElementById('btnSwitchAuth').innerText = isSignUpMode ? "Se connecter" : "S'inscrire";
};

document.getElementById('mainAuthBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isSignUpMode) await auth.createUserWithEmailAndPassword(email, pass);
        else await auth.signInWithEmailAndPassword(email, pass);
        showToast("✨ Connecté !");
        fermerModals();
    } catch (e) { showToast("❌ " + e.message); }
};

// --- PUBLICATION ---
document.getElementById('btnPublier').onclick = async () => {
    const user = auth.currentUser;
    if(!user) return ouvrirModal('authModal');
    const nom = document.getElementById('nomPiece').value;
    const prix = document.getElementById('prixPiece').value;
    const cat = document.getElementById('catPiece').value;

    if(!nom || !prix || !base64Image) return showToast("⚠️ Infos manquantes");

    await db.collection("annonces").add({
        nom, prix, cat, image: base64Image,
        sellerId: user.uid, sellerEmail: user.email, date: new Date()
    });
    showToast("✅ Annonce publiée !");
    fermerModals();
};

// --- AFFICHAGE DES ANNONCES (GRILLE CLIQUEABLE) ---
db.collection("annonces").orderBy("date", "desc").onSnapshot(snap => {
    const cont = document.getElementById('piecesContainer');
    cont.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${p.image}" class="card-img">
            <div class="card-info">
                <span class="card-price">${p.prix} GNF</span>
                <h3>${p.nom}</h3>
                <button class="btn-chat-card">Discuter</button>
            </div>`;
        // Action du bouton Discuter
        card.querySelector('.btn-chat-card').onclick = () => ouvrirChat(doc.id, p.sellerId, p.nom);
        cont.appendChild(card);
    });
});
