
import { generateKeyPairSync } from 'crypto';

function generateKeys() {
    const { privateKey: priv, publicKey: pub } = generateKeyPairSync('x25519', {
        publicKeyEncoding: { type: 'spki', format: 'der' },
        privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });

    const rawPrivate = priv.subarray(priv.length - 32);
    const rawPublic = pub.subarray(pub.length - 32);

    const privateKey = rawPrivate.toString('base64');
    const publicKey = rawPublic.toString('base64');

    console.log("Private Key:", privateKey);
    console.log("Public Key:", publicKey);
    console.log("Private Key Length (B64):", privateKey.length);
    console.log("Public Key Length (B64):", publicKey.length);

    if (privateKey.length !== 44 || !privateKey.endsWith('=')) {
        console.error("INVALID PRIVATE KEY FORMAT");
    }
    if (publicKey.length !== 44 || !publicKey.endsWith('=')) {
        console.error("INVALID PUBLIC KEY FORMAT");
    }
}

generateKeys();
