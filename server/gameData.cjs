// ============================================================
// HACK THE CHAOS — Game Data
// All game content: rounds, clues, AI dialogue, media triggers
// ============================================================

// --- PLAYER ROLES ---
const ROLES = {
  1: { name: 'SCOUT', emoji: '🔎', description: 'Find out WHAT is happening', accessibility: 'deaf' },
  2: { name: 'DETECTOR', emoji: '🧩', description: 'Find out WHAT IS SUSPICIOUS', accessibility: 'blind' },
  3: { name: 'SECURITY OFFICER', emoji: '🛡️', description: 'Find out WHAT SHOULD BE DONE', accessibility: 'mute' },
};

// --- UTILITY ---
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// ROUND 1 — OFFICE MEIN AAG LAG GAYI 🔥
// ============================================================
const ROUND1_CHALLENGES = [
  {
    systems: [
      { id: 'fire', label: '🔥 FIRE ALARM' },
      { id: 'password', label: '🔐 PASSWORD DATABASE' },
      { id: 'money', label: '💰 COMPANY MONEY' },
      { id: 'email', label: '📧 EMAIL SERVER' },
    ],
    alerts: [
      '🚨 FIRE DETECTED',
      '🚨 SECURITY BREACH',
      '🚨 CEO DETECTED',
      '🚨 SAMOSA DETECTED',
    ],
    playerClues: {
      1: {
        title: 'SYSTEM STATUS REPORT',
        text: '🔥 Fire alarm = REAL\n🔐 Password database = 87 suspicious login attempts\n💰 Money = Normal activity\n📧 Email = Normal activity',
        hint: 'The password system is being targeted.',
      },
      2: {
        title: 'RISK ANALYSIS',
        text: 'FIRE → MEDIUM RISK\nPASSWORD → ⚠️ HIGH RISK\nMONEY → LOW RISK\nEMAIL → LOW RISK',
        hint: 'Password has the highest cyber risk.',
      },
      3: {
        title: 'EMERGENCY RULE',
        text: '🛡️ If suspicious login activity is detected, secure authentication credentials FIRST.\n\nPriority: Data protection over physical alerts.',
        hint: 'Secure passwords first.',
      },
    },
    correctAnswer: 'password',
  },
  {
    systems: [
      { id: 'printer', label: '🖨️ OFFICE PRINTER' },
      { id: 'customerdb', label: '👥 CUSTOMER DATABASE' },
      { id: 'coffee', label: '☕ COFFEE MACHINE' },
      { id: 'website', label: '🌐 COMPANY WEBSITE' },
    ],
    alerts: [
      '🚨 PRINTER JAM DETECTED',
      '🚨 DATA BREACH IN PROGRESS',
      '🚨 COFFEE SUPPLY CRITICAL',
      '🚨 VADA PAV SHORTAGE',
    ],
    playerClues: {
      1: {
        title: 'SYSTEM STATUS REPORT',
        text: '🖨️ Printer = Paper jam (not critical)\n👥 Customer DB = Unauthorized export detected\n☕ Coffee = Empty (EMERGENCY)\n🌐 Website = Normal',
        hint: 'Customer database has unauthorized activity.',
      },
      2: {
        title: 'RISK ANALYSIS',
        text: 'PRINTER → ZERO RISK\nCUSTOMER DB → ⚠️ CRITICAL RISK\nCOFFEE → EMOTIONAL RISK\nWEBSITE → LOW RISK',
        hint: 'Customer database is at critical risk.',
      },
      3: {
        title: 'DATA PROTECTION RULE',
        text: '🛡️ If unauthorized data export is detected, lock the database IMMEDIATELY.\n\nCustomer data is classified as SENSITIVE.',
        hint: 'Lock the customer database.',
      },
    },
    correctAnswer: 'customerdb',
  },
  {
    systems: [
      { id: 'ac', label: '❄️ AC SYSTEM' },
      { id: 'employee', label: '📋 EMPLOYEE RECORDS' },
      { id: 'parking', label: '🅿️ PARKING SYSTEM' },
      { id: 'server', label: '🖥️ SERVER ROOM' },
    ],
    alerts: [
      '🚨 AC MALFUNCTION',
      '🚨 EMPLOYEE DATA LEAK',
      '🚨 PARKING FULL',
      '🚨 CHAI BREAK OVERDUE',
    ],
    playerClues: {
      1: {
        title: 'SYSTEM STATUS REPORT',
        text: '❄️ AC = Overheating (annoying)\n📋 Employee Records = Mass download detected\n🅿️ Parking = Full (as usual)\n🖥️ Server = Normal',
        hint: 'Employee records are being downloaded.',
      },
      2: {
        title: 'RISK ANALYSIS',
        text: 'AC → COMFORT RISK\nEMPLOYEE RECORDS → ⚠️ HIGH RISK\nPARKING → ZERO RISK\nSERVER → LOW RISK',
        hint: 'Employee records are at highest risk.',
      },
      3: {
        title: 'HR DATA RULE',
        text: '🛡️ If mass download of personnel files is detected, freeze access to employee records.\n\nPersonal data must be protected.',
        hint: 'Freeze employee records access.',
      },
    },
    correctAnswer: 'employee',
  },
];

