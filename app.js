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

// --- SYSTÈME DE NOTIFICATION MODERNE ---
function toast(msg) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// --- AUTHENTIFICATION ---
function basculerAuth() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('modalTitle').innerText = isSignUpMode ? "Inscription" : "Connexion";
}

document.getElementById('mainAuthBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isSignUpMode) await auth.createUserWithEmailAndPassword(email, pass);
        else await auth.signInWithEmailAndPassword(email, pass);
        toast("✨ Succès !");
        fermerModals();
    } catch (e) { toast("❌ " + e.message); }
};

// --- PUBLICATION ---
document.getElementById('imgInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => { base64Image = reader.result; document.getElementById('preview').innerHTML = `<img src="${base64Image}" style="width:50px;border-radius:5px">`; };
    reader.readAsDataURL(e.target.files[0]);
};

document.getElementById('btnPublier').onclick = async () => {
    const user = auth.currentUser;
    if(!user) return ouvrirModal('authModal');
    const nom = document.getElementById('nomPiece').value;
    const prix = document.getElementById('prixPiece').value;
    if(!nom || !prix || !base64Image) return toast("⚠️ Remplissez tout !");

    await db.collection("annonces").add({
        nom, prix, image: base64Image, sellerId: user.uid, sellerEmail: user.email, date: new Date()
    });
    toast("✅ Annonce publiée !");
    fermerModals();
};

// --- GESTION DU CHAT ---
window.ouvrirChat = (annonceId, sellerId, nom) => {
    if(!auth.currentUser) return ouvrirModal('authModal');
    if(auth.currentUser.uid === sellerId) return toast("C'est votre annonce !");
    
    currentChatId = [auth.currentUser.uid, sellerId, annonceId].sort().join('_');
    document.getElementById('chatTitle').innerText = nom;
    ouvrirModal('chatModal');
    ecouterMessages();
};

function ecouterMessages() {
    db.collection("chats").doc(currentChatId).collection("messages").orderBy("date")
    .onSnapshot(snap => {
        const cont = document.getElementById('messagesContainer');
        cont.innerHTML = "";
        snap.forEach(doc => {
            const m = doc.data();
            const side = m.senderId === auth.currentUser.uid ? 'right' : 'left';
            cont.innerHTML += `<div class="msg ${side}">${m.text}</div>`;
        });
        cont.scrollTop = cont.scrollHeight;
    });
}

document.getElementById('btnSend').onclick = async () => {
    const text = document.getElementById('chatInput').value;
    if(!text) return;
    await db.collection("chats").doc(currentChatId).collection("messages").add({
        text, senderId: auth.currentUser.uid, date: new Date()
    });
    document.getElementById('chatInput').value = "";
};

// --- CENTRE DE MESSAGES ---
auth.onAuthStateChanged(user => {
    if(user) {
        db.collection("chats").onSnapshot(snap => {
            const list = document.getElementById('listChatsContainer');
            const badge = document.getElementById('msgBadge');
            list.innerHTML = "";
            let hasMsg = false;
            snap.forEach(doc => {
                if(doc.id.includes(user.uid)) {
                    hasMsg = true;
                    list.innerHTML += `<div class="chat-item" onclick="ouvrirChatDepuisListe('${doc.id}')">💬 Discussion active</div>`;
                }
            });
            badge.style.display = hasMsg ? 'block' : 'none';
        });
    }
});

window.ouvrirChatDepuisListe = (id) => { currentChatId = id; ouvrirModal('chatModal'); ecouterMessages(); };

// --- AFFICHAGE ANNONCES ---
db.collection("annonces").orderBy("date", "desc").onSnapshot(snap => {
    const cont = document.getElementById('piecesContainer');
    cont.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        cont.innerHTML += `
            <div class="card">
                <img src="${p.image}" class="card-img">
                <div class="card-content">
                    <p class="price">${p.prix} GNF</p>
                    <h3>${p.nom}</h3>
                    <button class="btn-submit" onclick="ouvrirChat('${doc.id}','${p.sellerId}','${p.nom}')">Discuter</button>
                </div>
            </div>`;
    });
});

window.ouvrirModal = (id) => document.getElementById(id).style.display = 'flex';
window.fermerModals = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
