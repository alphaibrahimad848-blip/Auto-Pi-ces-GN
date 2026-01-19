import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXAy63dWnzyj_uubs9FxK-tSBLR7Cef78",
  authDomain: "autopiecesguinee.firebaseapp.com",
  projectId: "autopiecesguinee",
  storageBucket: "autopiecesguinee.firebasestorage.app",
  messagingSenderId: "569278363345",
  appId: "1:569278363345:web:132ed40ab3c2fcb7e437f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// --- GESTION DES MODALS ---
window.ouvrirAuth = () => document.getElementById('authModal').style.display = "block";
window.fermerModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
};
window.basculerAuth = () => {
    const t = document.getElementById('authTitle');
    t.innerText = t.innerText === "Créer un compte" ? "Connexion" : "Créer un compte";
};

// --- AUTHENTIFICATION ---
document.getElementById('authSubmit').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pwd = document.getElementById('authPwd').value;
    try {
        if(document.getElementById('authTitle').innerText === "Créer un compte") {
            await createUserWithEmailAndPassword(auth, email, pwd);
        } else {
            await signInWithEmailAndPassword(auth, email, pwd);
        }
        fermerModals();
    } catch (e) { alert("Erreur : Vérifiez vos identifiants"); }
};

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const status = document.getElementById('authStatus');
    if(user) {
        status.innerHTML = `<button onclick="auth.signOut()" class="small-btn" style="background:#334155">Déconnexion</button>`;
    } else {
        status.innerHTML = `<button onclick="ouvrirAuth()" class="small-btn">Connexion</button>`;
    }
    chargerPieces();
});

// --- CHAT EN DIRECT ---
window.ouvrirChat = (pieceId, nomPiece) => {
    if(!currentUser) return ouvrirAuth();
    document.getElementById('chatModal').style.display = "block";
    document.getElementById('chatHeader').innerText = nomPiece;
    
    const q = query(collection(db, "chats"), where("pieceId", "==", pieceId), orderBy("date", "asc"));
    onSnapshot(q, (snap) => {
        const list = document.getElementById('messagesList');
        list.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const type = m.senderId === currentUser.uid ? "me" : "them";
            list.innerHTML += `<div class="msg ${type}">${m.text}</div>`;
        });
        list.scrollTop = list.scrollHeight;
    });

    document.getElementById('sendMsg').onclick = async () => {
        const txt = document.getElementById('msgInput').value;
        if(!txt) return;
        await addDoc(collection(db, "chats"), {
            pieceId, text: txt, senderId: currentUser.uid, date: serverTimestamp()
        });
        document.getElementById('msgInput').value = "";
    };
};

// --- SUPPRESSION (VENDU) ---
window.marquerVendu = async (id) => {
    if(confirm("Confirmer la vente ? L'annonce disparaîtra.")) {
        await deleteDoc(doc(db, "annonces", id));
        chargerPieces();
    }
};

// --- CHARGEMENT ---
async function chargerPieces() {
    const snap = await getDocs(collection(db, "annonces"));
    const container = document.getElementById('piecesContainer');
    container.innerHTML = "";
    snap.forEach(d => {
        const p = d.data();
        const estProprio = currentUser && currentUser.uid === p.vendeurId;
        container.innerHTML += `
            <div class="card">
                <img src="${p.url_image || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=500'}" class="card-img">
                <div class="card-info">
                    <h3>${p.nom}</h3>
                    <p>${p.marque}</p>
                    <div class="card-price">${Number(p.prix).toLocaleString()} GNF</div>
                    ${estProprio ? 
                        `<button class="btn-vendu" onclick="marquerVendu('${d.id}')">Marquer comme Vendu</button>` :
                        `<button class="submit-btn" onclick="ouvrirChat('${d.id}', '${p.nom}')">Discuter avec le vendeur</button>`
                    }
                </div>
            </div>`;
    });
}

// --- AJOUT ---
document.getElementById('openBtn').onclick = () => {
    if(!currentUser) return ouvrirAuth();
    document.getElementById('modalForm').style.display = "block";
};

document.getElementById('addForm').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "annonces"), {
        nom: document.getElementById('nom').value,
        marque: document.getElementById('marque').value,
        prix: document.getElementById('prix').value,
        url_image: document.getElementById('url_image').value,
        vendeurId: currentUser.uid,
        date: serverTimestamp()
    });
    fermerModals();
    chargerPieces();
};

chargerPieces();
