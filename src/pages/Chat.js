import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import Message from "../components/Message";
import MessageForm from "../components/MessageForm";
import User from "../components/User";
import { auth, db } from "../firebaseConfig";
import "../styles/Chat.css";
import { FaTrashAlt } from 'react-icons/fa';



// Function to delete the conversation


const Chat = () => {
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [online, setOnline] = useState({});
  const location = useLocation();
  const user1 = auth.currentUser?.uid;
  const currentChatIdRef = useRef(null);
  
  const deleteConversation = async () => {
    if (!chat) return;
  
    const chatId = currentChatIdRef.current;
    if (!chatId) return;
  
    try {
      // Immediately clear messages from the UI
      setMsgs([]);
  
      // Delete all messages in the conversation from Firestore
      const msgsRef = collection(db, "messages", chatId, "chat");
      const msgsSnapshot = await getDocs(msgsRef);
      const deletePromises = msgsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
  
      // Delete the conversation metadata from Firestore
      await deleteDoc(doc(db, "messages", chatId));
  
      // Also remove the conversation from the inbox collection
      const inboxRef = collection(db, "inbox"); // Replace with the correct inbox collection
      const inboxSnapshot = await getDocs(inboxRef);
      const conversationDoc = inboxSnapshot.docs.find(doc => doc.data().chatId === chatId);
      if (conversationDoc) {
        await deleteDoc(conversationDoc.ref);
      }
  
      // Remove the conversation from the users list
      setUsers(prevUsers => prevUsers.filter(user => user.ad.adId !== chat.ad.adId));
  
      // Clear the current chat state
      setChat(null);
      currentChatIdRef.current = null;
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };
  
  const selectUser = async (user) => {
    if (!user || !user.ad) return;

    setChat(user);
    const user2 = user.other.uid;
    const id =
      user1 > user2
        ? `${user1}.${user2}.${user.ad.adId}`
        : `${user2}.${user1}.${user.ad.adId}`;
    
    // Store the current chat ID in the ref
    currentChatIdRef.current = id;
    
    const msgsRef = collection(db, "messages", id, "chat");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (querySnapshot) => {
      // Only update messages if this is still the active chat
      if (currentChatIdRef.current === id) {
        let msgs = [];
        querySnapshot.forEach((doc) => msgs.push(doc.data()));
        setMsgs(msgs);
      }
    });
    
    const docSnap = await getDoc(doc(db, "messages", id));
    if (docSnap.exists()) {
      if (docSnap.data().lastSender !== user1 && docSnap.data().lastUnread) {
        await updateDoc(doc(db, "messages", id), {
          lastUnread: false,
        });
      }
    }
    return () => unsub();
  };

  const getChat = async (ad) => {
    if (!ad || !ad.adId) return;

    const buyer = await getDoc(doc(db, "users", user1));
    const seller = await getDoc(doc(db, "users", ad.postedBy));
    setChat({ ad, me: buyer.data(), other: seller.data() });
    
    const chatId =
      user1 > ad.postedBy
        ? `${user1}.${ad.postedBy}.${ad.adId}`
        : `${ad.postedBy}.${user1}.${ad.adId}`;
    
    // Store the current chat ID in the ref
    currentChatIdRef.current = chatId;
    
    const adRef = doc(db, "ads", ad.adId);
    const unsubAd = onSnapshot(adRef, async (adSnap) => {
      if (!adSnap.exists() && currentChatIdRef.current === chatId) {
        const chatRef = collection(db, "messages", chatId, "chat");
        const chatSnapshot = await getDocs(chatRef);
        const deletePromises = chatSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "messages", chatId));
        setChat(null);
        currentChatIdRef.current = null;
      }
    });
    
    // Set up message listener for this chat
    const msgsRef = collection(db, "messages", chatId, "chat");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (querySnapshot) => {
      // Only update messages if this is still the active chat
      if (currentChatIdRef.current === chatId) {
        let msgs = [];
        querySnapshot.forEach((doc) => msgs.push(doc.data()));
        setMsgs(msgs);
      }
    });
    
    return () => {
      unsubAd();
      unsubMsgs();
    };
  };

  const getList = async () => {
    const msgRef = collection(db, "messages");
    const q = query(msgRef, where("users", "array-contains", user1));
    const msgsSnap = await getDocs(q);
    const messages = msgsSnap.docs.map((doc) => doc.data());
    const users = [];
    const unsubscribes = [];
    
    for (const message of messages) {
      const adRef = doc(db, "ads", message.ad);
      const meRef = doc(
        db,
        "users",
        message.users.find((id) => id === user1)
      );
      const otherRef = doc(
        db,
        "users",
        message.users.find((id) => id !== user1)
      );
      
      const adDoc = await getDoc(adRef);
      const meDoc = await getDoc(meRef);
      const otherDoc = await getDoc(otherRef);
      
      if (adDoc.exists() && meDoc.exists() && otherDoc.exists()) {
        users.push({
          ad: adDoc.data(),
          me: meDoc.data(),
          other: otherDoc.data(),
        });
        
        const unsub = onSnapshot(otherRef, (doc) => {
          setOnline((prev) => ({
            ...prev,
            [doc.data().uid]: doc.data().isOnline,
          }));
        });
        
        unsubscribes.push(unsub);
      }
    }
    
    setUsers(users);
    
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };

  useEffect(() => {
    if (location.state?.ad) {
      getChat(location.state.ad);
    }
    getList();
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chat || !chat.ad || text.trim() === "") return;
  
    const user2 = chat.other.uid;
    const chatId =
      user1 > user2
        ? `${user1}.${user2}.${chat.ad.adId}`
        : `${user2}.${user1}.${chat.ad.adId}`;
  
    // Create a temporary message object
    const newMsg = {
      text,
      sender: user1,
      createdAt: Timestamp.now(), // Keep it consistent with Firestore timestamps
      tempId: Date.now(), // Temporary ID for UI rendering before Firestore syncs
    };
  
    // Optimistically update the UI with the new message
    setMsgs((prevMsgs) => [...prevMsgs, newMsg]);
    setText("");
  
    try {
      // Add message to Firestore
      await addDoc(collection(db, "messages", chatId, "chat"), newMsg);
  
      // Update last message details in Firestore
      await updateDoc(doc(db, "messages", chatId), {
        lastText: text,
        lastSender: user1,
        lastUnread: true,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Rollback UI update in case of an error
      setMsgs((prevMsgs) => prevMsgs.filter((msg) => msg.tempId !== newMsg.tempId));
    }
  };

  return (
    <div className="row g-0">
      <div className="headline">Chats</div>
      <div className="col-3 col-md-3 users_container">
        {users.map((user, i) => (
          <User
            key={i}
            user={user}
            selectUser={selectUser}
            chat={chat}
            online={online}
            user1={user1}
          />
        ))}
      </div>
      <div className="col-6 col-md-6 position-relative chat-inbox">
        {chat ? (
          <>
            <div className="text-center mt-1 user2-container">
               {chat.other.photoUrl ? (
                 <img
                   src={chat.other.photoUrl}
                   alt={chat.other.name}
                   className="user2-img"
                 />
               ) : (
                 <FaUserCircle size={50} />
               )}
               <div className="user2-title-container">
                 <h3 className="user2-title">{chat.other.name}</h3>
                 {/* Trash bin button to delete conversation */}
                 <div
                   className="delete-conversation-btn"
                   onClick={deleteConversation}
                   title="Delete Conversation"
                 >
                   <FaTrashAlt size={25} color="red" />
                 </div>
               </div>
             </div>
             <div className="messages overflow-auto">
              {msgs.map((msg, i) => (
                <Message key={i} msg={msg} user1={user1} />
              ))}
            </div>

            <MessageForm
              text={text}
              setText={setText}
              handleSubmit={handleSubmit}
            />
          </>
        ) : (
          <div className="text-center mt-5">
            <h3 className="user2-title">Select a user to start conversation</h3>
          </div>
        )}
      </div>
      <div className="col-3 col-md-3 position-relative chat-info">
        <div className="test">
          {chat && (
            <>
              {chat.other.photoUrl ? (
                <img
                  src={chat.other.photoUrl}
                  alt={chat.other.name}
                  className="user2-img"
                />
              ) : (
                <FaUserCircle size={50} />
              )}
              <h3 className="chat-title mt-2">{chat.other.name}</h3>
              <small className={`${online[chat.other.uid] ? "online" : "offline"}`}>
                {online[chat.other.uid] ? "Active now" : "Offline"}
              </small>
              <br />
              <div className="ad-details text-center mt-3">
                <div className="p-2 user2-container">
                  <img
                    src={chat.ad.images[0]?.url}
                    alt={chat.ad.title}
                    className="img-thumbnail mb-2"
                  />
                </div>
                <div>
                  <h6 className="ad-title mb-1">{chat.ad.title}</h6>
                  <small className="text-muted">{chat.ad.price}</small>
                </div>
                <Link
                  className="btn btn-secondary btn-sm mt-2"
                  to={`/${chat.ad.category.toLowerCase()}/${chat.ad.adId}`}
                >
                  View Post
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;