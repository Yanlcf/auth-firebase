import express from 'express';
import admin from 'firebase-admin';

const app = express();
admin.initializeApp({
  credential: admin.credential.cert("serviceAccountKey.json")
});

app.get('/transactions', async (req, res) => {
  const jwt = req.headers.authorization;
  if (!jwt) return res.status(401).json({ message: "Usuário não autorizado" });

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(jwt);
    const uid = decodedIdToken.uid;

    const adminDoc = await admin.firestore().doc(`admins/${uid}`).get();
    const isAdmin = adminDoc.exists && adminDoc.data().isAdmin;

    const transactionsRef = admin.firestore().collection('transactions');

    const snapshot = await (isAdmin
      ? transactionsRef.get()
      : transactionsRef.where('user.uid', '==', uid).get());

    const transactions = snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    }));

    const message = isAdmin ? "Você é um administrador." : undefined;
    res.json({ message, transactions });
  } catch (e) {
    res.status(401).json({ message: "Usuário não autorizado" });
  }
});

app.listen(3000, () => {
  console.log('API escutando na porta 3000');
});
