let FileSaver = require('file-saver');

class User {

    constructor(attrs, Account, domainName = "/shared/fds"){
    if(attrs.subdomain === undefined) throw new Error('subdomain must be defined');
    if(attrs.wallet === undefined) throw new Error('wallet must be defined');

    this.Account = Account;
    this.Mail = this.Account.Mail;
    this.Tx = this.Account.Tx;
    this.SwarmStore = this.Account.SwarmStore;

    this.subdomain = attrs.subdomain;
    this.wallet = attrs.wallet;

    this.applicationDomain = domainName;
    //  /shared/fds/subdomain/public 
    return this;
  }

  toJSON(){
      return {
          subdomain: this.subdomain,
          wallet: this.wallet
      };
  }

  setApplicationDomain(domainName)
  {
      this.applicationDomain = domainName;
  }
   
  /**
  * Send file 
  * @param {any} recipientSubdomain name 
  * @param {any} file to send 
  * @param {any} applicationDomain  application domain node
  * @param {any} encryptionCallback callback
  * @param {any} uploadCallback callback
  * @param {any} progressMessageCallback callback
  * @returns {any} result
  */
  async send(recipientSubdomain, file, applicationDomain=this.applicationDomain, encryptionCallback = console.log, uploadCallback = console.log, progressMessageCallback = console.log) {
     encryptionCallback("ApplicationDomain:" + this.applicationDomain);
     return await this.Mail.send(this, recipientSubdomain, file, applicationDomain, encryptionCallback, uploadCallback, progressMessageCallback); 
  }

    /**
     * send tokens
     * @param {any} recipientAddress 0xfff
     * @param {any} amount in eth
     * @param {any} transactionCallback callback
     * @param {any} transactionSignedCallback callback
     * @returns {any} transaction
     */
    sendTokens(recipientAddress, amount, transactionCallback = console.log, transactionSignedCallback = console.log) {
        console.log("sending ", recipientAddress);
        return this.Tx.sendTokens(this, recipientAddress, amount, transactionCallback, transactionSignedCallback);
    }

    /**
    * Send amount of tokens to subdomain
    * @param {any} subdomain to whom to send subdomain
    * @param {any} amount in ethers
    * @returns {any} result
    */
    async sendTokensTo(subdomain, amount) {
        let recipientAddress = await this.getAddressOf(subdomain);
        return this.Tx.sendTokens(this, recipientAddress, amount);
    }

    /**
     * get address in form 0x...
     * @param {any} subdomain name of account
     * @returns {any} address 0x0 
     */
    async getAddressOf(subdomain) {
        let contact = await this.lookupContact(subdomain, console.log, console.log, console.log);
        let hex = "0x" + contact.publicKey.substring(2, 132);
        let hash = this.Tx.web3.utils.keccak256(hex);
        let recipientAddress = "0x" + hash.slice(24 + 2);
        return recipientAddress;
    }
    /**
     * deploy contract returns address
     * @param {any} abi abi
     * @param {any} bytecode bytecode
     * @param {any} args arguments
     * @param {any} nonce nonce
     * @param {any} gas gas
     * @returns {address} address
     */
    deployContract(abi, bytecode, args = [], nonce, gas = 1500000) {
        return this.Tx.deployContract(this, abi, bytecode, args, nonce, gas);
    }

    /**
     * Deploy contract returns 
     * @param {any} abi abi
     * @param {any} bytecode bytecode
     * @param {any} address address
     * @returns {object} contract object
     */
    getContract(abi, bytecode, address) {
        return this.Tx.getContract(this, abi, bytecode, address);
    }

    /**
     * Send file 
     * @param {any} recipientSubdomain name 
     * @param {any} file to send 
     * @param {any} encryptionCallback callback
     * @param {any} uploadCallback callback
     * @param {any} progressMessageCallback callback
     * @returns {any} result
     */
  getBalance(){
    return this.Tx.getBalance(this.address); 
  }    

