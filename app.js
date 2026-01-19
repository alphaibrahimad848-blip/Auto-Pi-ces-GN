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
let currentChatId = "";

// --- GESTION UTILISATEUR ---
function basculerAuth() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('modalTitle').innerText = isSignUpMode ? "Inscription" : "Connexion";
    document.getElementById('toggleText').innerText = isSignUpMode ? "Déjà un compte ?" : "Pas de compte ?";
    document.querySelector('.link-blue').innerText = isSignUpMode ? "Se connecter" : "S'inscrire";
}

document.getElementById('mainAuthBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(!email || !pass) return alert("Remplissez les champs");

    try {
        if (isSignUpMode) {
            await auth.createUserWithEmailAndPassword(email, pass);
            alert("Compte créé avec succès !");
        } else {
            await auth.signInWithEmailAndPassword(email, pass);
        }
        fermerModals();
    } catch (e) { alert(e.message); }
};

auth.onAuthStateChanged(user => {
    const status = document.getElementById('authStatus');
    if(user) status.innerText = "Connecté en tant que : " + user.email;
    else status.innerText = "Vous n'êtes pas connecté.";
});

// --- GESTION IMAGE ---
document.getElementById('imgInput').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        base64Image = reader.result;
        document.getElementById('preview').innerHTML = `<img src="${base64Image}">`;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// --- PUBLICATION ---
document.getElementById('btnPublier').onclick = async () => {
    const user = auth.currentUser;
    if(!user) return ouvrirModal('authModal');
    
    const nom = document.getElementById('nomPiece').value;
    const prix = document.getElementById('prixPiece').value;
    const cat = document.getElementById('catPiece').value;

    if(!nom || !prix || !base64Image) return alert("Infos manquantes !");

    await db.collection("annonces").add({
        nom, prix, cat, image: base64Image,
        sellerId: user.uid, sellerEmail: user.email, date: new Date()
    });
    alert("Annonce publiée !");
    fermerModals();
};

// --- CHAT INTERNE ---
window.ouvrirChat = (annonceId, sellerId, nomPiece) => {
    const user = auth.currentUser;
    if(!user) return ouvrirModal('authModal');
    if(user.uid === sellerId) return alert("C'est votre annonce");

    // Création d'un ID de chat unique entre ces deux personnes pour cette pièce
    currentChatId = [user.uid, sellerId, annonceId].sort().join('_');
    document.getElementById('chatTitle').innerText = "Discuter pour : " + nomPiece;
    ouvrirModal('chatModal');

    // Écoute des messages en temps réel
    db.collection("chats").doc(currentChatId).collection("messages").orderBy("date")
    .onSnapshot(snap => {
        const cont = document.getElementById('messagesContainer');
        cont.innerHTML = "";
        snap.forEach(doc => {
            const m = doc.data();
            const side = m.senderId === user.uid ? 'right' : 'left';
            cont.innerHTML += `<div class="msg ${side}">${m.text}</div>`;
        });
        cont.scrollTop = cont.scrollHeight;
    });
};

document.getElementById('btnSend').onclick = async () => {
    const text = document.getElementById('chatInput').value;
    if(!text || !currentChatId) return;

    await db.collection("chats").doc(currentChatId).collection("messages").add({
        text, senderId: auth.currentUser.uid, senderEmail: auth.currentUser.email, date: new Date()
    });
    document.getElementById('chatInput').value = "";
};

// --- AFFICHAGE ---
db.collection("annonces").orderBy("date", "desc").onSnapshot(snap => {
    const container = document.getElementById('piecesContainer');
    container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        const isOwner = auth.currentUser && auth.currentUser.uid === p.sellerId;
        container.innerHTML += `
            <div class="card">
                <img src="${p.image}" class="card-img">
                <div class="card-content">
                    <h3>${p.nom}</h3>
                    <p class="price">${p.prix} GNF</p>
                    <button class="btn-chat" onclick="ouvrirChat('${doc.id}', '${p.sellerId}', '${p.nom}')">💬 Discuter</button>
                    ${isOwner ? `<button class="btn-vendu" onclick="supprimer('${doc.id}')">VENDU (Supprimer)</button>` : ''}
                </div>
            </div>`;
    });
});

window.supprimer = async (id) => {
    if(confirm("Supprimer l'annonce ?")) await db.collection("annonces").doc(id).delete();
};

window.ouvrirModal = (id) => document.getElementById(id).style.display = 'flex';
window.fermerModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    currentChatId = ""; // Reset chat quand on ferme
};