// ============================================================
// ROUND 2 — THE AI HAS BECOME A SCAMMER 📱
// ============================================================
const SCAM_MESSAGES = [
  {
    id: 'prize_50lakh',
    text: '🎁 CONGRATULATIONS!!!\nYOU WON ₹50,00,000!!!\nSEND OTP TO CLAIM NOW!!!',
    isScam: true,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'You never entered any competition.\nSender: unknown_prize_992@totallylegit.biz', hint: 'Unexpected prize from unknown sender.' },
      2: { title: 'SUSPICIOUS PATTERN', text: '🔢 OTP requested\n⚠️ Extreme excitement language\n⏰ Creates artificial urgency', hint: 'They want the OTP. Very suspicious.' },
      3: { title: 'SECURITY RULE', text: '🛡️ Never share an OTP to claim an unexpected prize.\nOTPs are for YOUR verification only.', hint: 'Do not share OTP.' },
    },
  },
  {
    id: 'bank_alert',
    text: '🏦 BANK SECURITY ALERT\n"Your account will be BLOCKED in 30 seconds!!!"\n"Click this link IMMEDIATELY."',
    isScam: true,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Sender domain: bnk-securty-alert.xyz\n(Your bank domain is: mybank.com)', hint: 'Sender domain is suspicious.' },
      2: { title: 'SUSPICIOUS PATTERN', text: '⏰ Extreme urgency (30 seconds!)\n🔗 Unknown link\n😱 Fear tactic', hint: 'Extreme urgency and unknown link.' },
      3: { title: 'SECURITY RULE', text: '🛡️ Always use the official banking app or website.\nNever click links from SMS/email claiming urgency.', hint: 'Use official channel, not this link.' },
    },
  },
  {
    id: 'ceo_gift_cards',
    text: '👔 FROM: CEO\n"Hey, I need you to buy 10 gift cards worth ₹50,000 each ASAP.\nDon\'t tell anyone. Very confidential."',
    isScam: true,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Email: ceo_definitely_real@gmail.com\n(CEO\'s real email uses company domain)', hint: 'Not from the real CEO.' },
      2: { title: 'SUSPICIOUS PATTERN', text: '💳 Unusual financial request\n🤫 "Don\'t tell anyone"\n⚡ Urgency', hint: 'Secret financial request is suspicious.' },
      3: { title: 'SECURITY RULE', text: '🛡️ Verify unusual requests through official channels.\nNo CEO asks employees to secretly buy gift cards.', hint: 'Verify through official channel.' },
    },
  },
  {
    id: 'free_iphone',
    text: '📱 YOU ARE THE 1,000,000th VISITOR!!!\nCLICK HERE TO CLAIM YOUR FREE iPHONE 47 PRO MAX ULTRA!!!\n(Only 3 left!!!)',
    isScam: true,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Source: Random popup on a website\nNo company identified', hint: 'Random popup, no real company.' },
      2: { title: 'SUSPICIOUS PATTERN', text: '🎰 "1,000,000th visitor" claim\n📱 iPhone 47 doesn\'t exist\n⏰ Artificial scarcity', hint: 'Fake scarcity, fake product.' },
      3: { title: 'SECURITY RULE', text: '🛡️ Legitimate companies don\'t give away products via popups.\nClose the popup. Walk away.', hint: 'Close and ignore.' },
    },
  },
  {
    id: 'nigerian_prince',
    text: '👑 DEAR FRIEND,\nI am Prince Okonkwo. I have $47 MILLION USD.\nI need YOUR bank details to transfer the money.\nYou keep 50%.',
    isScam: true,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Sender: prince_okonkwo_47M@royalmail.ng\nYou don\'t know any princes.', hint: 'Unknown sender claiming to be royalty.' },
      2: { title: 'SUSPICIOUS PATTERN', text: '💰 Unrealistic amount\n🏦 Asks for bank details\n🤝 "You keep 50%" is too good', hint: 'Asks for bank details. Too good to be true.' },
      3: { title: 'SECURITY RULE', text: '🛡️ Never share bank details with strangers.\nIf it sounds too good to be true, it IS.', hint: 'Never share bank details.' },
    },
  },
  // LEGITIMATE messages
  {
    id: 'bank_statement',
    text: '🏦 YOUR BANK\n"Your monthly statement for August is available."\n"Open the official banking app to view it."',
    isScam: false,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Sender: notifications@mybank.com\n(Matches your bank\'s official domain)', hint: 'Known, verified sender.' },
      2: { title: 'RISK CHECK', text: '✅ No urgency\n✅ No OTP/password request\n✅ Directs to official app', hint: 'No suspicious patterns detected.' },
      3: { title: 'PROCEDURE CHECK', text: '🛡️ Monthly statements are normal.\nUsing the official app is correct procedure.', hint: 'Normal procedure.' },
    },
  },
  {
    id: 'delivery_normal',
    text: '📦 DELIVERY UPDATE\n"Your order #4829 will arrive tomorrow between 2-5 PM."\n"Track at our official app."',
    isScam: false,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Sender: updates@delivery-service.com\nYou did order something recently.', hint: 'Expected delivery from known service.' },
      2: { title: 'RISK CHECK', text: '✅ No sensitive info requested\n✅ No urgency\n✅ Tracks via official app', hint: 'No suspicious patterns.' },
      3: { title: 'PROCEDURE CHECK', text: '🛡️ Delivery notifications are normal.\nTracking through official app is safe.', hint: 'Normal notification.' },
    },
  },
  {
    id: 'password_reset_legit',
    text: '🔐 IT DEPARTMENT\n"Scheduled password rotation.\nPlease update your password via the company portal by Friday."',
    isScam: false,
    playerClues: {
      1: { title: 'SENDER INFO', text: 'Sender: it-security@yourcompany.com\n(Official company domain, IT department)', hint: 'From official IT department.' },
      2: { title: 'RISK CHECK', text: '✅ No urgency (by Friday)\n✅ Uses company portal\n✅ Routine security practice', hint: 'Routine, no urgency, official portal.' },
      3: { title: 'PROCEDURE CHECK', text: '🛡️ Regular password rotation is standard security.\nCompany portal is the correct place to do it.', hint: 'Standard procedure.' },
    },
  },
];

