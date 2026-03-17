import msgpack from 'msgpack5';

const msg = msgpack();

/**
 * Binary Protocol Helper using MessagePack
 * @recommendation Networking #5 - Binary Data Transmission
 */
export class BinaryProtocol {
    /**
     * Encode JSON object to Binary (Buffer)
     * @param {object} data 
     * @returns {Buffer}
     */
    static encode(data) {
        return msg.encode(data);
    }

    /**
     * Decode Binary (Buffer) to JSON object
     * @param {Buffer} buffer 
     * @returns {object}
     */
    static decode(buffer) {
        return msg.decode(buffer);
    }
}
