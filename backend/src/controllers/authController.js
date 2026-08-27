import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET, ROLES, CUSTOMER_TYPES } from '../config/constants.js';
import { store } from '../data/store.js';

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function login(req, res) {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginId = (identifier || email || mobile || '').trim();

    if (!loginId) {
      return res.status(400).json({ success: false, message: 'Please provide email or mobile number.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const allUsers = store.getCollection('users');
    const user = allUsers.find(
      u => (u.email && u.email.toLowerCase() === loginId.toLowerCase()) || u.mobile === loginId
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password.' });
    }

    // Verify password with bcrypt
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    let linkedProfile = null;
    if (user.role === ROLES.WORKER) {
      linkedProfile = store.findById('workers', user.workerId);
    } else if (user.role === ROLES.SOCIETY_ADMIN) {
      linkedProfile = store.findById('societies', user.societyId);
    } else if (user.role === ROLES.FEDERATION_ADMIN) {
      linkedProfile = store.findById('federations', user.federationId);
    }

    store.logAudit({
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      module: 'Authentication',
      recordId: user.id,
      details: `User logged in successfully as ${user.role}`
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
      linkedProfile
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'An error occurred during authentication.' });
  }
}

export function googleLogin(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google token required.' });
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid Google token format.' });
    }

    const email = payload.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google token does not contain email.' });
    }

    const name = payload.name || payload.given_name || 'Google User';
    const picture = payload.picture || '';
    const googleId = payload.sub;

    let user = store.findOne('users', { email });
    if (!user) {
      const generatedPassword = crypto.randomBytes(24).toString('hex');
      user = store.create('users', {
        id: `USR-GOOGLE-${Date.now()}`,
        name,
        email,
        password: bcrypt.hashSync(generatedPassword, 10),
        role: ROLES.CUSTOMER,
        mobile: '',
        location: { lat: 28.6140, lng: 77.2095, area: 'Central Metro', city: 'Delhi' },
        address: 'Google Account Address',
        customerType: CUSTOMER_TYPES.HOUSEHOLD,
        authProvider: 'google',
        googleId,
        picture
      });
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    let linkedProfile = null;
    if (user.role === ROLES.WORKER) {
      linkedProfile = store.findById('workers', user.workerId);
    } else if (user.role === ROLES.SOCIETY_ADMIN) {
      linkedProfile = store.findById('societies', user.societyId);
    } else if (user.role === ROLES.FEDERATION_ADMIN) {
      linkedProfile = store.findById('federations', user.federationId);
    }

    store.logAudit({
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN_GOOGLE',
      module: 'Authentication',
      recordId: user.id,
      details: 'User logged in via Google OAuth'
    });

    return res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: sanitizeUser(user),
      linkedProfile
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or unverified Google token.' });
  }
}