  /**
    * Receive file
    * @param {any} message that points to file
    * @param {any} decryptionCallback callback 
    * @param {any} downloadCallback callback
    * @returns {any} returns file if success
    */
  async receive(message, decryptionCallback = console.log, downloadCallback = console.log) {
        if (message.to === this.subdomain) {
            return await this.Mail.receive(this, message, decryptionCallback, downloadCallback);
        } else if (message.from === this.subdomain) {
            return await this.Mail.retrieveSent(this, message, decryptionCallback, downloadCallback);
        } else {
            throw Error('there was a problem...');
        }
  }

    /**
     * Get messages
     * @param {any} query to lookup to
     * @param {any} applicationDomain where to look for messages 
     * @returns {any} available messages
     */
  messages(query = 'received', applicationDomain = this.applicationDomain){
    if(['received','sent', 'saved'].indexOf(query) === -1){
      throw new Error('must be of type received, sent or saved');
    }
    return this.Mail.getMessages(query, this, applicationDomain);
  }
    /**
     * store value
     * @param {any} key to store under
     * @param {any} value to store
     * @returns {any} stored result
     */
  storeValue(key, value){
    return this.SwarmStore.storeValue(key, value, this);
  }
    /**
     * retrieve value
     * @param {any} key to lookup
     * @returns {any} retrieved value
     */
  retrieveValue(key){
    return this.SwarmStore.retrieveValue(key, this);
  }  
    /**
     * store encrypted value
     * @param {any} key to store under
     * @param {any} value to store
     * @returns {any} decrypted value if exists
     */
  storeEncryptedValue(key, value){
    return this.SwarmStore.storeEncryptedValue(key, value, this, this.privateKey);
  }
    /**
     * retrieve decrypted value
     * @param {any} key to lookup
     * @returns {any} decrypted value if exists 
     */
  retrieveDecryptedValue(key){
    return this.SwarmStore.retrieveDecryptedValue(key, this.address, this.privateKey);
  }    
    /**
     * Store file
     * @param {any} file to store
     * @param {any} encryptionCallback callback 
     * @param {any} uploadCallback callback 
     * @param {any} progressMessageCallback callback 
     * @returns {string} hash where stored
     */
  store(file, encryptionCallback = console.log, uploadCallback = console.log, progressMessageCallback = console.log){
    return this.SwarmStore.storeFile(this, file, encryptionCallback, uploadCallback, progressMessageCallback);
  }
    /** @returns {Contact} array of contacts */
  getContacts(){
    return this.SwarmStore.getContacts(this);
  }
    /**
     * 
     * @param {Contact} contact to store
     * @returns {any} stored
     */
  storeContact(contact){
    return this.SwarmStore.storeContact(this, contact);
  }
    /**
     * Get contact if it exists
     * @param {any} recipientSubdomain name
     * @param {any} encryptProgressCallback callback
     * @param {any} uploadProgressCallback callback
     * @param {any} progressMessageCallback callback
     * @returns {Contact} contact
     */
  lookupContact(recipientSubdomain, encryptProgressCallback = console.log, uploadProgressCallback = console.log, progressMessageCallback = console.log)
  {
      return this.Mail.lookupContact(this, recipientSubdomain, encryptProgressCallback = console.log, uploadProgressCallback = console.log, progressMessageCallback = console.log);
  }
    /**
     * check stored files
     * @param {any} query to lookup
     * @returns {any} stored 
     */
  stored(query){
    return this.SwarmStore.getStored(query, this);
  }
    /** Get backup of wallet 
     * @returns {any} file
     */
  getBackup(){
    return {
      data: JSON.stringify(this.wallet), 
      name: `fds-wallet-${this.subdomain}-backup.json` 
    }
  }
    /** get wallet file 
     *  @returns {any} wallet file */
  getBackupFile(){
    return new File([JSON.stringify(this.wallet)], `fds-wallet-${this.subdomain}-backup.json`, {type: 'application/json'});
  }
    /** Save wallet backup
     *  @returns {any} result of save operation */
  saveBackupAs(){
    return FileSaver.saveAs(this.getBackupFile());
  }

}

module.exports = User;