// initializeAllStaff.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBtWbPNRi4ia5a3pJ7aTFqqj9Z4aMN01Os",
  authDomain: "healthcamp-f0c93.firebaseapp.com",
  databaseURL: "https://healthcamp-f0c93-default-rtdb.firebaseio.com",
  projectId: "healthcamp-f0c93",
  storageBucket: "healthcamp-f0c93.firebasestorage.app",
  messagingSenderId: "210176603069",
  appId: "1:210176603069:web:ec38016d08a8051b1bd8d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const allStaffData = {
  nurses: {
    NUR001: {
      name: "Priya Sharma",
      empCode: "NUR001",
      role: "Nurse",
      displayName: "Priya Sharma (NUR001)"
    },
    NUR002: {
      name: "Anjali Gupta",
      empCode: "NUR002",
      role: "Nurse",
      displayName: "Anjali Gupta (NUR002)"
    },
    NUR003: {
      name: "Meera Singh",
      empCode: "NUR003",
      role: "Nurse",
      displayName: "Meera Singh (NUR003)"
    },
    NUR004: {
      name: "Deepika Patel",
      empCode: "NUR004",
      role: "Nurse",
      displayName: "Deepika Patel (NUR004)"
    },
    NUR005: {
      name: "Sneha Kumar",
      empCode: "NUR005",
      role: "Nurse",
      displayName: "Sneha Kumar (NUR005)"
    }
  },
  teamLeaders: {
    MS00118: {
      name: "Anjana Jha",
      empCode: "MS00118",
      role: "TeamLeader",
      displayName: "Anjana Jha (MS00118)"
    },
    MS01639: {
      name: "Dinesh Sekaran R",
      empCode: "MS01639",
      role: "TeamLeader",
      displayName: "Dinesh Sekaran R (MS01639)"
    },
    MS00090: {
      name: "Neha Agrawal",
      empCode: "MS00090",
      role: "TeamLeader",
      displayName: "Neha Agrawal (MS00090)"
    },
    MS01613: {
      name: "Manjula Dutta",
      empCode: "MS01613",
      role: "TeamLeader",
      displayName: "Manjula Dutta (MS01613)"
    },
    MS00029: {
      name: "Vipul Kumar Sharma",
      empCode: "MS00029",
      role: "TeamLeader",
      displayName: "Vipul Kumar Sharma (MS00029)"
    },
    MSN0001: {
      name: "SHUBHAM VERMA",
      empCode: "MSN0001",
      role: "TeamLeader",
      displayName: "SHUBHAM VERMA (MSN0001)"
    }
  },
  districtCoordinators: {
   
    MS02367: {
      name: "Karthikeyan Manoharan",
      empCode: "MS02367",
      role: "DC",
      displayName: "Karthikeyan Manoharan (MS02367)"
    }
  },
  regionalOfficers: {
    RO001: {
      name: "Sanjay Mehta",
      empCode: "RO001",
      role: "RO",
      displayName: "Sanjay Mehta (RO001)"
    },
    RO002: {
      name: "Meera Patel",
      empCode: "RO002",
      role: "RO",
      displayName: "Meera Patel (RO002)"
    }
  },
  salesOfficerManagers: {
    SOM001: {
      name: "Vikram Malhotra",
      empCode: "SOM001",
      role: "SOM",
      displayName: "Vikram Malhotra (SOM001)"
    },
    SOM002: {
      name: "Deepa Gupta",
      empCode: "SOM002",
      role: "SOM",
      displayName: "Deepa Gupta (SOM002)"
    }
  },
  agents: {
    AG001: {
      name: "Ravi Verma",
      empCode: "AG001",
      role: "Agent",
      displayName: "Ravi Verma (AG001)"
    },
    AG002: {
      name: "Sunita Yadav",
      empCode: "AG002",
      role: "Agent",
      displayName: "Sunita Yadav (AG002)"
    },
    AG003: {
      name: "Mohit Agarwal",
      empCode: "AG003",
      role: "Agent",
      displayName: "Mohit Agarwal (AG003)"
    }
  }
};

async function initializeAllStaffData() {
  try {
    // Store all staff data under different role categories
    const staffRef = ref(database, 'staffData');
    await set(staffRef, allStaffData);
    console.log('All staff data initialized successfully');

    // Also create a flattened version for easier searching
    const flattenedStaff = {};
    Object.values(allStaffData).forEach(roleGroup => {
      Object.entries(roleGroup).forEach(([id, data]) => {
        flattenedStaff[id] = data;
      });
    });
    
    const flattenedRef = ref(database, 'staffFlattened');
    await set(flattenedRef, flattenedStaff);
    console.log('Flattened staff data initialized successfully');

  } catch (error) {
    console.error('Error initializing staff data:', error);
  }
}

// Run the initialization
initializeAllStaffData().then(() => {
  console.log('Initialization complete');
  process.exit(0);
}).catch(error => {
  console.error('Initialization failed:', error);
  process.exit(1);
});