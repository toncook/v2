// IMPORT
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// CONFIGURATION
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChVruONuXi2k3VR5DF40N8pWMZXWYLxtc",
  authDomain: "koocton.firebaseapp.com",
  projectId: "koocton",
  storageBucket: "koocton.appspot.com",
  messagingSenderId: "878882645381",
  appId: "1:878882645381:web:d0d01180ef9ae8935550ec",
};

// INITIATION
// Init Firebase
const app = initializeApp(firebaseConfig);
// Init Firestore
const db = getFirestore(app);

// TON Connect Initiation
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://toncook.github.io/v2//tonconnect-manifest.json",
  buttonRootId: "ton-connect",
});

//  Listen for wallet connection status change events
tonConnectUI.onStatusChange(async (walletInfo) => {
  if (walletInfo) {
    // Get wallet address and call API to get balance
    try {
      const balance = await getTonBalance(walletInfo.account.address);
      document.getElementById(
        "walletInfo"
      ).innerText = `Balance: ${balance.toFixed(3)} TON`;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      document.getElementById("walletInfo").innerText =
        "Error fetching balance.";
    }
    document.getElementById("getTicketInfo").innerText = "";
  } else {
    document.getElementById("walletInfo").innerText =
      "Please connect your wallet.";
  }
});

// Function to get TON wallet balance
async function getTonBalance(walletAddress) {
  const apiKey =
    "9ae89b79b77bf166ebfb16283bb339cbf428d2c579b56fc7a6372a6ba0490caa";
  const response = await fetch(
    `https://toncenter.com/api/v2/getAddressInformation?address=${walletAddress}&api_key=${apiKey}`
  );
  const data = await response.json();

  if (data && data.result) {
    // nanoton to Toncoin
    return data.result.balance / 1e9;
  } else {
    throw new Error("Failed to fetch wallet balance.");
  }
}

// Function to check and send Toncoin
async function sendToncoin(amount) {
  const getTicketInfo = document.getElementById("getTicketInfo");

  if (tonConnectUI.connected) {
    //  IF THE WALLET IS CONNECTED
    const walletInfo = tonConnectUI.wallet;
    const walletAddress = walletInfo.account.address;

    try {
      const balance = await getTonBalance(walletAddress);

      if (balance >= amount) {
        //  If sufficient balance, proceed with payment
        await sendTransaction(amount);
        getTicketInfo.innerText = `Transaction successful! Sent ${amount} TON.`;
        // Show tooltip
        getTicketInfo.style.visibility = "visible";
        getTicketInfo.style.opacity = 1;
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          getTicketInfo.style.visibility = "hidden";
          getTicketInfo.style.opacity = 0;
        }, 3000);
      } else {
        // If insufficient balance, display message
        getTicketInfo.innerText = `Insufficient balance! You have ${balance.toFixed(
          2
        )} TON but need ${amount} TON.`;
        // Show tooltip
        getTicketInfo.style.visibility = "visible";
        getTicketInfo.style.opacity = 1;
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          getTicketInfo.style.visibility = "hidden";
          getTicketInfo.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("Error during transaction:", error);
      getTicketInfo.innerText = "Error during transaction.";
      // Show tooltip
      getTicketInfo.style.visibility = "visible";
      getTicketInfo.style.opacity = 1;
      // Hide tooltip after 2 seconds
      setTimeout(() => {
        getTicketInfo.style.visibility = "hidden";
        getTicketInfo.style.opacity = 0;
      }, 3000);
    }
  } else {
    //  IF THE WALLET IS NOT CONNECTED
    getTicketInfo.innerText = "Please connect wallet first!";
    // Show tooltip
    getTicketInfo.style.visibility = "visible";
    getTicketInfo.style.opacity = 1;
    // Hide tooltip after 2 seconds
    setTimeout(() => {
      getTicketInfo.style.visibility = "hidden";
      getTicketInfo.style.opacity = 0;
    }, 3000);
  }
}

// Function to send transaction
const destination = "UQCkanhhAMYn2csMdxpaXDMC1n33u1nT1SUGgVvpYrIU-CC2"; //toncookv2 mainnet

//
async function sendTransaction(amount) {
  const userId = user.id.toString();
  const username = user.username;
  try {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [
        {
          address: destination,
          amount: (amount * 1e9).toString(),
        },
      ],
    };

    const result = await tonConnectUI.sendTransaction(transaction);
    console.log("Transaction result:", result);

    // check bounce
    if (result && result.bounced) {
      console.log("Transaction bounced. Funds were returned.");
    }
    await createNewUser(userId, username);
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

// FUNCTIONS FIREBASE
// Function to check if a user with a specific ID exists in Firestore
async function checkUserExists(userId) {
  const docRef = doc(db, "users", userId); //  reference DocID is userId
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log("User exists:", docSnap.data());
    return docSnap.data(); // if exits
  } else {
    console.log("No such user!");
    return null; // if no exits
  }
}

// Function to create a new user document
async function createNewUser(userId, username) {
  try {
    const ticket = generateRandomTicket();
    console.log(ticket);
    await setDoc(doc(db, "users", userId), {
      firstName: username,
      ticket: ticket,
      createdAt: new Date(),
    });
    console.log("User created with ID:", userId);
    displayTicket(ticket);
    document.getElementById("getTicketButton").style.display = "none";
    document.getElementById("countdown").style.display = "none";
  } catch (error) {
    console.error("Error creating new user:", error);
  }
}

function generateRandomTicket() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const ticketLength = 6;
  let ticket = "";

  for (let i = 0; i < ticketLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    ticket += characters[randomIndex];
  }

  return ticket;
}

