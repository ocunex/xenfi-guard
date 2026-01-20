
import { generateKeyPairSync, createPrivateKey, createPublicKey } from 'crypto';

function generateWireGuardKeys() {
  // Generate X25519 key pair
  const { privateKey, publicKey } = generateKeyPairSync('x25519', {
    publicKeyEncoding: { format: 'der', type: 'spki' },
    privateKeyEncoding: { format: 'der', type: 'pkcs8' }
  });

  // Extract raw 32 bytes from DER structures. 
  // Should be standard if Node uses standard OIDs.
  
  // PKCS8 Private Key DER structure for X25519 (Curve25519):
  // It wraps the 32-byte private key.
  // Usually the last 32 bytes of the structure? Or at a fixed offset?
  // Let's print buffer length and hex to inspect or try to parse it.
  
  // Actually, 'x25519' private key in PKCS8 is wrapped in an OctetString.
  // For Node's implementation, it's roughly 48 bytes total?
  console.log('Private Key DER Len:', privateKey.length);
  console.log('Public Key DER Len:', publicKey.length);

  // According to RFC 8410:
  // Private Key matches CurvePrivateKey ::= OCTET STRING
  // Wrapped in OneAsymmetricKey.
  // Common offset for the 32-byte key in a 48-byte PKCS8 buffer is at the end.
  const rawPrivate = privateKey.subarray(privateKey.length - 32);
  
  // SPKI Public Key DER structure:
  // Wrapper + 32-byte key.
  // Standard SPKI for X25519 is 44 bytes. Key is last 32 bytes.
  const rawPublic = publicKey.subarray(publicKey.length - 32);

  return {
    privateKey: rawPrivate.toString('base64'),
    publicKey: rawPublic.toString('base64'),
    rawPrivateLen: rawPrivate.length,
    rawPublicLen: rawPublic.length
  };
}

const keys = generateWireGuardKeys();
console.log('Generated Keys:', keys);
console.log('Private Key Correct Length (44 base64)?', keys.privateKey.length === 44 && keys.privateKey.endsWith('='));
console.log('Public Key Correct Length (44 base64)?', keys.publicKey.length === 44 && keys.publicKey.endsWith('='));
