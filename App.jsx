import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import './App.css';


const firebaseConfig = {
  apiKey: "AIzaSyBTkb7Vs-yiOhjzazB0QcQq7b3f2XYiYlE",
  authDomain: "fantecy-game.firebaseapp.com",
  projectId: "fantecy-game",
  storageBucket: "fantecy-game.firebasestorage.app",
  messagingSenderId: "299793071522",
  appId: "1:299793071522:web:e248b10d91468e78ab86fb",
  measurementId: "G-SWMYWY8SEV"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [team, setTeam] = useState([]);
  const [budget, setBudget] = useState(9000000);
  const [leaderboard, setLeaderboard] = useState([]);
  const [chat, setChat] = useState("Ask Spiriter about a player");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubscribePlayers = onSnapshot(collection(db, "players"), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        value: doc.data().value,
      })));
    });
  
    const unsubscribeLeaderboard = onSnapshot(collection(db, "leaderboard"), (snapshot) => {
      setLeaderboard(snapshot.docs.map((doc) => ({
        username: doc.data().username,
        points: doc.data().points,
      })));
    });
  
    return () => {
      unsubscribePlayers();
      unsubscribeLeaderboard();
    };
  }, []);
  

  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  const addToTeam = (player) => {
    if (team.length < 11 && budget >= player.value && !team.some((p) => p.id === player.id)) {
      setTeam([...team, player]);
      setBudget(budget - player.value);
    }
  };

  const removeFromTeam = (player) => {
    setTeam(team.filter((p) => p.id !== player.id));
    setBudget(budget + player.value);
  };

  const chatWithAI = async () => {
    if (!query.trim()) return; // Prevent empty queries
    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          prompt: query,
          max_tokens: 50,
        }),
      });
      const data = await response.json();
      setChat(data.choices?.[0]?.text || "No response from AI.");
    } catch (error) {
      setChat(`${error}Error connecting to AI.`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {!user ? (
        <button onClick={login}>Login</button>
      ) : (
        <h3>Welcome, {user.displayName}</h3>
      )}
      <h2>Budget: Rs.{budget.toLocaleString()}</h2>

      <h3>Players</h3>
      {players.map((p) => (
        <div key={p.id}>
          <button onClick={() => addToTeam(p)}>
            {p.name} - Rs.{p.value}
          </button>
        </div>
      ))}

      <h3>My Team ({team.length}/11)</h3>
      {team.map((p) => (
        <div key={p.id}>
          {p.name} <button onClick={() => removeFromTeam(p)}>Remove</button>
        </div>
      ))}

      <h3>Leaderboard</h3>
      {leaderboard.map((p, i) => (
        <div key={i}>
          {p.username} - {p.points} pts
        </div>
      ))}

      <h3>Spiriter AI</h3>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={chatWithAI}>Ask</button>
      <p>{chat}</p>
    </div>
  );
}