export function register(req, res) {
  try {
    const { name, email, mobile, password, role, customerType, institutionName, institutionType, contactPerson, ...extra } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile, password, and role are required.' });
    }

    const validRoles = [ROLES.CUSTOMER, ROLES.WORKER, ROLES.SOCIETY_ADMIN, ROLES.FEDERATION_ADMIN, ROLES.PLATFORM_ADMIN];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existing = store.findOne('users', { email: emailTrimmed });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = store.create('users', {
      name: name.trim(),
      email: emailTrimmed,
      mobile: mobile.trim(),
      role,
      customerType: customerType || CUSTOMER_TYPES.HOUSEHOLD,
      institutionName: institutionName || null,
      institutionType: institutionType || null,
      contactPerson: contactPerson || null,
      password: hashedPassword,
      address: extra.address || 'Central Metro',
      location: extra.location || { lat: 28.6140, lng: 77.2095, area: extra.serviceArea || 'Central Metro', city: 'Delhi' },
      societyId: extra.societyId || (role === ROLES.SOCIETY_ADMIN ? 'SOC-DEMO-001' : undefined),
      federationId: extra.federationId || (role === ROLES.FEDERATION_ADMIN ? 'FED-DEMO-001' : undefined)
    });

    let linkedProfile = null;

    if (role === ROLES.WORKER) {
      const newWorker = store.create('workers', {
        userId: newUser.id,
        code: `WRK-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        name: newUser.name,
        societyId: extra.societyId || 'SOC-DEMO-001',
        serviceCategories: extra.serviceCategories || [extra.primarySkill || 'General Maintenance'],
        primarySkill: extra.primarySkill || 'General Maintenance',
        secondarySkills: extra.secondarySkills || [],
        experienceYears: Number(extra.experienceYears) || 2,
        certifications: [
          {
            code: `CERT-DEMO-${Math.floor(100 + Math.random() * 900)}`,
            title: `Sample ${extra.primarySkill || 'Skill'} Certificate`,
            issuedBy: 'Cooperative Skill Verification Board',
            issuedDate: new Date().toISOString().split('T')[0],
            verified: false
          }
        ],
        verificationStatus: 'Pending',
        isOnline: true,
        currentWorkload: 'Underutilized',
        activeJobsCount: 0,
        recentCompletedJobs: 0,
        ratingAvg: 5.0,
        ratingCount: 0,
        totalEarningsGross: 0,
        location: { lat: 28.615, lng: 77.210, area: extra.serviceArea || 'Central Metro' },
        welfareId: `WELFARE-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        insuranceId: `INS-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        serviceAreas: [extra.serviceArea || 'Central Metro'],
        reliabilityScore: 90
      });

      store.findByIdAndUpdate('users', newUser.id, { workerId: newWorker.id });
      newUser.workerId = newWorker.id;
      linkedProfile = newWorker;
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    store.logAudit({
      actorName: newUser.name,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      module: 'Authentication',
      recordId: newUser.id,
      details: `New ${role} registered`
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitizeUser(newUser),
      linkedProfile
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'An error occurred during registration.' });
  }
}

export function getProfile(req, res) {
  try {
    const user = req.user;
    let linkedProfile = null;
    if (user.role === ROLES.WORKER) {
      linkedProfile = store.findById('workers', user.workerId);
    } else if (user.role === ROLES.SOCIETY_ADMIN) {
      linkedProfile = store.findById('societies', user.societyId);
    } else if (user.role === ROLES.FEDERATION_ADMIN) {
      linkedProfile = store.findById('federations', user.federationId);
    }

    return res.json({ success: true, user: sanitizeUser(user), linkedProfile });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'An error occurred while fetching profile.' });
  }
}

export function logout(req, res) {
  try {
    if (req.user) {
      store.logAudit({
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'USER_LOGOUT',
        module: 'Authentication',
        recordId: req.user.id,
        details: 'User logged out'
      });
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getDemoAccounts(req, res) {
  try {
    const demoAccounts = [
      {
        roleName: 'Customer (Household)',
        role: ROLES.CUSTOMER,
        email: 'customer01@demo.coop',
        password: 'password123',
        description: 'Customer Demo 01 - Household problem search, booking, OTP & payment flow'
      },
      {
        roleName: 'Customer (Institution - Clinic)',
        role: ROLES.CUSTOMER,
        email: 'institution01@demo.coop',
        password: 'password123',
        description: 'Customer Demo 02 - Healthcare facility & institutional service bookings'
      },
      {
        roleName: 'Worker B (Low Workload - Recommended)',
        role: ROLES.WORKER,
        email: 'worker01@demo.coop',
        password: 'password123',
        description: 'Worker Demo 01 - Plumber with balanced workload (Fair allocation top rank)'
      },
      {
        roleName: 'Worker A (High Workload - 8 Jobs)',
        role: ROLES.WORKER,
        email: 'worker02@demo.coop',
        password: 'password123',
        description: 'Worker Demo 02 - Plumber with 8 active jobs (Fatigue protection deprioritized)'
      },
      {
        roleName: 'Society Administrator',
        role: ROLES.SOCIETY_ADMIN,
        email: 'society01.admin@demo.coop',
        password: 'password123',
        description: 'Society Admin 01 - Central Metro Labour Cooperative Society'
      },
      {
        roleName: 'Federation Administrator',
        role: ROLES.FEDERATION_ADMIN,
        email: 'federation.admin@demo.coop',
        password: 'password123',
        description: 'Federation Admin 01 - Regional federation analytics and coordination'
      },
      {
        roleName: 'Platform Administrator',
        role: ROLES.PLATFORM_ADMIN,
        email: 'platform.admin@demo.coop',
        password: 'password123',
        description: 'Platform Admin 01 - System catalog & audit log supervision'
      }
    ];

    return res.json({ success: true, demoAccounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving demo accounts' });
  }
}

export function resetDemoData(req, res) {
  try {
    store.reset();
    store.logAudit({
      actorName: req.user?.name || 'System Reset',
      actorRole: req.user?.role || 'admin',
      action: 'DATA_STORE_RESET',
      module: 'System',
      recordId: 'ALL',
      details: 'Restored clean connected demo dataset with hashed credentials'
    });
    return res.json({ success: true, message: 'All demo data has been reset to default clean state.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error resetting data store.' });
  }
}
