const crypto = require('crypto');
import constsSecret from "consts/consts-secret"

class CryptoHelper {

    sha256(data){


        const hash = crypto.createHmac('sha256', constsSecret.crypto.SECRET )
            .update(data)
            .digest();

        return hash;

    }

    encryptText(text){
        return this.encrypt(Buffer.from(text));
    }

    encrypt(text) {

        let cipher = crypto.createCipheriv('aes-256-cbc', constsSecret.crypto.KEY, constsSecret.crypto.IV );
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted;
    }

    decryptText(text){
        return this.decrypt(text).toString();
    }

    decrypt(input) {
        let encryptedText = Buffer.from( input, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', constsSecret.crypto.KEY, constsSecret.crypto.IV );
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    }


}

export default new CryptoHelper();