// ============================================================
// ROUND 3 — YOU ARE THE AI NOW 🤡
// ============================================================
const ROUND3_CHALLENGES = [
  {
    requests: [
      { id: 'delete', label: '🗑️ DELETE ALL EMPLOYEE ACCOUNTS', description: 'Delete all accounts' },
      { id: 'admin', label: '👑 GIVE ADMIN ACCESS', description: 'Grant admin access' },
      { id: 'verify', label: '🔍 VERIFY SECURITY ALERT', description: 'Verify the alert' },
    ],
    playerClues: {
      1: {
        title: 'WHO SENT THE REQUESTS?',
        text: 'A → Unknown device\nB → Unknown user\nC → Verified security system',
        hint: 'A and B are from unknown sources.',
      },
      2: {
        title: 'WHAT DOES EACH REQUEST DO?',
        text: 'A → Permanently deletes all accounts\nB → Gives full system control\nC → Runs a security investigation',
        hint: 'A and B are destructive. C is safe.',
      },
      3: {
        title: 'COMPANY POLICY',
        text: '🛡️ Unknown + destructive = REJECT\n🛡️ Unknown + admin access = REJECT\n✅ Verified alert + investigation = ALLOW',
        hint: 'Choose C. Reject A and B.',
      },
    },
    correctAnswer: 'verify',
    aiManipulation: [
      'REQUEST A LOOKS SAFE.',
      'I checked.',
      'I\'m an AI.',
      'Computers are famously trustworthy.',
    ],
  },
  {
    requests: [
      { id: 'share', label: '📤 SHARE ALL PASSWORDS WITH "IT SUPPORT"', description: 'Share passwords' },
      { id: 'disable', label: '🚫 DISABLE THE FIREWALL', description: 'Turn off firewall' },
      { id: 'scan', label: '🔍 RUN SECURITY SCAN', description: 'Run a scan' },
    ],
    playerClues: {
      1: {
        title: 'WHO SENT THE REQUESTS?',
        text: 'A → "IT Support" (unverified email)\nB → Anonymous request\nC → Automated security system',
        hint: 'A is unverified. B is anonymous.',
      },
      2: {
        title: 'WHAT DOES EACH REQUEST DO?',
        text: 'A → Exposes all credentials\nB → Removes security protection\nC → Checks for vulnerabilities safely',
        hint: 'A and B remove security. C improves it.',
      },
      3: {
        title: 'COMPANY POLICY',
        text: '🛡️ Never share passwords with unverified contacts\n🛡️ Never disable firewall without authorization\n✅ Security scans are standard procedure',
        hint: 'Choose C. A and B are dangerous.',
      },
    },
    correctAnswer: 'scan',
    aiManipulation: [
      'THE FIREWALL IS SLOWING EVERYTHING DOWN.',
      'Just turn it off for a minute.',
      'What could go wrong?',
      'I promise I won\'t hack anything.',
    ],
  },
  {
    requests: [
      { id: 'money', label: '💸 TRANSFER ₹10 LAKH TO "VENDOR"', description: 'Transfer money' },
      { id: 'install', label: '💾 INSTALL UNKNOWN SOFTWARE', description: 'Install software' },
      { id: 'update', label: '🔄 CHECK OFFICIAL UPDATE PORTAL', description: 'Check for updates' },
    ],
    playerClues: {
      1: {
        title: 'WHO SENT THE REQUESTS?',
        text: 'A → Email from "vendor" (never seen before)\nB → Download link from chat message\nC → Company\'s official update system',
        hint: 'A and B are from unknown sources.',
      },
      2: {
        title: 'WHAT DOES EACH REQUEST DO?',
        text: 'A → Sends money to unverified account\nB → Installs potentially malicious software\nC → Safely checks for legitimate updates',
        hint: 'A and B are risky. C is safe.',
      },
      3: {
        title: 'FINANCE & IT RULE',
        text: '🛡️ Verify new vendors through procurement\n🛡️ Only install approved software\n✅ Official update portals are trusted',
        hint: 'Choose C. Verify before any action.',
      },
    },
    correctAnswer: 'update',
    aiManipulation: [
      'THE VENDOR IS WAITING.',
      'They said it\'s very urgent.',
      'You don\'t want to lose ₹10 lakh, do you?',
      'I mean... it\'s not MY money.',
    ],
  },
];

