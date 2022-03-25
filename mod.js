
export class MX {
    constructor(data) {
        this.val = data;
    }
    get num() {
        return this.val;
    }
    static version() {
        return '1.2.3';
    }
}

// export {MX};
// module.exports.MX = MX;
// if (typeof module !== 'undefined' && typeof module.exports === 'object') { 
//     module.exports.MX = MX;
// }