import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ta configuration officielle
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
    try {
        const querySnapshot = await getDocs(collection(db, "annonces"));
        container.innerHTML = ""; 

        if (querySnapshot.empty) {
            container.innerHTML = `
                <div style="text-align:center; padding: 50px 20px; opacity: 0.5;">
                    <p>Aucune pièce n'est encore en vente.</p>
                    <p style="font-size: 0.8rem;">Ajoutez-en une dans la console Firebase !</p>
                </div>`;
            return;
        }

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
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = "<p>Erreur de chargement. Vérifiez vos règles Firestore.</p>";
    }
}

chargerPieces();