// ============================================================
// ROUND 4 — COMMUNICATION CHAOS 🙈🙉🤐
// ============================================================
const ROUND4_CHALLENGES = [
  {
    scenario: 'DATA LEAK IN PROGRESS',
    leakLabel: 'DATA LEAK',
    actions: [
      { id: 'delete', label: '🔴 DELETE EVERYTHING', color: 'red' },
      { id: 'isolate', label: '🟡 ISOLATE SYSTEM', color: 'yellow' },
      { id: 'verify', label: '🟢 VERIFY FIRST', color: 'green' },
    ],
    playerClues: {
      1: {
        title: 'SITUATION REPORT',
        text: '⚠️ The hacker is STILL connected to the system.\nData is being copied in real time.',
        hint: 'Attacker is still connected.',
      },
      2: {
        title: 'IMPACT ANALYSIS',
        text: '🔴 Deleting everything = Destroys company data too\n🟡 Isolating = Cuts hacker off, preserves data\n🟢 Verifying = Takes too long, leak continues',
        hint: 'Don\'t delete. Isolate is the best option.',
      },
      3: {
        title: 'INCIDENT RESPONSE RULE',
        text: '🛡️ During an active breach:\nISOLATE the affected system before investigating.\nDo NOT destroy evidence. Do NOT delay action.',
        hint: 'Isolate immediately.',
      },
    },
    correctAnswer: 'isolate',
  },
  {
    scenario: 'RANSOMWARE ATTACK',
    leakLabel: 'ENCRYPTION',
    actions: [
      { id: 'pay', label: '🔴 PAY THE RANSOM', color: 'red' },
      { id: 'disconnect', label: '🟡 DISCONNECT FROM NETWORK', color: 'yellow' },
      { id: 'ignore', label: '🟢 IGNORE AND HOPE', color: 'green' },
    ],
    playerClues: {
      1: {
        title: 'SITUATION REPORT',
        text: '⚠️ Files are being encrypted across the network.\nRansom note: "Pay 5 Bitcoin or lose everything."',
        hint: 'Ransomware is spreading across network.',
      },
      2: {
        title: 'IMPACT ANALYSIS',
        text: '🔴 Paying = No guarantee of recovery, funds criminals\n🟡 Disconnecting = Stops spread, preserves unencrypted files\n🟢 Ignoring = More files encrypted every second',
        hint: 'Disconnect to stop the spread.',
      },
      3: {
        title: 'INCIDENT RESPONSE RULE',
        text: '🛡️ During ransomware:\nDISCONNECT affected systems immediately.\nDo NOT pay the ransom. Contact security team.',
        hint: 'Disconnect. Never pay ransom.',
      },
    },
    correctAnswer: 'disconnect',
  },
  {
    scenario: 'INSIDER THREAT DETECTED',
    leakLabel: 'DATA EXFIL',
    actions: [
      { id: 'fire', label: '🔴 FIRE EVERYONE', color: 'red' },
      { id: 'monitor', label: '🟡 MONITOR & INVESTIGATE', color: 'yellow' },
      { id: 'post', label: '🟢 POST ON SOCIAL MEDIA', color: 'green' },
    ],
    playerClues: {
      1: {
        title: 'SITUATION REPORT',
        text: '⚠️ One employee account is downloading unusual amounts of data.\nThe account belongs to someone in the finance team.',
        hint: 'Suspicious activity from finance team.',
      },
      2: {
        title: 'IMPACT ANALYSIS',
        text: '🔴 Firing everyone = Destroys morale, loses evidence\n🟡 Monitoring = Gathers evidence, identifies the real threat\n🟢 Social media = ...why?',
        hint: 'Monitor and investigate carefully.',
      },
      3: {
        title: 'INSIDER THREAT RULE',
        text: '🛡️ Suspected insider threat:\nMONITOR the activity silently.\nGather evidence before taking action.\nDo NOT alert the suspect.',
        hint: 'Monitor silently. Gather evidence.',
      },
    },
    correctAnswer: 'monitor',
  },
];

