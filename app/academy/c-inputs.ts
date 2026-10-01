import type { Json } from "./types.ts";
/** Real operands for every C fixture, including padding and exact 64-bit words.
 * The trusted native harness retains its C expressions and ABI assertions.
 * Hexadecimal strings preserve bits that JSON numbers cannot represent exactly.
 */
export const cInputs:Record<string,Json[]>={
  "c-field-replace":[{word:255,offset:2,width:3,value:0},{word:0,offset:4,width:2,value:7},{word:123,offset:31,width:2,value:0},{word:9,offset:0,width:32,value:42}],
  "c-rotate":[{word:2147483649,count:1},{word:12,count:32},{word:5,count:65}],
  "c-popcount":[0,61680,"0xffffffffffffffff","0x8000000000000000"],
  "c-sdk-bitset":[{bits:65,indices:[0,64,65]},{bits:130,indices:[129,129,63]},{bits:193,indices:[0]},{bits:0,indices:[]}],
  "c-bitset-union":[{a:[1,1],b:[2,2]},{a:[0,"0xffffffffffffffff"],b:[0,0]},{a:[3,0],b:[3,0]}],
  "c-bitset-intersection":[{a:7,b:5},{a:1,b:2},{a:"0xffffffffffffffff",b:"0x8000000000000000"}],
  "c-bitset-difference":[{allow:15,deny:5},{allow:7,deny:8},{allow:"0xffffffffffffffff",deny:"0xffffffffffffffff"}],
  "c-varint":[[172,2],[128],[255,255,255,255,15],[255,255,255,255,16],[1,0]],
  "c-checked-allocation":[{count:10,size:4,cap:40},{count:4294967295,size:4,cap:4294967295},{count:99,size:0,cap:10},{count:4,size:4,cap:15}],
  "c-padding-size":[0,1,2,3].map(query=>({query,fields:[{size:1,alignment:1},{size:4,alignment:4},{size:2,alignment:2}]})),
  "c-fieldwise-equality":[{a:{tag:1,counter:4,code:2},b:{tag:1,counter:4,code:2}},{a:{tag:1,counter:4,code:2},b:{tag:1,counter:5,code:2}},{a:{tag:1,counter:9,code:2,padding:[170,170,170,170,170]},b:{tag:1,counter:9,code:2,padding:[187,187,187,187,187]}}],
  "c-tagged-union":[{kind:0,value:{count:42}},{kind:1,value:{coordinate:-9}},{kind:7,value:{count:4}}],
  "c-float-bits":[1,"-0.0",-2],
  "c-overlap-move":[{destination:2,source:0,count:5},{destination:0,source:2,count:5},{destination:0,source:0,count:10}],
  "c-bounded-string":[{text:"abc",capacity:4},{text:"abc",capacity:3},{text:"",capacity:1},{text:null,capacity:0}],
  "c-ring-buffer":[{head:7,count:5,capacity:10},{head:1,count:4294967295,capacity:10},{head:4294967293,count:10,capacity:4294967295}],
  "c-saturating-counter":[{current:10,delta:20},{current:4294967294,delta:2},{current:4294967295,delta:0}],
};
