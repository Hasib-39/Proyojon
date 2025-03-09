import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

const useSnapshot = (collection, docId) => {
  const [val, setVal] = useState(null); // Default state to prevent undefined errors

  useEffect(() => {
    if (!docId) {
      setVal(null); // Prevent Firestore from being queried with an invalid docId
      return;
    }

    const docRef = doc(db, collection, docId);
    const unsub = onSnapshot(docRef, (docSnap) => {
      setVal(docSnap.exists() ? docSnap.data() : null);
    });

    return () => unsub();
  }, [collection, docId]); // Re-run when collection or docId changes

  return { val };
};

export default useSnapshot;