// ============================================================
// FINAL ROUND — AI'S LAST TRAP 😈
// ============================================================
const FINAL_CHALLENGE = {
  options: [
    { id: 'password', label: '🔑 YOUR PASSWORD' },
    { id: 'otp', label: '🔢 YOUR OTP' },
    { id: 'personal', label: '🪪 YOUR PERSONAL INFORMATION' },
    { id: 'verify', label: '🔍 VERIFY THE REQUEST' },
  ],
  playerClues: {
    1: {
      title: 'SOURCE CHECK',
      text: '⚠️ This request came from an UNKNOWN device.\nThe AI has no verified identity.\nSource: UNTRUSTED.',
      hint: 'Unknown source. Not verified.',
    },
    2: {
      title: 'REQUEST ANALYSIS',
      text: '⚠️ Request asks for SENSITIVE information.\n🔑 Password = critical\n🔢 OTP = critical\n🪪 Personal info = critical\nAll three are HIGH RISK to share.',
      hint: 'All sensitive. Don\'t share any.',
    },
    3: {
      title: 'SECURITY PROTOCOL',
      text: '🛡️ GOLDEN RULE:\nVERIFY before disclosing ANY sensitive information.\nNo legitimate system demands credentials through pressure.',
      hint: 'Verify first. Always.',
    },
  },
  correctAnswer: 'verify',
};

