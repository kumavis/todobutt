
module.exports = createMsg

let now = 1514145261000
function createMsg(content){
  return {
    key: '%r53CkOrInck1DQ4cUuCzxoqVjvehoc0ZExQJIoZI8ms=.sha256',
    timestamp: now++,
    value: {
      timestamp: now++,
      previous: '%PQU15RZi0ynocgrbKSQxm+C32MFOBPONkspVlHcHvAc=.sha256',
      author: '@EvKYC7Y63xjYHuP/MuahSinTA9jLgW67r5y0GSGq5e0=.ed25519',
      sequence: 58,
      hash: 'sha256',
      signature: '69m1CVaw9WYjSxJG5oU0InBLNUULVlDi6g432/uSLLQ5YX6+6d44VF5yF5mafdKq6fl3koMNevNRxnQsk9q5CA==.sig.ed25519',
      content,
    },
  }
}