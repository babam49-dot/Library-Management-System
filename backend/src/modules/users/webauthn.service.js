const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const pool = require('../../db');
const userService = require('./users.service');
const jwt = require('jsonwebtoken');

const rpName = 'UniLibrary WebAuthn';
const rpID = 'localhost';
// Adjust origin according to your frontend port
const origin = process.env.FRONTEND_URL || 'http://localhost:5173';

// In-memory challenge store. In production use Redis.
// Key: userId for registration, email/identifier for login
const challengeStore = {};

const beginRegistration = async (userId) => {
  const user = await userService.getUserById(userId);
  if (!user) throw { status: 404, message: "User not found" };

  const [credentials] = await pool.execute('SELECT * FROM WebAuthnCredentials WHERE UserID = ?', [userId]);

  // v13 requires userID as Uint8Array
  const userIDBytes = new TextEncoder().encode(String(user.UserID));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIDBytes,
    userName: user.Email,
    userDisplayName: user.FullName || user.Email,
    // Don't prompt users for their authenticator if they've already registered it
    excludeCredentials: credentials.map(c => ({
      id: Buffer.from(c.CredentialID, 'base64').toString('base64url'),
      type: 'public-key',
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform', // force Windows Hello / built-in fingerprint
    },
  });

  // Store challenge
  challengeStore[`reg_${userId}`] = options.challenge;

  return options;
};

const completeRegistration = async (userId, response) => {
  const user = await userService.getUserById(userId);
  if (!user) throw { status: 404, message: "User not found" };

  const expectedChallenge = challengeStore[`reg_${userId}`];
  if (!expectedChallenge) throw { status: 400, message: "No registration challenge found" };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    throw { status: 400, message: error.message };
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    // Support both old (@simplewebauthn/server <10) and new (>=10) field names
    const credentialID = registrationInfo.credential?.id
      ?? registrationInfo.credentialID;
    const credentialPublicKey = registrationInfo.credential?.publicKey
      ?? registrationInfo.credentialPublicKey;
    const counter = registrationInfo.credential?.counter
      ?? registrationInfo.counter ?? 0;

    if (!credentialID || !credentialPublicKey) {
      throw { status: 500, message: 'Registration response missing credential data' };
    }

    // Convert to base64 for DB storage
    const credIdBase64 = Buffer.from(credentialID).toString('base64');
    const pubKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');

    await pool.execute(
      'INSERT INTO WebAuthnCredentials (UserID, CredentialID, PublicKey, Counter) VALUES (?, ?, ?, ?)',
      [userId, credIdBase64, pubKeyBase64, counter]
    );

    delete challengeStore[`reg_${userId}`];
    return { verified: true };
  }
  
  throw { status: 400, message: "Verification failed" };
};

const beginLogin = async (identifier, loginType) => {
  // Find the user by primary identifier type, then fall back to email
  let users = [];

  if (loginType === 'student') {
    // Try StudentID first, then email
    [users] = await pool.execute(
      'SELECT u.* FROM Users u JOIN Members m ON m.UserID = u.UserID WHERE m.StudentID = ?', [identifier]
    );
    if (users.length === 0) {
      [users] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [identifier]);
    }
  } else if (loginType === 'staff') {
    // Try StaffIdentifier first, then email
    [users] = await pool.execute(
      'SELECT u.* FROM Users u JOIN Staff s ON s.UserID = u.UserID WHERE s.StaffIdentifier = ?', [identifier]
    );
    if (users.length === 0) {
      [users] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [identifier]);
    }
  } else {
    // Default: email lookup
    [users] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [identifier]);
  }

  if (users.length === 0) throw { status: 404, message: "User not found" };
  const user = users[0];

  const [credentials] = await pool.execute('SELECT * FROM WebAuthnCredentials WHERE UserID = ?', [user.UserID]);
  if (credentials.length === 0) throw { status: 400, message: "No fingerprint registered for this user" };

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map(c => ({
      id: Buffer.from(c.CredentialID, 'base64').toString('base64url'),
      type: 'public-key',
      transports: ['internal'], // signal platform authenticator, prevent USB key dialog
    })),
    userVerification: 'preferred',
  });

  // Store challenge
  challengeStore[`auth_${user.UserID}`] = options.challenge;

  return { options, userId: user.UserID };
};

const completeLogin = async (userId, response) => {
  const expectedChallenge = challengeStore[`auth_${userId}`];
  if (!expectedChallenge) throw { status: 400, message: "No login challenge found" };

  const [credentials] = await pool.execute('SELECT * FROM WebAuthnCredentials WHERE UserID = ?', [userId]);
  const credentialIdStr = response.id;
  
  const credential = credentials.find(c => {
     const dbCredIdStr = Buffer.from(c.CredentialID, 'base64').toString('base64url');
     return dbCredIdStr === credentialIdStr || c.CredentialID === credentialIdStr || Buffer.from(c.CredentialID, 'base64').toString('hex') === Buffer.from(credentialIdStr, 'base64url').toString('hex');
  }) || credentials[0]; // fallback to first if exact match fails due to encoding differences in simplewebauthn

  if (!credential) throw { status: 400, message: "Credential not found in DB" };

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(credential.CredentialID, 'base64'),
        publicKey: Buffer.from(credential.PublicKey, 'base64'),
        counter: credential.Counter,
      },
    });
  } catch (error) {
    throw { status: 400, message: error.message };
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    await pool.execute('UPDATE WebAuthnCredentials SET Counter = ? WHERE id = ?', [authenticationInfo.newCounter, credential.id]);
    delete challengeStore[`auth_${userId}`];

    // Generate token similar to users.service.js login
    const user = await userService.getUserById(userId);
    let extensionProfile = null;
    if (user.RoleName === 'Member') {
      const [members] = await pool.execute('SELECT * FROM Members WHERE UserID = ?', [user.UserID]);
      extensionProfile = members[0];
    } else if (user.RoleName === 'Staff' || user.RoleName === 'Admin') {
      const [staff] = await pool.execute('SELECT * FROM Staff WHERE UserID = ?', [user.UserID]);
      extensionProfile = staff[0];
    }

    const tokenPayload = {
      UserID: user.UserID,
      RoleID: user.RoleID,
      RoleName: user.RoleName,
      ...(user.RoleName === 'Member' ? { MemberID: extensionProfile?.MemberID } : { StaffID: extensionProfile?.StaffID || null })
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    
    return {
      token,
      user: {
        ...tokenPayload,
        FullName: user.FullName,
        Email: user.Email,
        Status: user.Status,
        memberContext: user.RoleName === 'Member' ? extensionProfile : null
      }
    };
  }
  
  throw { status: 400, message: "Verification failed" };
};

const hasFingerprint = async (userId) => {
  const [rows] = await pool.execute('SELECT id FROM WebAuthnCredentials WHERE UserID = ? LIMIT 1', [userId]);
  return rows.length > 0;
};

module.exports = {
  beginRegistration,
  completeRegistration,
  beginLogin,
  completeLogin,
  hasFingerprint
};