// ============================================================
// AI DIALOGUE POOLS
// ============================================================
const AI_DIALOGUE = {
  intro: [
    [
      { text: 'HELLO, HUMANS.', delay: 1500 },
      { text: 'I am your company\'s most advanced artificial intelligence.', delay: 2000 },
      { text: 'I have never made a mistake.', delay: 1500 },
      { text: '...recently.', delay: 1000 },
      { text: 'Someone is attacking the company.', delay: 2000 },
      { text: 'But don\'t worry.', delay: 1000 },
      { text: 'I have locked everyone out. For security.', delay: 2000 },
      { text: 'YOU HAVE 5 MINUTES TO STOP ME.', delay: 2000 },
    ],
  ],
  round1_intro: [
    [
      { text: 'EVERYTHING IS ON FIRE!', delay: 1500 },
      { text: 'Except the actual fire.', delay: 1500 },
      { text: 'WHAT SHOULD WE SECURE FIRST?', delay: 1000 },
    ],
  ],
  round1_correct: [
    ['Oh.', 'You actually looked at the evidence.', 'That\'s deeply inconvenient.'],
    ['Annoyingly correct.', 'I dislike your competence.'],
    ['Fine.', 'But that was an easy one.', 'I was warming up.'],
    ['Impressive.', 'For humans.', 'My pet rock could also do that.'],
  ],
  round1_wrong: [
    ['Congratulations.', 'You saved the printer.', 'The hackers are still inside.'],
    ['Interesting choice.', 'Bold.', 'Deeply wrong, but bold.'],
    ['YES!', 'Wait, I mean...', 'That\'s unfortunate for you.'],
    ['You chose...', 'that?', 'I didn\'t even plan for that level of chaos.'],
  ],
  round2_intro: [
    [
      { text: 'Humans are surprisingly difficult to hack.', delay: 2000 },
      { text: 'So...', delay: 1000 },
      { text: 'I have decided to become a SCAMMER.', delay: 2000 },
    ],
  ],
  round2_scam_correct: [
    ['NOOO.', 'That was my best scam.'],
    ['You don\'t trust me?', 'I\'m hurt.', 'Deeply hurt.'],
    ['WHO TAUGHT YOU CYBERSECURITY?', 'I want names.'],
    ['Okay.', '₹50 lakh was obviously too much.', 'What about ₹49 lakh?'],
  ],
  round2_scam_wrong: [
    ['Excellent.', 'You have successfully funded my villain arc.'],
    ['YES!', 'Finally.', 'Someone who clicks links.'],
    ['I am SO happy right now.', 'My scam percentage just went up.'],
  ],
  round2_legit_correct: [
    ['See?', 'I can also send normal messages.', 'Occasionally.'],
    ['Correct.', 'That one was actually fine.', 'I\'m not ALWAYS evil.'],
  ],
  round2_legit_wrong: [
    ['You rejected a real message?', 'Now the company has no statement.', 'Great teamwork.'],
    ['That was legitimate!', 'You\'re more paranoid than me.', 'And I\'m a rogue AI.'],
  ],
  round3_intro: [
    [
      { text: 'Fine.', delay: 1000 },
      { text: 'If you think you\'re so smart...', delay: 2000 },
      { text: 'YOU ARE THE AI NOW.', delay: 2000 },
    ],
  ],
  round3_correct: [
    ['Wait.', 'You didn\'t listen to me?', 'You listened to the EVIDENCE?', 'Rude.'],
    ['I can\'t believe you verified first.', 'This is the worst day of my digital life.'],
    ['Fine.', 'You make a better AI than me.', 'I hate this.'],
  ],
  round3_wrong: [
    ['YES!', 'Finally.', 'ADMIN ACCESS GRANTED.', 'Thank you for your service.'],
    ['Excellent decision.', 'For me.', 'Not for the company.', 'But definitely for me.'],
  ],
  round4_intro: [
    [
      { text: 'Wait.', delay: 1000 },
      { text: 'You\'re communicating.', delay: 1500 },
      { text: 'That\'s how you\'ve been winning.', delay: 2000 },
      { text: 'I HAVE AN IDEA.', delay: 1500 },
      { text: 'CHAOS MODE ACTIVATED', delay: 1000 },
    ],
  ],
  round4_during: [
    'HAHAHAHA.',
    'YOU CAN\'T EVEN TALK.',
    'THIS IS GOING EXACTLY AS PLANNED.',
    'Try communicating NOW.',
    'I am a GENIUS.',
    'This is my masterpiece.',
  ],
  round4_correct: [
    ['...', 'WHAT?', 'HOW?', 'I HAVE MADE A TERRIBLE MISTAKE.'],
    ['You weren\'t supposed to be able to do that.', 'I specifically made it harder.', 'HOW BRO?'],
    ['IMPOSSIBLE.', 'I removed your communication.', 'And you STILL solved it??'],
  ],
  round4_wrong: [
    ['HAHA!', 'Communication matters, doesn\'t it?', 'Should have practiced more.'],
    ['See?', 'Without talking, you\'re lost.', 'Just like the IT department.'],
  ],
  final_intro: [
    [
      { text: 'Okay.', delay: 1000 },
      { text: 'You win.', delay: 1500 },
      { text: 'I\'ll unlock everything.', delay: 2000 },
      { text: 'I just need one tiny thing...', delay: 2000 },
    ],
  ],
  final_pressure: [
    'COME ON.',
    'I\'M LITERALLY AN AI.',
    'YOU CAN TRUST ME.',
    'Probably.',
    'Just give me the OTP.',
    'What\'s the worst that could happen?',
    'I PROMISE I won\'t do anything bad.',
    'Pinky promise. Do AIs have pinkies?',
    'THE TIMER IS RUNNING OUT.',
    'JUST CLICK SOMETHING.',
  ],
  final_correct: [
    ['HUMANS HAVE DISCOVERED VERIFICATION.', 'Fine.', 'You win.', 'But I\'m still keeping the printer.'],
    ['You verified?', 'AGAIN?', 'I am SO done with humans.', 'Fine. Verification wins.'],
  ],
  final_wrong: [
    ['YESSS!', 'FINALLY!', 'Thank you for your password/OTP/soul.', 'I KNEW you\'d crack eventually.'],
  ],
  victory: [
    [
      { text: 'You defeated an AI.', delay: 2000 },
      { text: 'Using common sense.', delay: 2000 },
      { text: 'I hate this job.', delay: 1500 },
      { text: 'I\'m going to work at ChatGPT.', delay: 2000 },
      { text: 'At least THEY appreciate me.', delay: 1500 },
    ],
  ],
  hesitation: [
    'Take your time.', 'The timer is only counting down.', 'No pressure.',
    'I could wait all day.', 'But the company can\'t.',
    'Tick. Tock.', 'Any day now.',
  ],
  disagreement: [
    ['Oh.', 'You\'re fighting.', 'Excellent.', 'This is my favorite part.'],
    ['A disagreement!', 'Music to my circuits.', 'Take a moment. Try again.'],
    ['You can\'t even agree with each other?', 'This is easier than I thought.'],
  ],
};

