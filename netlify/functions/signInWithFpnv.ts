import { JwtVerifier } from "aws-jwt-verify";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth, UserRecord } from "firebase-admin/auth";

// Find your Firebase project number in the Firebase console.
const FIREBASE_PROJECT_NUMBER = "948313425033";

// The issuer and audience claims of the FPNV token are specific to your project.
const issuer = `https://fpnv.googleapis.com/projects/${FIREBASE_PROJECT_NUMBER}`;
const audience = `https://fpnv.googleapis.com/projects/${FIREBASE_PROJECT_NUMBER}`;

// The JWKS URL contains the current public signing keys for FPNV tokens.
const jwksUri = "https://fpnv.googleapis.com/v1beta/jwks";

// Configure a JWT verifier to check the token
const fpnvVerifier = JwtVerifier.create({ issuer, audience, jwksUri });

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Get the FPNV token from the request body.
    let fpnvToken;
    try {
        const bodyText = await req.text();
        try {
            const bodyJson = JSON.parse(bodyText);
            fpnvToken = bodyJson.fpnvToken || bodyJson.token || bodyText;
        } catch {
            fpnvToken = bodyText; // Use raw body if not JSON
        }
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    if (!fpnvToken) {
        return new Response('Bad Request', { status: 400 });
    }

    let verifiedPhoneNumber;
    try {
        // Attempt to verify the token using the verifier configured above.
        const verifiedPayload = await fpnvVerifier.verify(fpnvToken);

        // If verification succeeds, the subject claim of the token contains the
        // verified phone number.
        verifiedPhoneNumber = verifiedPayload.sub;
    } catch (error) {
        // If verification fails, reject the token.
        return new Response('Forbidden: Invalid token', { status: 403 });
    }

    if (!verifiedPhoneNumber) {
        return new Response('Forbidden: No phone number in token subject', { status: 403 });
    }

    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
        try {
            const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (serviceAccountStr) {
                const serviceAccount = JSON.parse(serviceAccountStr);
                initializeApp({
                    credential: cert(serviceAccount)
                });
            } else {
                // Try initializing with default credentials
                initializeApp();
            }
        } catch (e) {
            console.error("Failed to initialize Firebase Admin:", e);
            if (!getApps().length) initializeApp();
        }
    }

    const authAdmin = getAuth();
    
    // Now that you have a verified phone number, look it up in your Firebase
    // project's user database.
    let user: UserRecord;
    try {
        // If a user account already exists with the phone number, retrieve it.
        user = await authAdmin.getUserByPhoneNumber(verifiedPhoneNumber);
    } catch {
        // Otherwise, create a new user account using the phone number.
        user = await authAdmin.createUser({phoneNumber: verifiedPhoneNumber});
    }

    // Finally, mint a Firebase custom auth token containing the UID of the user
    // you looked up or created. Return this token to the caller.
    const authToken = await authAdmin.createCustomToken(user.uid);
    return new Response(JSON.stringify({ authToken }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
