import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXAy63dWnzyj_uubs9FxK-tSBLR7Cef78",
  authDomain: "autopiecesguinee.firebaseapp.com",
  projectId: "autopiecesguinee",
  storageBucket: "autopiecesguinee.firebasestorage.app",
  messagingSenderId: "569278363345",
  appId: "1:569278363345:web:132ed40ab3c2fcb7e437f0",
  measurementId: "G-9CTBKLDRLG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function chargerPieces() {
    const container = document.getElementById('piecesContainer');
    if(!container) return;
    try {
        const querySnapshot = await getDocs(collection(db, "annonces"));
        container.innerHTML = ""; 
        querySnapshot.forEach((doc) => {
            const piece = doc.data();
            container.innerHTML += `
                <div class="card">
                    <img src="${piece.url_image || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=500'}" class="card-img">
                    <div class="card-info">
                        <h3>${piece.nom}</h3>
                        <p>${piece.marque} • ${piece.etat}</p>
                        <div class="card-price">${Number(piece.prix).toLocaleString()} GNF</div>
                    </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

const modal = document.getElementById('modalForm');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');

if(openBtn) openBtn.onclick = () => modal.style.display = "block";
if(closeBtn) closeBtn.onclick = () => modal.style.display = "none";

const addForm = document.getElementById('addForm');
if(addForm) {
    addForm.onsubmit = async (e) => {
        e.preventDefault();
        const nouvellePiece = {
            nom: document.getElementById('nom').value,
            marque: document.getElementById('marque').value,
            prix: Number(document.getElementById('prix').value),
            etat: document.getElementById('etat').value,
            url_image: document.getElementById('url_image').value
        };
        try {
            await addDoc(collection(db, "annonces"), nouvellePiece);
            modal.style.display = "none";
            addForm.reset();
            chargerPieces();
            alert("Annonce publiée !");
        } catch (error) { alert("Erreur lors de l'ajout"); }
    };
}

chargerPieces();