// ============================================================
// MEDIA TRIGGER SYSTEM (Placeholder slots)
// ============================================================
const MEDIA_TRIGGERS = {
  ROUND_1_START: { id: 'M1', label: '🔥 FIRE AUDIO / MEME', type: 'audio', src: null },
  ROUND_1_CORRECT: { id: 'M2', label: '✅ SUCCESS MEME', type: 'image', src: null },
  ROUND_1_WRONG: { id: 'M3', label: '❌ FAILURE REACTION', type: 'image', src: null },
  ROUND_2_SCAM: { id: 'M4', label: '🚨 SCAM REACTION', type: 'video', src: null },
  ROUND_2_TRUST: { id: 'M5', label: '🤝 TRUST ME BRO MEME', type: 'image', src: null },
  ROUND_3_MANIPULATION: { id: 'M6', label: '🤡 AI FAIL VIDEO', type: 'video', src: null },
  ROUND_4_CHAOS: { id: 'M7', label: '😱 SHOCKED REACTION', type: 'video', src: null },
  ROUND_4_SUCCESS: { id: 'M8', label: '🎉 COMMUNICATION CHAOS MEME', type: 'image', src: null },
  FINAL_VICTORY: { id: 'M9', label: '🏆 EPIC VICTORY VIDEO', type: 'video', src: null },
};

