const crypto = require("crypto");
const secret = process.argv[2];
const payload = process.argv[3];
console.log(crypto.createHmac("sha256", secret).update(payload).digest("base64url"));