// Function to mask the ticket
function maskTicket(ticket) {
  return ticket[0] + "****" + ticket[ticket.length - 1];
}

// Function to display the ticket with toggle button
function displayTicket(ticket) {
  document.getElementById("ticket").style.display = "block";
  document.getElementById("ticketSub").style.display = "block";

  //xu ly nut copy ticket code
  const copyTicketCode = document.getElementById("copyTicketCode");
  const copyTicketCodePopup = document.getElementById("copyTicketCodePopup");

  copyTicketCode.addEventListener("click", () => {
    // Copy user ID to clipboard
    navigator.clipboard
      .writeText(ticket)
      .then(() => {
        // Show tooltip
        copyTicketCodePopup.style.visibility = "visible";
        copyTicketCodePopup.style.opacity = 1;
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          copyTicketCodePopup.style.visibility = "hidden";
          copyTicketCodePopup.style.opacity = 0;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  });

  document.getElementById("ticket").innerText = "";
  const ticketElement = document.getElementById("ticket");
  const ticketText = document.createElement("span");
  const toggleIcon = document.createElement("i");
  let isMasked = true;

  const updateTicketDisplay = () => {
    ticketText.innerText = `${isMasked ? maskTicket(ticket) : ticket}`;
    toggleIcon.className = isMasked ? "fas fa-eye" : "fas fa-eye-slash";

    toggleIcon.style.cursor = "pointer";
    toggleIcon.style.marginRight = "10px";
    toggleIcon.addEventListener("click", () => {
      isMasked = !isMasked;
      updateTicketDisplay();
    });

    updateTicketDisplay();
    ticketElement.appendChild(toggleIcon);
    ticketElement.appendChild(ticketText);
  };
}
// Function to display one section and hide all other sections
function navigateTo(sectionId) {
  document.querySelectorAll("#container > div").forEach((div) => {
    div.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

// Fake Process Bar
function move() {
  let i = 0;
  if (i == 0) {
    i = 1;
    var elem = document.getElementById("myBar");
    var width = 0;
    var id = setInterval(frame, 60);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        i = 0;
        navigateTo("home");
      } else {
        width++;
        elem.style.width = width + "%";
        elem.innerHTML = width + "%";
      }
    }
  }
}

function countdown(targetTime) {
  const countdownElement = document.getElementById("countdown");

  const interval = setInterval(() => {
    //
    const now = new Date().getTime();

    //
    const target = new Date(targetTime).getTime();

    //
    const distance = target - now;

    //
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    //
    const result = `End: ${days} day, ${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    //
    countdownElement.textContent = result;

    //
    if (distance < 0) {
      clearInterval(interval);
      countdownElement.textContent = "Countdown finished!";
    }
  }, 1000);
}
// Get user ID and user FirstName
const user = Telegram.WebApp.initDataUnsafe.user;

function formatUserName(username) {
  if (username.length > 7) {
    return username.slice(0, 7) + "...";
  }
  return username;
}

function formatUserId(userId) {
  const userIdStr = userId.toString();
  if (userIdStr.length > 5) {
    return userIdStr.slice(0, 2) + "..." + userIdStr.slice(-3);
  }
  return userIdStr;
}

// MAIN RUN

//
document.addEventListener("DOMContentLoaded", async () => {
  // Init TWA
  Telegram.WebApp.ready();
  Telegram.WebApp.expand(); // Mini App is expanded to the maximum height

  move();

  // navigateTo("home");
  countdown("October 17, 2024 23:59:59");

  document.getElementById("getTicketButton").addEventListener("click", () => {
    const amountToSend = 2;
    sendToncoin(amountToSend);
  });
});

//
window.addEventListener("load", async () => {
  if (user.username) {
    const formattedUserName = formatUserName(user.username);
    const formattedUserId = formatUserId(user.id);

    document.getElementById(
      "userInfo"
    ).innerHTML = `${formattedUserName} (Id:<strong>${formattedUserId}</strong>)`;

    const copyIcon = document.getElementById("copyIcon");
    const copyPopup = document.getElementById("copyPopup");

    copyIcon.addEventListener("click", () => {
      // Copy user ID to clipboard
      navigator.clipboard
        .writeText(user.id.toString())
        .then(() => {
          // Show tooltip
          copyPopup.style.visibility = "visible";
          copyPopup.style.opacity = 1;
          // Hide tooltip after 2 seconds
          setTimeout(() => {
            copyPopup.style.visibility = "hidden";
            copyPopup.style.opacity = 0;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    });
  } else {
    // const formattedUserName = formatUserName(user.username);
    const formattedUserId = formatUserId(user.id);

    document.getElementById(
      "userInfo"
    ).innerHTML = `... (Id:<strong>${formattedUserId}</strong>)`;

    const copyIcon = document.getElementById("copyIcon");
    const copyPopup = document.getElementById("copyPopup");

    copyIcon.addEventListener("click", () => {
      // Copy user ID to clipboard
      navigator.clipboard
        .writeText(user.id.toString())
        .then(() => {
          // Show tooltip
          copyPopup.style.visibility = "visible";
          copyPopup.style.opacity = 1;
          // Hide tooltip after 2 seconds
          setTimeout(() => {
            copyPopup.style.visibility = "hidden";
            copyPopup.style.opacity = 0;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    });
  }
  if (!user) {
    document.getElementById("userInfo").innerText =
      "User information not found";
    document.getElementById("copyIcon").style.display = "none";
  }

  const userId = user.id.toString();
  const userData = await checkUserExists(userId);
  if (userData) {
    displayTicket(userData.ticket);
    document.getElementById("getTicketButton").style.display = "none";
    document.getElementById("countdown").style.display = "none";
  } else {
    console.log("No such user!");
  }
});