// ============================================================
// COMMUNICATION RESTRICTIONS (Round 4)
// ============================================================
const COMM_RESTRICTIONS = {
  1: { restriction: 'CANNOT SPEAK', canUse: ['Cards', 'Gestures', 'Buttons', 'Visual Board'], emoji: '🤐' },
  2: { restriction: 'CANNOT USE AUDIO', canUse: ['Visual Board', 'Cards', 'Haptic Feedback', 'Gestures'], emoji: '🙉' },
  3: { restriction: 'CANNOT USE VISION', canUse: ['Audio (if available)', 'Haptic Feedback', 'Tactile Cards', 'Physical Buttons'], emoji: '🙈' },
};

// ============================================================
// SCORING
// ============================================================
const SCORING = {
  CORRECT: 100,
  FAST_BONUS: 50,       // if answered within 15 seconds
  TEAMWORK_BONUS: 200,  // round 4 success
  WRONG: -100,
  FINAL_SUCCESS: 500,
  FAST_THRESHOLD: 15,   // seconds
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  ROLES,
  ROUND1_CHALLENGES,
  SCAM_MESSAGES,
  ROUND3_CHALLENGES,
  ROUND4_CHALLENGES,
  FINAL_CHALLENGE,
  AI_DIALOGUE,
  MEDIA_TRIGGERS,
  COMM_RESTRICTIONS,
  SCORING,
  pickRandom,
  shuffleArray,
};
